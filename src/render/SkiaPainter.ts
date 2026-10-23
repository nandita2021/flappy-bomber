import { PaintStyle, Skia, StrokeCap, matchFont, type SkCanvas, type SkColor, type SkFont, type SkPicture } from '@shopify/react-native-skia';
import { Platform } from 'react-native';
import type { CachedLayer, Painter, TextAlign } from './Painter';

interface SkiaLayer extends CachedLayer { picture: SkPicture }

const colorCache = new Map<string, SkColor>();
const color = (c: string) => {
  let v = colorCache.get(c);
  if (!v) { v = Skia.Color(c); colorCache.set(c, v); }
  return v;
};

const fontCache = new Map<number, SkFont>();
const fontFamily = Platform.select({ ios: 'Helvetica', default: 'sans-serif' });
const font = (size: number) => {
  const key = Math.round(size);
  let f = fontCache.get(key);
  if (!f) { f = matchFont({ fontFamily, fontSize: key, fontWeight: 'bold' }); fontCache.set(key, f); }
  return f;
};

/** Painter backed by Skia (iOS and Android). */
export class SkiaPainter implements Painter {
  private fillPaint = Skia.Paint();
  private strokePaint = Skia.Paint();

  constructor(private canvas: SkCanvas, private layers: Map<string, SkiaLayer>) {
    this.fillPaint.setAntiAlias(true);
    this.strokePaint.setAntiAlias(true);
    this.strokePaint.setStyle(PaintStyle.Stroke);
  }

  private fill(c: string, alpha: number) {
    this.fillPaint.setColor(color(c));
    this.fillPaint.setAlphaf(alpha);
    return this.fillPaint;
  }

  private stroke(c: string, alpha: number, width: number, round: boolean) {
    const p = this.strokePaint;
    p.setColor(color(c));
    p.setAlphaf(alpha);
    p.setStrokeWidth(width);
    p.setStrokeCap(round ? StrokeCap.Round : StrokeCap.Butt);
    return p;
  }

  save() { this.canvas.save(); }
  restore() { this.canvas.restore(); }
  translate(x: number, y: number) { this.canvas.translate(x, y); }
  rotate(deg: number) { this.canvas.rotate(deg, 0, 0); }
  scale(sx: number, sy: number) { this.canvas.scale(sx, sy); }

  rect(x: number, y: number, w: number, h: number, c: string, alpha = 1) {
    if (alpha <= 0) return;
    this.canvas.drawRect(Skia.XYWHRect(x, y, w, h), this.fill(c, alpha));
  }

  rrect(x: number, y: number, w: number, h: number, r: number, c: string, alpha = 1) {
    if (alpha <= 0) return;
    const rr = Math.max(0, Math.min(r, w / 2, h / 2));
    this.canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(x, y, w, h), rr, rr), this.fill(c, alpha));
  }

  circle(cx: number, cy: number, r: number, c: string, alpha = 1) {
    if (alpha <= 0 || r <= 0) return;
    this.canvas.drawCircle(cx, cy, r, this.fill(c, alpha));
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: string, alpha = 1) {
    if (alpha <= 0 || rx <= 0 || ry <= 0) return;
    this.canvas.drawOval(Skia.XYWHRect(cx - rx, cy - ry, rx * 2, ry * 2), this.fill(c, alpha));
  }

  ring(cx: number, cy: number, r: number, width: number, c: string, alpha = 1) {
    if (alpha <= 0 || r <= 0) return;
    this.canvas.drawCircle(cx, cy, r, this.stroke(c, alpha, width, false));
  }

  poly(pts: readonly number[], c: string, alpha = 1) {
    if (alpha <= 0 || pts.length < 6) return;
    const b = Skia.PathBuilder.Make();
    b.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) b.lineTo(pts[i], pts[i + 1]);
    b.close();
    this.canvas.drawPath(b.detach(), this.fill(c, alpha));
  }

  line(x0: number, y0: number, x1: number, y1: number, width: number, c: string, alpha = 1) {
    if (alpha <= 0) return;
    this.canvas.drawLine(x0, y0, x1, y1, this.stroke(c, alpha, width, true));
  }

  text(str: string, x: number, y: number, size: number, c: string, align: TextAlign = 'left', alpha = 1) {
    if (alpha <= 0 || !str) return;
    const f = font(size);
    const w = f.measureText(str).width;
    const dx = align === 'center' ? -w / 2 : align === 'right' ? -w : 0;
    this.canvas.drawText(str, x + dx, y + size * 0.35, this.fill(c, alpha), f);
  }

  cache(key: string, width: number, height: number, draw: (p: Painter) => void): CachedLayer {
    const existing = this.layers.get(key);
    if (existing) return existing;
    const recorder = Skia.PictureRecorder();
    const c = recorder.beginRecording(Skia.XYWHRect(0, 0, width, height));
    draw(new SkiaPainter(c, this.layers));
    const layer: SkiaLayer = { key, width, height, picture: recorder.finishRecordingAsPicture() };
    this.layers.set(key, layer);
    return layer;
  }

  drawCached(layer: CachedLayer, x: number, y: number) {
    this.canvas.save();
    this.canvas.translate(x, y);
    this.canvas.drawPicture((layer as SkiaLayer).picture);
    this.canvas.restore();
  }
}
