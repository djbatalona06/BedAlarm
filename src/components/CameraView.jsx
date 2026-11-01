import { useEffect, useRef, useState } from 'react';
import { openCamera, closeCamera, cameraErrorMessage } from '../vision/camera.js';
import './CameraView.css';

/**
 * Opens the camera when mounted and closes it when unmounted.
 * Children are drawn on top of the video (HUD, skeleton, etc).
 */
export default function CameraView({ facingMode = 'user', mirrored = facingMode === 'user', videoRef, onReady, onError, children }) {
  const localRef = useRef(null);
  const ref = videoRef || localRef;
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let stream = null;
    let cancelled = false;
    const video = ref.current;
    openCamera(video, facingMode)
      .then((s) => {
        if (cancelled) return closeCamera(s);
        stream = s;
        setStarting(false);
        onReady?.(video);
      })
      .catch((err) => {
        if (cancelled) return;
        setStarting(false);
        setError(cameraErrorMessage(err));
        onError?.(err);
      });
    return () => {
      cancelled = true;
      closeCamera(stream, video);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  return (
    <div className={`camera ${mirrored ? 'camera--mirrored' : ''}`}>
      <video ref={ref} className="camera__video" playsInline muted aria-label="Live camera preview" />
      <div className="camera__layer">{children}</div>
      <p className="camera__badge" title="All video is processed on this device. Nothing is uploaded.">
        <span aria-hidden="true">🔒</span> On-device
      </p>
      {starting && <p className="camera__status">Starting camera…</p>}
      {error && (
        <p className="camera__status camera__status--error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
