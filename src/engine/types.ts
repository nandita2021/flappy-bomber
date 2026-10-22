export type Phase = 'ready' | 'playing' | 'paused' | 'over';
export type SupplyKind = 'food' | 'drink' | 'money';
export type DeathCause = 'bomb' | 'hunger' | null;

export interface Player {
  y: number;
  vy: number;
  onGround: boolean;
  /** Advances while running; drives the leg/arm cycle. */
  runCycle: number;
  jumpTime: number;
  hearts: number;
  energy: number;
  invulnerableUntil: number;
  hurtTime: number;
}

export interface Supply {
  id: number;
  kind: SupplyKind;
  /** Which emoji/variant of the kind to draw. */
  variant: number;
  x: number;
  y: number;
  phase: number;
}

export interface Bomb {
  id: number;
  x: number;
  y: number;
  vy: number;
  wobble: number;
}

export interface Blast {
  id: number;
  x: number;
  y: number;
  age: number;
  hurtChecked: boolean;
}

export interface Crater {
  id: number;
  x: number;
  size: number;
}

export interface Particle {
  id: number;
  kind: 'debris' | 'smoke' | 'spark' | 'pickup';
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  color: string;
  text?: string;
}

export interface Plane {
  id: number;
  x: number;
  y: number;
  speed: number;
}

export interface World {
  width: number;
  height: number;
  phase: Phase;
  player: Player;
  supplies: Supply[];
  bombs: Bomb[];
  blasts: Blast[];
  craters: Crater[];
  particles: Particle[];
  planes: Plane[];
  time: number;
  /** Seconds since the run began (drives difficulty). */
  runTime: number;
  distance: number;
  coins: number;
  scroll: number;
  nextSupplyIn: number;
  nextBombIn: number;
  nextPlaneIn: number;
  shake: number;
  flash: number;
  lowEnergyWarned: boolean;
  deathCause: DeathCause;
  nextId: number;
  seed: number;
}

export type GameEvent =
  | 'start' | 'jump' | 'dive' | 'pause' | 'resume'
  | 'food' | 'drink' | 'money'
  | 'bombDrop' | 'explosion' | 'hurt' | 'lowEnergy' | 'over';
