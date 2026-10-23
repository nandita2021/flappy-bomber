import { Canvas, Picture, Skia } from '@shopify/react-native-skia';
import { useMemo, useRef } from 'react';
import type { GameCanvasProps } from './GameCanvas.types';
import { SkiaPainter } from './SkiaPainter';

/**
 * iOS / Android renderer: each frame is recorded into a Skia picture and drawn
 * on the GPU by one <Canvas>. Static scenery is recorded once and replayed.
 */
export function GameCanvas({ width, height, scale, draw }: GameCanvasProps) {
  const recorder = useMemo(() => Skia.PictureRecorder(), []);
  const layers = useRef(new Map());

  const c = recorder.beginRecording(Skia.XYWHRect(0, 0, width, height));
  c.scale(scale, scale);
  draw(new SkiaPainter(c, layers.current));
  const picture = recorder.finishRecordingAsPicture();

  return (
    <Canvas style={{ position: 'absolute', left: 0, top: 0, width, height }} pointerEvents="none">
      <Picture picture={picture} />
    </Canvas>
  );
}
