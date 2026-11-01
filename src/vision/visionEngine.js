import { WASM_PATH, POSE_MODEL, CLASSIFIER_MODEL, resolveModel } from './modelPaths.js';

// MediaPipe runs entirely in the browser (WebAssembly + GPU). Models load
// once and are reused. Nothing is uploaded anywhere.
// The MediaPipe library is loaded on demand (code-split) so the home screen
// opens fast; it's only fetched when you start a scan or exercise.
let libPromise = null;
const lib = () => (libPromise ??= import('@mediapipe/tasks-vision'));

let filesetPromise = null;
let posePromise = null;
let classifierPromise = null;

const fileset = () => (filesetPromise ??= lib().then(({ FilesetResolver }) => FilesetResolver.forVisionTasks(WASM_PATH)));

async function withDelegateFallback(create) {
  try {
    return await create('GPU');
  } catch (err) {
    console.warn('[vision] GPU delegate failed, using CPU', err);
    return create('CPU');
  }
}

export function getPoseLandmarker() {
  posePromise ??= (async () => {
    const [{ PoseLandmarker }, vision, modelAssetPath] = await Promise.all([lib(), fileset(), resolveModel(POSE_MODEL)]);
    return withDelegateFallback((delegate) =>
      PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath, delegate },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      }),
    );
  })().catch((err) => {
    posePromise = null;
    throw err;
  });
  return posePromise;
}

export function getImageClassifier() {
  classifierPromise ??= (async () => {
    const [{ ImageClassifier }, vision, modelAssetPath] = await Promise.all([lib(), fileset(), resolveModel(CLASSIFIER_MODEL)]);
    // The int8 (quantised, 5 MB) model must run on the CPU delegate: on GPU
    // MediaPipe hands float tensors to the int8 de-quantiser and every frame
    // fails. At ~7 classifications/second the CPU is plenty fast.
    return ImageClassifier.createFromOptions(vision, {
      baseOptions: { modelAssetPath, delegate: 'CPU' },
      runningMode: 'VIDEO',
      maxResults: 5,
    });
  })().catch((err) => {
    classifierPromise = null;
    throw err;
  });
  return classifierPromise;
}

/** Normalise classifier output to [{ label, score }]. */
export function toCategories(result) {
  const cats = result?.classifications?.[0]?.categories || [];
  return cats.map((c) => ({ label: c.displayName || c.categoryName, score: c.score }));
}
