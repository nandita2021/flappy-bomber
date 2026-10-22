/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, dive, flap, step, togglePause } from './engine';
import { FIXED_STEP, PLAY_HEIGHT } from './constants';

const run = (w: ReturnType<typeof createWorld>, seconds: number) => {
  const events: string[] = [];
  for (let t = 0; t < seconds; t += FIXED_STEP) events.push(...step(w, FIXED_STEP));
  return events;
};

test('starts in ready phase and hovers without falling', () => {
  const w = createWorld(400, 1);
  run(w, 3);
  assert.equal(w.phase, 'ready');
  assert.ok(w.bird.y < PLAY_HEIGHT * 0.6);
});

test('first flap starts the game and moves the bird up', () => {
  const w = createWorld(400, 1);
  const y0 = w.bird.y;
  assert.deepEqual(flap(w), ['start', 'flap']);
  run(w, 0.1);
  assert.equal(w.phase, 'playing');
  assert.ok(w.bird.y < y0);
});

test('bird hits the ground when nobody flaps', () => {
  const w = createWorld(400, 1);
  flap(w);
  const events = run(w, 3);
  assert.ok(events.includes('hit'));
  assert.equal(w.phase, 'over');
});

test('pause freezes the simulation', () => {
  const w = createWorld(400, 1);
  flap(w);
  togglePause(w);
  const y = w.bird.y;
  run(w, 1);
  assert.equal(w.bird.y, y);
  assert.deepEqual(flap(w), []);
  togglePause(w);
  assert.equal(w.phase, 'playing');
});

test('dive pushes the bird down fast', () => {
  const w = createWorld(400, 1);
  flap(w);
  dive(w);
  assert.ok(w.bird.vy > 500);
});

test('an autopilot that aims for the gap scores points', () => {
  const w = createWorld(400, 42);
  flap(w);
  let score = 0;
  for (let i = 0; i < 120 * 20 && w.phase === 'playing'; i++) {
    const next = w.pipes.find((p) => p.x + 36 > w.width * 0.3 - 17);
    const target = next ? next.gapY + 25 : PLAY_HEIGHT / 2;
    if (w.bird.y > target && w.bird.vy > 0) flap(w);
    step(w, FIXED_STEP);
    score = w.score;
  }
  assert.ok(score >= 5, `autopilot only scored ${score}`);
});
