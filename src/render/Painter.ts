/**
 * The tiny drawing interface every platform implements. The whole game scene is
 * drawn through it by shared code (drawScene.ts); only the backends differ:
 *   - web:    HTML canvas 2D       (GameCanvas.web.tsx)
 *   - native: Skia on iOS/Android  (GameCanvas.native.tsx)
 * All coordinates are world units; the backend applies the screen scale.
 */
export interface CachedLayer {
  readonly key: string;
  readonly width: number;
  readonly height: number;
}

export type TextAlign = 'left' | 'center' | 'right';

export interface Painter {
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  rotate(degrees: number): void;
  scale(sx: number, sy: number): void;

  rect(x: number, y: number, w: number, h: number, color: string, alpha?: number): void;
  rrect(x: number, y: number, w: number, h: number, r: number, color: string, alpha?: number): void;
  circle(cx: number, cy: number, r: number, color: string, alpha?: number): void;
  ellipse(cx: number, cy: number, rx: number, ry: number, color: string, alpha?: number): void;
  ring(cx: number, cy: number, r: number, width: number, color: string, alpha?: number): void;
  /** Filled polygon from a flat [x0, y0, x1, y1, ...] list. */
  poly(points: readonly number[], color: string, alpha?: number): void;
  /** Thick line with round caps (limbs, ropes, rebar). */
  line(x0: number, y0: number, x1: number, y1: number, width: number, color: string, alpha?: number): void;
  text(str: string, x: number, y: number, size: number, color: string, align?: TextAlign, alpha?: number): void;

  /** Draw something once into an offscreen layer and reuse it every frame. */
  cache(key: string, width: number, height: number, draw: (p: Painter) => void): CachedLayer;
  drawCached(layer: CachedLayer, x: number, y: number): void;
}
