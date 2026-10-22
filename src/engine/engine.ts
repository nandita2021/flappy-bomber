import * as C from './constants';
import { nextRandom } from './random';
import type { Bomb, GameEvent, Particle, SupplyKind, World } from './types';

/**
 * Pure, platform-agnostic game engine: no React, no DOM, no native APIs.
 * Functions mutate the world in place (cheap at 120 Hz) and return the events
 * that happened, so the UI layer can play sounds, haptics and animations.
 */

export const clampWidth = (w: number) => Math.max(C.MIN_WORLD_WIDTH, Math.min(C.MAX_WORLD_WIDTH, w));
export const playerX = (world: World) => world.width * C.PLAYER_X_RATIO;
export const groundedY = () => C.GROUND_Y - C.PLAYER_HALF_HEIGHT;
export const currentSpeed = (runTime: number) => Math.min(C.MAX_SPEED, C.BASE_SPEED + runTime * C.SPEED_GROWTH);
export const energyDrain = (runTime: number) => Math.min(C.MAX_ENERGY_DRAIN, C.ENERGY_DRAIN + runTime * C.ENERGY_DRAIN_GROWTH);
export const bombInterval = (runTime: number) => Math.max(C.BOMB_MIN_INTERVAL, C.BOMB_START_INTERVAL - runTime * C.BOMB_INTERVAL_SHRINK);
export const metres = (world: World) => Math.floor(world.distance / C.PX_PER_METRE);
export const finalScore = (world: World) => metres(world) + world.coins * C.COIN_SCORE;
export const isInvulnerable = (world: World) => world.time < world.player.invulnerableUntil;

/** Time a bomb takes to fall from its start height to the ground. */
export const bombFallTime = () => {
  const d = C.GROUND_Y - C.BOMB_START_Y;
  const a = C.BOMB_GRAVITY / 2;
  const b = C.BOMB_START_VY;
  return (-b + Math.sqrt(b * b + 4 * a * d)) / (2 * a);
};

function rand(world: World): number {
  const [v, s] = nextRandom(world.seed);
  world.seed = s;
  return v;
}
const range = (world: World, a: number, b: number) => a + rand(world) * (b - a);

export function createWorld(width: number, seed = Date.now() >>> 0): World {
  return {
    width: clampWidth(width),
    height: C.WORLD_HEIGHT,
    phase: 'ready',
    player: {
      y: groundedY(), vy: 0, onGround: true, runCycle: 0, jumpTime: -1,
      hearts: C.MAX_HEARTS, energy: C.MAX_ENERGY, invulnerableUntil: 0, hurtTime: -10,
    },
    supplies: [],
    bombs: [],
    blasts: [],
    craters: [],
    particles: [],
    planes: [],
    time: 0,
    runTime: 0,
    distance: 0,
    coins: 0,
    scroll: 0,
    nextSupplyIn: 0,
    nextBombIn: C.FIRST_BOMB_DELAY,
    nextPlaneIn: 2,
    shake: 0,
    flash: 0,
    lowEnergyWarned: false,
    deathCause: null,
    nextId: 1,
    seed,
  };
}

export function resetWorld(world: World): void {
  Object.assign(world, createWorld(world.width, world.seed));
}

export function resize(world: World, width: number): void {
  world.width = clampWidth(width);
}

/** Tap / Space: leap or flap upward. The first one starts the run. */
export function jump(world: World): GameEvent[] {
  const events: GameEvent[] = [];
  if (world.phase === 'over' || world.phase === 'paused') return events;
  if (world.phase === 'ready') {
    world.phase = 'playing';
    world.nextSupplyIn = world.width * 0.35;
    events.push('start');
  }
  const p = world.player;
  p.vy = C.JUMP_VELOCITY;
  p.onGround = false;
  p.jumpTime = world.time;
  events.push('jump');
  return events;
}

/** Swipe down / arrow down: drop fast to dodge a bomb or grab low supplies. */
export function dive(world: World): GameEvent[] {
  if (world.phase !== 'playing' || world.player.onGround) return [];
  world.player.vy = Math.max(world.player.vy, C.DIVE_VELOCITY);
  return ['dive'];
}

export function togglePause(world: World): GameEvent[] {
  if (world.phase === 'playing') { world.phase = 'paused'; return ['pause']; }
  if (world.phase === 'paused') { world.phase = 'playing'; return ['resume']; }
  return [];
}

export function pause(world: World): GameEvent[] {
  return world.phase === 'playing' ? togglePause(world) : [];
}

function addParticle(world: World, p: Omit<Particle, 'id' | 'age'>) {
  if (world.particles.length >= C.MAX_PARTICLES) world.particles.shift();
  world.particles.push({ ...p, id: world.nextId++, age: 0 });
}

const SUPPLY_VARIANTS: Record<SupplyKind, number> = { food: 4, drink: 3, money: 2 };

