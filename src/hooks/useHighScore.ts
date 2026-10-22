import { useCallback, useEffect, useState } from 'react';
import { loadHighScore, saveHighScore } from '../platform/storage';

export function useHighScore() {
  const [best, setBest] = useState(0);
  useEffect(() => { loadHighScore().then(setBest); }, []);
  const submit = useCallback((score: number) => {
    setBest((prev) => {
      if (score > prev) { saveHighScore(score); return score; }
      return prev;
    });
  }, []);
  return { best, submit };
}
