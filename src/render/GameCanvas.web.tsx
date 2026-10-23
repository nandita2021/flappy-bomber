import { useLayoutEffect, useRef } from 'react';
import type { GameCanvasProps } from './GameCanvas.types';
import { CanvasPainter } from './CanvasPainter';

/**
 * Web renderer: one <canvas>, redrawn every frame. Far cheaper for mobile
 * browsers than hundreds of animated DOM elements. Pixel density is capped at
 * 2x: on 3x phones that cuts the pixels to fill by more than half with no
 * visible loss for this art style.
 */
const MAX_DPR = 2;

export function GameCanvas({ width, height, scale, draw }: GameCanvasProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const layers = useRef(new Map());
  const resKey = useRef('');

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas || width <= 0 || height <= 0) return;
    const dpr = Math.min(MAX_DPR, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
    const pw = Math.round(width * dpr);
    const ph = Math.round(height * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    const key = `${scale.toFixed(4)}@${dpr}`;
    if (key !== resKey.current) {
      layers.current.clear(); // re-rasterise cached scenery at the new size
      resKey.current = key;
    }
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.globalAlpha = 1;
    draw(new CanvasPainter(ctx, dpr * scale, layers.current));
  });

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', left: 0, top: 0, width, height, display: 'block', pointerEvents: 'none', touchAction: 'none' }}
    />
  );
}