function spawnSupply(world: World) {
  const r = rand(world);
  const kind: SupplyKind = r < 0.42 ? 'food' : r < 0.77 ? 'drink' : 'money';
  world.supplies.push({
    id: world.nextId++,
    kind,
    variant: Math.floor(rand(world) * SUPPLY_VARIANTS[kind]),
    x: world.width + 40,
    y: range(world, C.SUPPLY_MIN_Y, C.SUPPLY_MAX_Y),
    phase: rand(world) * Math.PI * 2,
  });
}

function spawnBomb(world: World, speed: number) {
  const px = playerX(world);
  // Half the bombs aim where the survivor is, the rest land somewhere ahead.
  const aimed = rand(world) < 0.5;
  const impactX = aimed ? px + range(world, -20, 60) : range(world, px + 40, world.width - 30);
  const x = impactX + speed * bombFallTime();
  world.bombs.push({ id: world.nextId++, x, y: C.BOMB_START_Y, vy: C.BOMB_START_VY, wobble: rand(world) * 6 });
}

/** Where a falling bomb will hit the ground, in current screen coordinates. */
export function bombImpactX(world: World, bomb: Bomb): number {
  const a = C.BOMB_GRAVITY / 2;
  const d = C.GROUND_Y - bomb.y;
  const t = (-bomb.vy + Math.sqrt(bomb.vy * bomb.vy + 4 * a * d)) / (2 * a);
  return bomb.x - currentSpeed(world.runTime) * t;
}

function explode(world: World, x: number, y: number, events: GameEvent[]) {
  world.blasts.push({ id: world.nextId++, x, y, age: 0, hurtChecked: false });
  if (y >= C.GROUND_Y - 4) world.craters.push({ id: world.nextId++, x, size: range(world, 50, 74) });
  world.shake = Math.min(1, world.shake + 0.7);
  world.flash = 1;
  events.push('explosion');
  const debris = ['#5B4636', '#7A6A58', '#3A3A3A', '#8D7B68'];
  for (let i = 0; i < 14; i++) {
    const a = range(world, Math.PI * 1.05, Math.PI * 1.95);
    const s = range(world, 180, 520);
    addParticle(world, {
      kind: 'debris', x, y: y - 6, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: range(world, 0.6, 1.2), size: range(world, 4, 9), color: debris[i % debris.length],
    });
  }
  for (let i = 0; i < 8; i++) {
    addParticle(world, {
      kind: 'spark', x, y: y - 10, vx: range(world, -260, 260), vy: range(world, -420, -120),
      life: range(world, 0.25, 0.5), size: range(world, 3, 5), color: i % 2 ? '#FFD34D' : '#FF7A1A',
    });
  }
  for (let i = 0; i < 6; i++) {
    addParticle(world, {
      kind: 'smoke', x: x + range(world, -24, 24), y: y - range(world, 10, 40), vx: range(world, -30, 30), vy: range(world, -70, -30),
      life: range(world, 1.2, 2.0), size: range(world, 26, 44), color: '#4A4440',
    });
  }
}

function hurt(world: World, events: GameEvent[], fromX: number) {
  const p = world.player;
  if (isInvulnerable(world) || world.phase !== 'playing') return;
  p.hearts -= 1;
  p.hurtTime = world.time;
  p.invulnerableUntil = world.time + C.INVULNERABLE_TIME;
  p.vy = Math.min(p.vy, -380); // knocked into the air by the blast
  p.onGround = false;
  world.shake = 1;
  events.push('hurt');
  if (p.hearts <= 0) gameOver(world, 'bomb', events);
  void fromX;
}

function gameOver(world: World, cause: 'bomb' | 'hunger', events: GameEvent[]) {
  if (world.phase === 'over') return;
  world.phase = 'over';
  world.deathCause = cause;
  events.push('over');
}

function collect(world: World, kind: SupplyKind, x: number, y: number, events: GameEvent[]) {
  const v = C.SUPPLY_VALUES[kind];
  world.player.energy = Math.min(C.MAX_ENERGY, world.player.energy + v.energy);
  world.coins += v.coins;
  if (world.player.energy > C.LOW_ENERGY) world.lowEnergyWarned = false;
  events.push(kind);
  addParticle(world, {
    kind: 'pickup', x, y: y - 10, vx: 0, vy: -70, life: 0.8, size: 18,
    color: kind === 'money' ? '#FFD34D' : kind === 'drink' ? '#7FD3FF' : '#9BE870',
    text: kind === 'money' ? `+${C.COIN_SCORE}` : `+${v.energy}`,
  });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    addParticle(world, {
      kind: 'spark', x, y, vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, life: 0.35, size: 4,
      color: kind === 'money' ? '#FFD34D' : '#FFFFFF',
    });
  }
}

