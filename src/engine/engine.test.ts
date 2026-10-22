/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bombImpactX, createWorld, dive, groundedY, jump, playerX, step, togglePause } from './engine';
import { FIXED_STEP, GROUND_Y, MAX_ENERGY } from './constants';
import type { GameEvent, World } from './types';

const run = (w: World, seconds: number, each?: (w: World) => void) => {
  const events: GameEvent[] = [];
  for (let t = 0; t < seconds; t += FIXED_STEP) {
    each?.(w);
    events.push(...step(w, FIXED_STEP));
  }
  return events;
};

test('waits in the ready phase without bombs or hunger', () => {
  const w = createWorld(400, 1);
  run(w, 5);
  assert.equal(w.phase, 'ready');
  assert.equal(w.bombs.length, 0);
  assert.equal(w.player.energy, MAX_ENERGY);
});

test('first tap starts the run and launches the survivor upward', () => {
  const w = createWorld(400, 1);
  assert.deepEqual(jump(w), ['start', 'jump']);
  run(w, 0.15);
  assert.equal(w.phase, 'playing');
  assert.ok(w.player.y < groundedY());
});

test('the survivor lands and runs on the ground instead of dying', () => {
  const w = createWorld(400, 1);
  jump(w);
  w.nextBombIn = 999;
  run(w, 2);
  assert.equal(w.phase, 'playing');
  assert.ok(w.player.onGround);
});

test('energy drains and starving ends the run', () => {
  const w = createWorld(400, 1);
  jump(w);
  w.nextBombIn = 9999;
  w.supplies = [];
  w.nextSupplyIn = 1e9;
  const events = run(w, 30);
  assert.ok(events.includes('lowEnergy'));
  assert.ok(events.includes('over'));
  assert.equal(w.deathCause, 'hunger');
});

test('collecting supplies restores energy and money adds coins', () => {
  const w = createWorld(400, 1);
  jump(w);
  w.nextBombIn = 9999;
  w.nextSupplyIn = 1e9;
  w.player.energy = 40;
  w.supplies.push({ id: 900, kind: 'food', variant: 0, x: playerX(w), y: w.player.y, phase: -Math.PI / 2 - w.time * 3 });
  const ev = step(w, FIXED_STEP);
  assert.ok(ev.includes('food'));
  assert.ok(w.player.energy > 60);
  w.supplies.push({ id: 901, kind: 'money', variant: 0, x: playerX(w), y: w.player.y, phase: -Math.PI / 2 - w.time * 3 });
  assert.ok(step(w, FIXED_STEP).includes('money'));
  assert.equal(w.coins, 1);
});

test('a bomb landing on the survivor costs a heart, then grants brief invulnerability', () => {
  const w = createWorld(400, 1);
  jump(w);
  w.nextBombIn = 9999;
  run(w, 1.2);
  w.bombs.push({ id: 1, x: playerX(w), y: GROUND_Y - 40, vy: 400, wobble: 0 });
  w.bombs.push({ id: 2, x: playerX(w) + 10, y: GROUND_Y - 40, vy: 400, wobble: 0 });
  const ev = run(w, 0.3);
  assert.ok(ev.includes('explosion'));
  assert.equal(ev.filter((e) => e === 'hurt').length, 1);
  assert.equal(w.player.hearts, 2);
});

test('losing all hearts ends the run', () => {
  const w = createWorld(400, 1);
  jump(w);
  w.player.hearts = 1;
  w.bombs.push({ id: 1, x: playerX(w), y: w.player.y - 5, vy: 300, wobble: 0 });
  const ev = run(w, 0.1);
  assert.ok(ev.includes('over'));
  assert.equal(w.deathCause, 'bomb');
});

test('the impact predictor matches where bombs actually land', () => {
  const w = createWorld(500, 3);
  jump(w);
  w.nextBombIn = 0;
  step(w, FIXED_STEP);
  const b = w.bombs[0];
  const predicted = bombImpactX(w, b);
  let landed = NaN;
  for (let i = 0; i < 400 && Number.isNaN(landed); i++) {
    const before = b.x;
    step(w, FIXED_STEP);
    if (!w.bombs.includes(b)) landed = before;
  }
  assert.ok(Math.abs(landed - predicted) < 25, `predicted ${predicted}, landed ${landed}`);
});

test('pause freezes the simulation and dive only works in the air', () => {
  const w = createWorld(400, 1);
  assert.deepEqual(dive(w), []);
  jump(w);
  togglePause(w);
  const y = w.player.y;
  run(w, 1);
  assert.equal(w.player.y, y);
  assert.deepEqual(jump(w), []);
  togglePause(w);
  assert.deepEqual(dive(w), ['dive']);
});

test('a careful autopilot survives a while and collects supplies', () => {
  const w = createWorld(420, 42);
  jump(w);
  run(w, 40, (w) => {
    if (w.phase !== 'playing') return;
    const px = playerX(w);
    const threat = w.bombs.find((b) => Math.abs(bombImpactX(w, b) - px) < 90 && b.y > 150);
    const s = w.supplies.find((s) => s.x > px - 10 && s.x < px + 160);
    const target = threat ? 120 : s ? s.y : groundedY();
    if (w.player.y > target + 10 && w.player.vy > -100) jump(w);
  });
  assert.ok(w.runTime > 15, `autopilot only survived ${w.runTime.toFixed(1)}s`);
});
