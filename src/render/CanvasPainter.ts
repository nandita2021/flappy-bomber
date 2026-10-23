import type { CachedLayer, Painter, TextAlign } from './Painter';

type Ctx = CanvasRenderingContext2D;
interface WebLayer extends CachedLayer { canvas: HTMLCanvasElement }

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Painter backed by an HTML canvas 2D context (web only). */
export class CanvasPainter implements Painter {
  constructor(
    private ctx: Ctx,
    /** Device pixels per world unit, used to rasterise cached layers sharply. */
    private resolution: number,
    private layers: Map<string, WebLayer>,
  ) {}

  private fill(color: string, alpha: number) {
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
  }

  save() { this.ctx.save(); }
  restore() { this.ctx.restore(); }
  translate(x: number, y: number) { this.ctx.translate(x, y); }
  rotate(deg: number) { this.ctx.rotate((deg * Math.PI) / 180); }
  scale(sx: number, sy: number) { this.ctx.scale(sx, sy); }

  rect(x: number, y: number, w: number, h: number, color: string, alpha = 1) {
    if (alpha <= 0) return;
    this.fill(color, alpha);
    this.ctx.fillRect(x, y, w, h);
  }

  rrect(x: number, y: number, w: number, h: number, r: number, color: string, alpha = 1) {
    if (alpha <= 0) return;
    const c = this.ctx;
    const rr = Math.max(0, Math.min(r, w / 2, h / 2));
    this.fill(color, alpha);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
    c.fill();
  }

  circle(cx: number, cy: number, r: number, color: string, alpha = 1) {
    if (alpha <= 0 || r <= 0) return;
    this.fill(color, alpha);
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
    this.ctx.fill();
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: string, alpha = 1) {
    if (alpha <= 0 || rx <= 0 || ry <= 0) return;
    this.fill(color, alpha);
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    this.ctx.fill();
  }

  ring(cx: number, cy: number, r: number, width: number, color: string, alpha = 1) {
    if (alpha <= 0 || r <= 0) return;
    const c = this.ctx;
    c.globalAlpha = alpha;
    c.strokeStyle = color;
    c.lineWidth = width;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.stroke();
  }

  poly(pts: readonly number[], color: string, alpha = 1) {
    if (alpha <= 0 || pts.length < 6) return;
    const c = this.ctx;
    this.fill(color, alpha);
    c.beginPath();
    c.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.closePath();
    c.fill();
  }

  line(x0: number, y0: number, x1: number, y1: number, width: number, color: string, alpha = 1) {
    if (alpha <= 0) return;
    const c = this.ctx;
    c.globalAlpha = alpha;
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
  }

  text(str: string, x: number, y: number, size: number, color: string, align: TextAlign = 'left', alpha = 1) {
    if (alpha <= 0 || !str) return;
    const c = this.ctx;
    this.fill(color, alpha);
    c.font = `900 ${size}px ${FONT}`;
    c.textAlign = align;
    c.textBaseline = 'middle';
    c.fillText(str, x, y);
  }

  cache(key: string, width: number, height: number, draw: (p: Painter) => void): CachedLayer {
    const existing = this.layers.get(key);
    if (existing) return existing;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(width * this.resolution);
    canvas.height = Math.ceil(height * this.resolution);
    const ctx = canvas.getContext('2d')!;
    ctx.scale(this.resolution, this.resolution);
    draw(new CanvasPainter(ctx, this.resolution, this.layers));
    const layer: WebLayer = { key, width, height, canvas };
    this.layers.set(key, layer);
    return layer;
  }

  drawCached(layer: CachedLayer, x: number, y: number) {
    const l = layer as WebLayer;
    this.ctx.globalAlpha = 1;
    this.ctx.drawImage(l.canvas, x, y, l.width, l.height);
  }
}
