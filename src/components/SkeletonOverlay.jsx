import { useEffect, useRef } from 'react';
import { BONES } from '../vision/landmarks.js';

/**
 * Draws the pose skeleton on a canvas. `good` colours it with the "good form"
 * token, otherwise the "fix form" token. Colour-blind mode swaps the palette
 * (via CSS variables) and adds square vs round joint markers.
 */
export default function SkeletonOverlay({ landmarksRef, good, colorBlind }) {
  const canvasRef = useRef(null);
  const goodRef = useRef(good);
  goodRef.current = good;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    const styles = getComputedStyle(canvas);
    const draw = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if (canvas.width !== w * devicePixelRatio) {
        canvas.width = w * devicePixelRatio;
        canvas.height = h * devicePixelRatio;
      }
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const lm = landmarksRef.current;
      if (lm) {
        const isGood = goodRef.current;
        const color = styles.getPropertyValue(isGood ? '--good' : '--bad').trim() || (isGood ? '#3ddc84' : '#ff5c5c');
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        for (const [a, b] of BONES) {
          const p = lm[a];
          const q = lm[b];
          if ((p.visibility ?? 1) < 0.4 || (q.visibility ?? 1) < 0.4) continue;
          ctx.beginPath();
          ctx.moveTo(p.x * w, p.y * h);
          ctx.lineTo(q.x * w, q.y * h);
          ctx.stroke();
        }
        for (const i of new Set(BONES.flat())) {
          const p = lm[i];
          if ((p.visibility ?? 1) < 0.4) continue;
          if (colorBlind && !isGood) ctx.fillRect(p.x * w - 6, p.y * h - 6, 12, 12);
          else {
            ctx.beginPath();
            ctx.arc(p.x * w, p.y * h, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [landmarksRef, colorBlind]);

  return <canvas ref={canvasRef} className="camera__canvas" aria-hidden="true" />;
}
