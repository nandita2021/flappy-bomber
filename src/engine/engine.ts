import {
  BASE_SPEED, BIRD_RADIUS, BIRD_X_RATIO, DIVE_VELOCITY, FLAP_VELOCITY, GRAVITY,
  MAX_FALL_SPEED, MAX_SPEED, MAX_WORLD_WIDTH, MIN_WORLD_WIDTH, PIPE_GAP,
  PIPE_MIN_MARGIN, PIPE_SPACING, PIPE_WIDTH, PLAY_HEIGHT, SPEED_PER_POINT, WORLD_HEIGHT,
} from './constants';
import { nextRandom } from './random';
import type { GameEvent, Pipe, World } from './types';

/**
 * Pure, platform-agnostic game engine. No React, no DOM, no native APIs.
 * Functions mutate the world in place (cheap at 120 Hz) and return the events
 * that happened so the UI layer can play haptics / animations.
 */

export const clampWidth = (w: number) => Math.max(MIN_WORLD_WIDTH, Math.min(MAX_WORLD_WIDTH, w));
export const birdX = (world: World) => world.width * BIRD_X_RATIO;
export const currentSpeed = (score: number) => Math.min(MAX_SPEED, BASE_SPEED + score * SPEED_PER_POINT);

export function createWorld(width: number, seed = Date.now() >>> 0): World {
  return {
    width: clampWidth(width),
    height: WORLD_HEIGHT,
    phase: 'ready',
    bird: { y: PLAY_HEIGHT * 0.45, vy: 0, rotation: 0, flapTime: 0 },
    pipes: [],
    score: 0,
    time: 0,
    distanceToNextPipe: 0,
    nextPipeId: 1,
    groundOffset: 0,
    seed,
  };
}

export function resetWorld(world: World): void {
  const fresh = createWorld(world.width, world.seed);
  Object.assign(world, fresh);
}

export function resize(world: World, width: number): void {
  world.width = clampWidth(width);
}

export function flap(world: World): GameEvent[] {
  const events: GameEvent[] = [];
  if (world.phase === 'over' || world.phase === 'paused') return events;
  if (world.phase === 'ready') {
    world.phase = 'playing';
    world.distanceToNextPipe = world.width * 0.6;
    events.push('start');
  }
  world.bird.vy = FLAP_VELOCITY;
  world.bird.flapTime = world.time;
  events.push('flap');
  return events;
}

/** Swipe down / arrow down: drop quickly through a gap. */
export function dive(world: World): GameEvent[] {
  if (world.phase !== 'playing') return [];
  world.bird.vy = Math.max(world.bird.vy, DIVE_VELOCITY);
  return ['dive'];
}

export function togglePause(world: World): GameEvent[] {
  if (world.phase === 'playing') {
    world.phase = 'paused';
    return ['pause'];
  }
  if (world.phase === 'paused') {
    world.phase = 'playing';
    return ['resume'];
  }
  return [];
}

export function pause(world: World): GameEvent[] {
  return world.phase === 'playing' ? togglePause(world) : [];
}

function spawnPipe(world: World): Pipe {
  const [r, seed] = nextRandom(world.seed);
  world.seed = seed;
  const minY = PIPE_MIN_MARGIN + PIPE_GAP / 2;
  const maxY = PLAY_HEIGHT - PIPE_MIN_MARGIN - PIPE_GAP / 2;
  const pipe: Pipe = { id: world.nextPipeId++, x: world.width + PIPE_WIDTH, gapY: minY + r * (maxY - minY), scored: false };
  world.pipes.push(pipe);
  return pipe;
}

function circleHitsRect(cx: number, cy: number, r: number, x: number, y: number, w: number, h: number) {
  const nx = Math.max(x, Math.min(cx, x + w));
  const ny = Math.max(y, Math.min(cy, y + h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

export function collides(world: World): boolean {
  const { y } = world.bird;
  const bx = birdX(world);
  const r = BIRD_RADIUS * 0.88; // slightly forgiving hitbox feels fairer on touch screens
  if (y + r >= PLAY_HEIGHT) return true;
  for (const p of world.pipes) {
    const left = p.x - PIPE_WIDTH / 2;
    const topH = p.gapY - PIPE_GAP / 2;
    const bottomY = p.gapY + PIPE_GAP / 2;
    if (circleHitsRect(bx, y, r, left, -1000, PIPE_WIDTH, topH + 1000)) return true;
    if (circleHitsRect(bx, y, r, left, bottomY, PIPE_WIDTH, PLAY_HEIGHT - bottomY)) return true;
  }
  return false;
}

/** Advance the simulation by dt seconds (call with a fixed step). */
export function step(world: World, dt: number): GameEvent[] {
  const events: GameEvent[] = [];
  if (world.phase === 'paused') return events;
  world.time += dt;
  const bird = world.bird;

  if (world.phase === 'ready') {
    // Idle hover so the menu feels alive.
    bird.y = PLAY_HEIGHT * 0.45 + Math.sin(world.time * 4) * 8;
    bird.rotation = 0;
    world.groundOffset = (world.groundOffset + BASE_SPEED * dt) % 48;
    return events;
  }

  // Bird physics (also runs after death so the bird falls to the ground).
  bird.vy = Math.min(MAX_FALL_SPEED, bird.vy + GRAVITY * dt);
  bird.y += bird.vy * dt;
  if (bird.y < BIRD_RADIUS) {
    bird.y = BIRD_RADIUS;
    bird.vy = Math.max(0, bird.vy);
  }
  const targetRot = bird.vy < 0 ? -25 : Math.min(90, (bird.vy / MAX_FALL_SPEED) * 110);
  bird.rotation += (targetRot - bird.rotation) * Math.min(1, dt * (bird.vy < 0 ? 18 : 6));

  if (world.phase === 'over') {
    if (bird.y + BIRD_RADIUS >= PLAY_HEIGHT) {
      bird.y = PLAY_HEIGHT - BIRD_RADIUS;
      bird.vy = 0;
    }
    return events;
  }

  const speed = currentSpeed(world.score);
  const dx = speed * dt;
  world.groundOffset = (world.groundOffset + dx) % 48;

  world.distanceToNextPipe -= dx;
  if (world.distanceToNextPipe <= 0) {
    spawnPipe(world);
    world.distanceToNextPipe += PIPE_SPACING;
  }

  const bx = birdX(world);
  for (const p of world.pipes) {
    p.x -= dx;
    if (!p.scored && p.x + PIPE_WIDTH / 2 < bx - BIRD_RADIUS) {
      p.scored = true;
      world.score += 1;
      events.push('score');
    }
  }
  if (world.pipes.length && world.pipes[0].x < -PIPE_WIDTH) world.pipes.shift();

  if (collides(world)) {
    world.phase = 'over';
    bird.vy = Math.max(bird.vy, 0);
    events.push('hit');
  }
  return events;
}
