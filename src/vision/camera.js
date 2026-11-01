// Camera access. Only called when the user starts a scan or an exercise —
// never on app load. Video frames stay on the device.
export async function openCamera(video, facingMode = 'user') {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('This browser cannot use the camera. Try Chrome or Safari over https.');
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
  });
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play().catch(() => {});
  if (video.readyState < 2) {
    await new Promise((resolve) => video.addEventListener('loadeddata', resolve, { once: true }));
  }
  return stream;
}

export function closeCamera(stream, video) {
  stream?.getTracks().forEach((t) => t.stop());
  if (video) video.srcObject = null;
}

export function cameraErrorMessage(err) {
  if (err?.name === 'NotAllowedError') return 'Camera permission was blocked. Allow it in your browser settings, or use the button below.';
  if (err?.name === 'NotFoundError') return 'No camera found on this device.';
  return err?.message || 'The camera could not start.';
}
