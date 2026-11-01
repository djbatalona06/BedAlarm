// Renders public/icons/icon.svg to the PNG sizes the PWA manifest needs.
// Uses the Playwright Chromium already on the machine. Run: node scripts/render-icons.js
import { loadPlaywright } from './playwright.js';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
const svg = await readFile(join(dir, 'icon.svg'), 'utf8');
const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage();

async function render(size, file, { padding = 0, bg = 'transparent' } = {}) {
  await page.setViewportSize({ width: size, height: size });
  const inner = size - padding * 2;
  await page.setContent(
    `<body style="margin:0;background:${bg};display:grid;place-items:center;width:${size}px;height:${size}px">
       <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div>
     </body>`,
  );
  await page.screenshot({ path: join(dir, file), omitBackground: bg === 'transparent' });
}

await render(192, 'icon-192.png');
await render(512, 'icon-512.png');
await render(180, 'apple-touch-icon.png', { bg: '#0b0d17' });
await render(512, 'icon-maskable-512.png', { padding: 56, bg: '#0b0d17' });
await browser.close();
console.log('icons rendered');
