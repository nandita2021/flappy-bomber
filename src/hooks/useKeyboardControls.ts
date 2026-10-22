import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

export interface KeyHandlers {
  onFlap: () => void;
  onDive: () => void;
  onPause: () => void;
}

/** Desktop web keyboard support: Space/↑/W flap, ↓/S dive, P/Esc pause. Native: no-op. */
export function useKeyboardControls(handlers: KeyHandlers) {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      switch (e.code) {
        case 'Space': case 'ArrowUp': case 'KeyW': case 'Enter':
          e.preventDefault(); ref.current.onFlap(); break;
        case 'ArrowDown': case 'KeyS':
          e.preventDefault(); ref.current.onDive(); break;
        case 'KeyP': case 'Escape':
          e.preventDefault(); ref.current.onPause(); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
