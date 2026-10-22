import { useMemo, useRef } from 'react';
import { PanResponder } from 'react-native';

export interface SwipeHandlers {
  onTap: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

const SWIPE_DISTANCE = 36;

/**
 * One gesture layer for touch (iOS/Android/mobile web) and mouse (desktop web).
 * - Touch down fires `onTap` immediately (zero-latency flap, as players expect).
 * - A fast drag then fires at most one directional swipe per touch.
 */
export function useSwipeControls(handlers: SwipeHandlers) {
  const ref = useRef(handlers);
  ref.current = handlers;
  const swiped = useRef(false);

  return useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          swiped.current = false;
          ref.current.onTap();
        },
        onPanResponderMove: (_e, g) => {
          if (swiped.current) return;
          const { dx, dy } = g;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_DISTANCE) return;
          swiped.current = true;
          const h = ref.current;
          if (Math.abs(dy) >= Math.abs(dx)) (dy < 0 ? h.onSwipeUp : h.onSwipeDown)?.();
          else (dx < 0 ? h.onSwipeLeft : h.onSwipeRight)?.();
        },
      }),
    [],
  );
}
