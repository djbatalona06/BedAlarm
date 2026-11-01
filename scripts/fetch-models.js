// Downloads the two on-device AI models and copies MediaPipe's WebAssembly
// runtime into /public so the app can run 100% offline after first load.
// Runs automatically after `npm install`. Safe to run again: it skips files
// that already exist.
import { mkdir, copyFile, readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const modelsDir = join(root, 'public', 'models');
const wasmDir = join(root, 'public', 'wasm');
const wasmSrc = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');

const MODELS = [
  {
    file: 'pose_landmarker_lite.task',
    url: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
  },
  {
    file: 'efficientnet_lite0.tflite',
    url: 'https://storage.googleapis.com/mediapipe-models/image_classifier/efficientnet_lite0/int8/latest/efficientnet_lite0.tflite',
  },
];

async function copyWasm() {
  if (!existsSync(wasmSrc)) {
    console.warn('[assets] @mediapipe/tasks-vision not installed yet; skipping wasm copy');
    return;
  }
  await mkdir(wasmDir, { recursive: true });
  for (const name of await readdir(wasmSrc)) {
    await copyFile(join(wasmSrc, name), join(wasmDir, name));
  }
  console.log('[assets] copied MediaPipe wasm runtime -> public/wasm');
}

async function fetchModels() {
  await mkdir(modelsDir, { recursive: true });
  for (const { file, url } of MODELS) {
    const target = join(modelsDir, file);
    if (existsSync(target) && (await stat(target)).size > 0) {
      console.log(`[assets] ${file} already present`);
      continue;
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await writeFile(target, Buffer.from(await res.arrayBuffer()));
      console.log(`[assets] downloaded ${file}`);
    } catch (err) {
      // Never break `npm install` — the app falls back to loading the model
      // from Google's CDN at runtime (see src/vision/modelPaths.js).
      console.warn(`[assets] could not download ${file}: ${err.message}`);
    }
  }
}

await copyWasm();
await fetchModels();
