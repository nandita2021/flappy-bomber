import { useEffect, useRef } from 'react';
import { FIXED_STEP, MAX_FRAME_DELTA } from '../engine';

/**
 * requestAnimationFrame loop with a fixed-timestep accumulator: physics is
 * identical at 60, 90 or 120 Hz and on slow devices. `onFrame` renders once per frame.
 */
export function useGameLoop(onStep: (dt: number) => void, onFrame: () => void) {
  const stepRef = useRef(onStep);
  const frameRef = useRef(onFrame);
  stepRef.current = onStep;
  frameRef.current = onFrame;

  useEffect(() => {
    let raf = 0;
    let last: number | null = null;
    let acc = 0;
    const tick = (now: number) => {
      if (last === null) last = now;
      acc += Math.min(MAX_FRAME_DELTA, (now - last) / 1000);
      last = now;
      while (acc >= FIXED_STEP) {
        stepRef.current(FIXED_STEP);
        acc -= FIXED_STEP;
      }
      frameRef.current();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
}
