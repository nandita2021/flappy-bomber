import { useCallback, useEffect, useState } from 'react';
import { sound } from '../platform/sound';
import { loadMuted, saveMuted } from '../platform/storage';

export function useMuted() {
  const [muted, setMuted] = useState(false);
  useEffect(() => { loadMuted().then((m) => { sound.setMuted(m); setMuted(m); }); }, []);
  /** Returns the new muted state. */
  const toggle = useCallback(() => {
    const next = !sound.isMuted();
    sound.setMuted(next);
    saveMuted(next);
    setMuted(next);
    return next;
  }, []);
  return { muted, toggle };
}