function stepDecor(world: World, dt: number, speed: number) {
  // Planes cross the sky (they are what the bombs fall from).
  world.nextPlaneIn -= dt;
  if (world.nextPlaneIn <= 0) {
    world.planes.push({ id: world.nextId++, x: world.width + 80, y: range(world, 50, 110), speed: range(world, 120, 200) });
    world.nextPlaneIn = range(world, 5, 9);
  }
  for (const pl of world.planes) pl.x -= (pl.speed + speed * 0.2) * dt;
  world.planes = world.planes.filter((pl) => pl.x > -120);

  for (const p of world.particles) {
    p.age += dt;
    p.x += (p.vx - (p.kind === 'pickup' ? 0 : speed)) * dt;
    p.y += p.vy * dt;
    if (p.kind === 'debris' || p.kind === 'spark') {
      p.vy += 1200 * dt;
      if (p.y > C.GROUND_Y + 6) { p.y = C.GROUND_Y + 6; p.vy *= -0.3; p.vx *= 0.6; }
    } else if (p.kind === 'smoke') {
      p.size += 22 * dt;
    }
  }
  world.particles = world.particles.filter((p) => p.age < p.life);
  world.shake = Math.max(0, world.shake - dt * 2.6);
  world.flash = Math.max(0, world.flash - dt * 5);
}

/** Advance the simulation by dt seconds (call with a fixed step). */
export function step(world: World, dt: number): GameEvent[] {
  const events: GameEvent[] = [];
  if (world.phase === 'paused') return events;
  world.time += dt;
  const p = world.player;

  if (world.phase === 'ready') {
    // Attract mode: the survivor jogs in place while the city scrolls slowly.
    p.runCycle += dt * 9;
    world.scroll += C.BASE_SPEED * 0.5 * dt;
    stepDecor(world, dt, C.BASE_SPEED * 0.5);
    return events;
  }

  const playing = world.phase === 'playing';
  const speed = playing ? currentSpeed(world.runTime) : 0;
  if (playing) {
    world.runTime += dt;
    world.distance += speed * dt;
    world.scroll += speed * dt;
  }

  // --- survivor physics: run on the rubble, leap and flap through the air ---
  if (!p.onGround) {
    p.vy = Math.min(C.MAX_FALL_SPEED, p.vy + C.GRAVITY * dt);
    p.y += p.vy * dt;
    if (p.y < C.CEILING_Y) { p.y = C.CEILING_Y; p.vy = Math.max(0, p.vy); }
    if (p.y >= groundedY()) { p.y = groundedY(); p.vy = 0; p.onGround = true; }
  }
  if (playing && p.onGround) p.runCycle += dt * (speed / 18);

  if (playing) {
    // --- energy: hunger and thirst ---
    p.energy = Math.max(0, p.energy - energyDrain(world.runTime) * dt);
    if (p.energy <= C.LOW_ENERGY && !world.lowEnergyWarned) { world.lowEnergyWarned = true; events.push('lowEnergy'); }
    if (p.energy <= 0) gameOver(world, 'hunger', events);

    // --- supplies ---
    world.nextSupplyIn -= speed * dt;
    if (world.nextSupplyIn <= 0) {
      spawnSupply(world);
      world.nextSupplyIn = range(world, C.SUPPLY_MIN_GAP, C.SUPPLY_MAX_GAP);
    }
    // --- bombs ---
    world.nextBombIn -= dt;
    if (world.nextBombIn <= 0) {
      spawnBomb(world, speed);
      if (world.runTime > 25 && rand(world) < 0.3) spawnBomb(world, speed);
      world.nextBombIn = bombInterval(world.runTime) * range(world, 0.75, 1.25);
      events.push('bombDrop');
    }
  }

  const px = playerX(world);
  for (const s of world.supplies) {
    s.x -= speed * dt;
    const sy = s.y + Math.sin(world.time * 3 + s.phase) * 6;
    if (playing && Math.hypot(s.x - px, sy - p.y) < C.PLAYER_PICKUP_RADIUS) {
      s.x = -999;
      collect(world, s.kind, px, sy, events);
    }
  }
  world.supplies = world.supplies.filter((s) => s.x > -60);

  for (const b of world.bombs) {
    b.vy += C.BOMB_GRAVITY * dt;
    b.y += b.vy * dt;
    b.x -= speed * dt;
    const direct = playing && Math.hypot(b.x - px, b.y - p.y) < C.BOMB_RADIUS + C.PLAYER_HIT_RADIUS;
    if (direct || b.y >= C.GROUND_Y - 2) {
      explode(world, b.x, Math.min(b.y, C.GROUND_Y), events);
      b.y = 99999;
    }
  }
  world.bombs = world.bombs.filter((b) => b.y < 99999);

  for (const bl of world.blasts) {
    bl.age += dt;
    bl.x -= speed * dt;
    if (!bl.hurtChecked) {
      bl.hurtChecked = true;
      if (playing && Math.hypot(bl.x - px, bl.y - p.y) < C.BLAST_RADIUS) hurt(world, events, bl.x);
    }
  }
  world.blasts = world.blasts.filter((bl) => bl.age < C.BLAST_TIME);
  for (const c of world.craters) c.x -= speed * dt;
  world.craters = world.craters.filter((c) => c.x > -100);

  stepDecor(world, dt, speed);
  return events;
}
