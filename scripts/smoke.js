// End-to-end smoke test: builds nothing, just drives `vite preview` in a real
// Chromium with a fake camera. Usage: npm run build && npm run smoke
// Screenshots go to ./screenshots (git-ignored).
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { loadPlaywright } from './playwright.js';

const PORT = 4173;
const URL = `http://localhost:${PORT}`;
const shots = 'screenshots';
await mkdir(shots, { recursive: true });

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe', detached: true });
const stopServer = () => {
  try {
    process.kill(-server.pid);
  } catch {
    /* already gone */
  }
};
await new Promise((resolve, reject) => {
  server.stdout.on('data', (d) => d.toString().includes(String(PORT)) && resolve());
  server.on('exit', reject);
  setTimeout(resolve, 8000);
});

const { chromium } = await loadPlaywright();
const browser = await chromium.launch({
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, permissions: ['camera'] });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

let step = 0;
const shot = (name) => page.screenshot({ path: `${shots}/${String(++step).padStart(2, '0')}-${name}.png` });
const ok = (msg) => console.log(`  ✓ ${msg}`);

try {
  await page.goto(URL);
  await page.getByRole('heading', { name: /Wake up by moving/ }).waitFor();
  await shot('home-first-run');
  ok('home loads with welcome card');

  // Settings: tap-to-count (fake camera has no person) + fast breathing.
  await page.getByRole('link', { name: /Settings/ }).click();
  await page.getByText('Tap to count reps').click();
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Fewer seconds in' }).click();
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Fewer seconds out' }).click();
  await shot('settings');
  ok('settings saved');

  // Add an alarm.
  await page.getByRole('link', { name: /Alarm/ }).first().click();
  await page.getByRole('button', { name: 'Got it' }).click();
  await page.getByRole('link', { name: '+ Add' }).click();
  await page.locator('input[type=time]').fill('06:45');
  await shot('alarm-edit');
  await page.getByRole('button', { name: 'Save alarm' }).click();
  await page.getByText('Next alarm').waitFor();
  await shot('home-with-alarm');
  ok('alarm created and shown as next alarm');

  // Pairing screen loads the on-device classifier.
  await page.getByRole('link', { name: /Routines/ }).click();
  await page.getByRole('link', { name: /Tiny wake-up/ }).click();
  await page.getByRole('button', { name: /Pair a new object/ }).click();
  await page.locator('.seeing meter').first().waitFor({ timeout: 60000 });
  await shot('pair-classifier-running');
  ok('object classifier loaded and classifying camera frames');
  await page.getByRole('button', { name: 'Cancel' }).click();

  // Wake-up flow.
  await page.getByRole('link', { name: /Alarm/ }).first().click();
  await page.getByRole('button', { name: /Try a wake-up now/ }).click();
  await page.getByRole('button', { name: /I’m up/ }).waitFor();
  await shot('ringing');
  ok('alarm rings');
  await page.getByRole('button', { name: /I’m up/ }).click();

  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByText(/Step into view|Turn side-on|Ready/).waitFor({ timeout: 60000 });
  await shot('squats-camera');
  ok('pose model loaded and running on camera');
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: /\+1 rep/ }).click();

  await page.getByRole('heading', { name: /Deep breaths/ }).waitFor();
  await page.getByRole('button', { name: 'Start' }).click();
  await page.waitForTimeout(4500);
  await shot('breathing');
  await page.getByRole('heading', { name: 'You’re up!' }).waitFor({ timeout: 30000 });
  await shot('results');
  ok('routine completed → results');

  await page.getByRole('button', { name: 'Done' }).click();
  await page.reload();
  await page.getByRole('link', { name: /History/ }).click();
  await page.getByText(/Tiny wake-up · 5 reps · 3 breaths/).waitFor();
  await shot('history');
  ok('history survives a reload (IndexedDB)');

  const sw = await page.evaluate(async () => Boolean(await navigator.serviceWorker.getRegistration()));
  if (!sw) throw new Error('service worker not registered');
  ok('service worker registered');
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('heading', { name: 'History' }).waitFor();
  ok('app reloads offline');
  await context.setOffline(false);

  const real = errors.filter((e) => !/favicon|ERR_INTERNET_DISCONNECTED|XNNPACK/.test(e));
  if (real.length) console.log('Console errors:\n' + real.join('\n'));
  console.log('\nSmoke test passed.');
} catch (err) {
  await shot('failure');
  console.error('Smoke test FAILED:', err.message);
  if (errors.length) console.error(errors.slice(0, 5).join('\n'));
  process.exitCode = 1;
} finally {
  await browser.close();
  stopServer();
}
