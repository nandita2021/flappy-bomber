export type Phase = 'ready' | 'playing' | 'paused' | 'over';

export interface Bird {
  y: number;
  vy: number;
  rotation: number;
  flapTime: number;
}

export interface Pipe {
  id: number;
  x: number;
  gapY: number;
  scored: boolean;
}

export interface World {
  width: number;
  height: number;
  phase: Phase;
  bird: Bird;
  pipes: Pipe[];
  score: number;
  time: number;
  distanceToNextPipe: number;
  nextPipeId: number;
  groundOffset: number;
  seed: number;
}

export type GameEvent = 'flap' | 'dive' | 'score' | 'hit' | 'start' | 'pause' | 'resume';
