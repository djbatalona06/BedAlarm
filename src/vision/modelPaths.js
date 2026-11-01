// Models are served from our own origin (downloaded by scripts/fetch-models.js)
// so they can be cached for offline use. If they are missing we fall back to
// Google's public model bucket.
const base = import.meta.env.BASE_URL;

export const WASM_PATH = `${base}wasm`;

export const POSE_MODEL = {
  local: `${base}models/pose_landmarker_lite.task`,
  remote:
    'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
};

export const CLASSIFIER_MODEL = {
  local: `${base}models/efficientnet_lite0.tflite`,
  remote:
    'https://storage.googleapis.com/mediapipe-models/image_classifier/efficientnet_lite0/int8/latest/efficientnet_lite0.tflite',
};

export async function resolveModel({ local, remote }) {
  try {
    const res = await fetch(local, { method: 'HEAD' });
    if (res.ok) return local;
  } catch {
    /* offline and not cached: try remote */
  }
  return remote;
}
