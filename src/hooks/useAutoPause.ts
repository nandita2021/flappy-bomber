import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/** Pause when the app is backgrounded (native) or the tab is hidden (web). */
export function useAutoPause(onBackground: () => void) {
  const ref = useRef(onBackground);
  ref.current = onBackground;
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') ref.current();
    });
    return () => sub.remove();
  }, []);
}
