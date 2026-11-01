import { useEffect, useRef } from 'react';

/**
 * Calls `onFrame(video, timestampMs)` once per new video frame while `active`.
 * Uses requestVideoFrameCallback when available (no wasted work), otherwise rAF.
 */
export function useVideoLoop(videoRef, active, onFrame) {
  const cb = useRef(onFrame);
  cb.current = onFrame;

  useEffect(() => {
    const video = videoRef.current;
    if (!active || !video) return undefined;
    let stopped = false;
    let handle = 0;
    let lastTime = -1;
    const useRvfc = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;

    const tick = () => {
      if (stopped) return;
      if (video.readyState >= 2 && video.currentTime !== lastTime) {
        lastTime = video.currentTime;
        try {
          cb.current(video, performance.now());
        } catch (err) {
          console.warn('[vision] frame error', err);
        }
      }
      handle = useRvfc ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(tick);
    };
    tick();
    return () => {
      stopped = true;
      if (useRvfc) video.cancelVideoFrameCallback?.(handle);
      else cancelAnimationFrame(handle);
    };
  }, [videoRef, active]);
}
