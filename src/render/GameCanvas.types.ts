import type { Painter } from './Painter';

export interface GameCanvasProps {
  /** Size in screen points. */
  width: number;
  height: number;
  /** Screen points per world unit. */
  scale: number;
  /** Called once per render to draw the frame. */
  draw: (p: Painter) => void;
}
