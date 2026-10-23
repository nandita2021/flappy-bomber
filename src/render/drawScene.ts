import {
  BLAST_RADIUS, BLAST_TIME, GROUND_HEIGHT, GROUND_Y, PLAYER_HALF_HEIGHT, WORLD_HEIGHT,
  bombImpactX, isInvulnerable, playerX, type Supply, type World,
} from '../engine';
import { colors, seeded } from '../components/theme';
import type { Painter } from './Painter';

/**
 * Draws one frame of the game through the platform Painter. Shared by web, iOS
 * and Android. Static scenery is drawn once into cached layers; everything that
 * moves is a handful of cheap shapes per frame.
 */

// ---------- static ruined city (generated once) ----------
const CITY_TILE = 1200;
interface Building { pts: number[]; windows: { x: number; y: number; lit: boolean }[]; holes: { x: number; y: number; r: number }[]; topY: number; x: number; w: number }

function makeCity(seed: number, minH: number, maxH: number, withWindows: boolean): Building[] {
  const r = seeded(seed);
  const out: Building[] = [];
  let x = 0;
  while (x < CITY_TILE - 40) {
    const w = Math.min(50 + r() * 70, CITY_TILE - x);
    const h = minH + r() * (maxH - minH);
    const top = GROUND_Y - h;
    // Jagged, torn roofline: the building has been hit.
    const segs = 3 + Math.floor(r() * 4);
    const pts = [x, GROUND_Y + 4];
    let lowest = top;
    for (let i = 0; i <= segs; i++) {
      const px = x + (w * i) / segs;
      const py = top + (i === 0 || i === segs ? r() * 18 : r() * 46);
      lowest = Math.max(lowest, py);
      pts.push(px, py);
    }
    pts.push(x + w, GROUND_Y + 4);
    const windows: Building['windows'] = [];
    if (withWindows) {
      for (let wy = lowest + 14; wy < GROUND_Y - 24; wy += 34) {
        for (let wx = 10; wx < w - 14; wx += 22) if (r() < 0.55) windows.push({ x: x + wx, y: wy, lit: r() < 0.1 });
      }
    }
    const holes = r() < 0.5 ? [{ x: x + 14 + r() * Math.max(1, w - 34), y: lowest + 20 + r() * (h * 0.4), r: 8 + r() * 12 }] : [];
    if (r() > 0.1) out.push({ pts, windows, holes, topY: lowest, x, w });
    x += w + r() * 18;
  }
  return out;
}

const FAR = makeCity(11, 120, 260, false);
const MID = makeCity(29, 90, 210, true);
const FIRES = MID.filter((_, i) => i % 3 === 0).map((b, i) => ({ x: b.x + b.w * (0.3 + (i % 3) * 0.2), y: b.topY + 4 }));

function drawCityLayer(p: Painter, list: Building[], color: string) {
  for (const b of list) {
    p.poly(b.pts, color);
    for (const h of b.holes) p.ellipse(h.x, h.y, h.r, h.r * 0.8, colors.window);
    for (const w of b.windows) p.rect(w.x, w.y, 9, 13, w.lit ? colors.windowLit : colors.window, w.lit ? 0.85 : 1);
  }
}

// ---------- rubble ground (generated once) ----------
const GROUND_TILE = 600;
const ROCKS = (() => {
  const r = seeded(77);
  return Array.from({ length: 34 }, () => ({ x: r() * GROUND_TILE, y: 6 + r() * (GROUND_HEIGHT - 22), w: 6 + r() * 22, h: 4 + r() * 10, rot: r() * 60 - 30, dark: r() < 0.4 }));
})();
const BARS = (() => {
  const r = seeded(91);
  return Array.from({ length: 5 }, () => ({ x: r() * GROUND_TILE, len: 30 + r() * 40, rot: 20 + r() * 40 }));
})();

function drawGroundTile(p: Painter) {
  p.rect(0, 0, GROUND_TILE, GROUND_HEIGHT, colors.ground);
  p.rect(0, 0, GROUND_TILE, 8, colors.groundTop);
  for (const k of ROCKS) {
    p.save();
    p.translate(k.x + k.w / 2, k.y + k.h / 2);
    p.rotate(k.rot);
    p.rrect(-k.w / 2, -k.h / 2, k.w, k.h, 2, k.dark ? colors.rubbleDark : colors.rubble);
    p.restore();
  }
  for (const b of BARS) {
    const rad = (b.rot * Math.PI) / 180;
    p.line(b.x, 2, b.x + Math.sin(rad) * b.len, 2 + Math.cos(rad) * b.len * 0.6, 3, '#5A3A28');
  }
}

const wrap = (v: number, m: number) => ((v % m) + m) % m;

// ---------- per-frame pieces ----------
function drawSky(p: Painter, w: number) {
  const bands: [number, number, string][] = [
    [0, 0.3, colors.skyTop], [0.3, 0.45, '#331B14'], [0.45, 0.6, colors.skyMid],
    [0.6, 0.72, '#73351E'], [0.72, 0.82, colors.skyLow], [0.82, 1.0, colors.horizon],
  ];
  for (const [a, b, c] of bands) p.rect(0, GROUND_Y * a, w, GROUND_Y * (b - a) + 1, c);
  p.circle(w * 0.62 + 45, GROUND_Y * 0.42 + 45, 45, colors.sun, 0.45);
}

function drawPlanes(p: Painter, world: World) {
  for (const pl of world.planes) {
    p.save();
    p.translate(pl.x - 40, pl.y);
    p.rrect(0, 8, 70, 8, 4, '#140E0C');
    p.poly([26, 2, 40, 2, 48, 22, 32, 22], '#140E0C');
    p.poly([62, 0, 68, 0, 70, 12, 60, 12], '#140E0C');
    if (Math.sin(world.time * 12) > 0) p.circle(-1, 12, 2, '#FF3B30');
    p.restore();
  }
}

function drawSmoke(p: Painter, world: World) {
  const span = world.width * 1.4;
  for (let i = 0; i < 3; i++) {
    const baseX = wrap([0.12, 0.47, 0.81][i] * span - world.scroll * 0.15, span) - world.width * 0.2;
    for (let k = 0; k < 5; k++) {
      const t = (world.time * 0.35 + k / 5 + i * 0.13) % 1;
      const size = 12 + t * 30;
      p.circle(baseX + t * 40, GROUND_Y - 140 - t * 240, size, colors.smoke, 0.55 * (1 - t));
    }
  }
}

function drawFires(p: Painter, world: World, offset: number) {
  for (const copy of [0, CITY_TILE]) {
    for (let i = 0; i < FIRES.length; i++) {
      const f = FIRES[i];
      const fx = f.x + copy + offset;
      if (fx < -30 || fx > world.width + 30) continue;
      const flick = 0.75 + Math.sin(world.time * 17 + i * 3) * 0.15 + Math.sin(world.time * 29 + i) * 0.1;
      const h = 30 * flick;
      p.poly([fx - 12, f.y, fx - 8, f.y - h * 0.6, fx - 3, f.y - h * 0.4, fx, f.y - h, fx + 4, f.y - h * 0.5, fx + 9, f.y - h * 0.7, fx + 12, f.y], colors.fire, 0.9);
      p.poly([fx - 6, f.y, fx - 2, f.y - h * 0.55, fx + 3, f.y - h * 0.35, fx + 6, f.y], colors.fireCore);
    }
  }
}

function drawCraters(p: Painter, world: World) {
  for (const c of world.craters) {
    p.ellipse(c.x, GROUND_Y + c.size * 0.07, c.size / 2, c.size * 0.19, colors.crater, 0.9);
    p.ellipse(c.x, GROUND_Y + c.size * 0.1, c.size * 0.35, c.size * 0.08, '#0C0908');
  }
}

// Supplies are vector icons (no emoji), so they look the same everywhere and draw fast.
function drawSupplyIcon(p: Painter, s: Supply, time: number) {
  switch (s.kind) {
    case 'food':
      if (s.variant === 0) { // bread loaf
        p.rrect(-13, -7, 26, 15, 7, '#C98A3E'); p.rrect(-11, -8, 22, 7, 4, '#E3AE62');
        p.line(-6, -6, -3, 0, 2, '#9A6526'); p.line(1, -6, 4, 0, 2, '#9A6526');
      } else if (s.variant === 1) { // canned food
        p.rrect(-9, -12, 18, 24, 3, '#9AA3AB'); p.rect(-9, -5, 18, 10, '#C9533B'); p.rect(-9, -12, 18, 3, '#C7CED4');
      } else if (s.variant === 2) { // apple
        p.circle(-4, 1, 9, '#D93B30'); p.circle(4, 1, 9, '#D93B30'); p.line(0, -8, 1, -13, 2, '#5A3A1E'); p.ellipse(5, -11, 5, 2.5, '#6BBF3A');
      } else { // rice sack
        p.rrect(-11, -10, 22, 22, 5, '#E8DDBF'); p.rect(-11, -10, 22, 4, '#BFAF86'); p.circle(0, 3, 4, '#BFAF86');
      }
      break;
    case 'drink':
      if (s.variant === 0) { // water drop
        p.circle(0, 4, 9, '#4FB3F2'); p.poly([-8, 1, 0, -14, 8, 1], '#4FB3F2'); p.circle(-3, 4, 2.5, '#BFE6FF');
      } else if (s.variant === 1) { // milk bottle
        p.rrect(-7, -6, 14, 19, 4, '#F4F1EA'); p.rect(-4, -12, 8, 7, '#F4F1EA'); p.rect(-5, -14, 10, 3, '#4FB3F2'); p.rect(-7, 0, 14, 5, '#4FB3F2');
      } else { // juice box
        p.rect(-8, -10, 16, 22, '#F28C28'); p.rect(-8, -10, 16, 5, '#FFD34D'); p.line(3, -10, 6, -16, 2, '#FFFFFF'); p.circle(0, 4, 3.5, '#7BD35A');
      }
      break;
    case 'money': {
      const spin = Math.cos(time * 5 + s.phase);
      p.save();
      p.scale(Math.max(0.15, Math.abs(spin)), 1);
      if (s.variant === 0) { // banknote
        p.rect(-14, -8, 28, 16, '#5BAA4A'); p.rect(-12, -6, 24, 12, '#7BCB66'); p.circle(0, 0, 4.5, '#3E7F31');
      } else { // coin
        p.circle(0, 0, 11, '#E0A21A'); p.circle(0, 0, 8, '#FFD34D'); p.rect(-1.5, -5, 3, 10, '#E0A21A');
      }
      p.restore();
      break;
    }
  }
}

const GLOW = { food: '#9BE870', drink: '#7FD3FF', money: '#FFD34D' } as const;
const CANOPY = (() => {
  const pts: number[] = [];
  for (let i = 0; i <= 10; i++) { const a = Math.PI + (Math.PI * i) / 10; pts.push(Math.cos(a) * 20, Math.sin(a) * 16); }
  return pts;
})();

function drawSupplies(p: Painter, world: World) {
  for (const s of world.supplies) {
    if (s.x < -40 || s.x > world.width + 40) continue;
    const y = s.y + Math.sin(world.time * 3 + s.phase) * 6;
    p.save();
    p.translate(s.x, y);
    if (s.kind !== 'money') {
      p.rotate(Math.sin(world.time * 2 + s.phase) * 8);
      p.save(); p.translate(0, -34); p.poly(CANOPY, '#E8E2D0'); p.poly([-6, -15, 6, -15, 5, 0, -5, 0], '#C9533B'); p.restore();
      p.line(-18, -34, -6, -10, 1.5, '#E8E2D0');
      p.line(18, -34, 6, -10, 1.5, '#E8E2D0');
    }
    p.circle(0, 0, 18 * (1 + Math.sin(world.time * 6 + s.phase) * 0.12), GLOW[s.kind], 0.35);
    drawSupplyIcon(p, s, world.time);
    p.restore();
  }
}

function drawBombs(p: Painter, world: World) {
  for (const b of world.bombs) {
    const ix = bombImpactX(world, b);
    const danger = Math.min(1, Math.max(0, (b.y + 50) / (GROUND_Y + 50)));
    const blink = Math.sin(world.time * (10 + danger * 20)) > -0.2;
    const w = 40 + danger * 30;
    const a = blink ? 0.4 + danger * 0.6 : 0.15;
    p.ellipse(ix, GROUND_Y, w / 2, 6, colors.warning, a * 0.3);
    p.ring(ix, GROUND_Y, w / 2, 2, colors.warning, a);
    if (blink && danger > 0.05) p.text('!', ix, GROUND_Y - 14, 22, colors.warning, 'center', danger);

    p.save();
    p.translate(b.x, b.y);
    p.rotate(Math.sin(world.time * 8 + b.wobble) * 6);
    p.poly([-12, -22, 12, -22, 6, -12, -6, -12], colors.bomb); // tail fins
    p.rrect(-7, -16, 14, 30, 7, colors.bomb);
    p.rect(-7, -8, 14, 4, colors.bombBand);
    p.rrect(-4, -2, 3, 10, 1.5, '#FFFFFF', 0.18);
    p.restore();
  }
}

function drawSurvivor(p: Painter, world: World) {
  const pl = world.player;
  const airborne = !pl.onGround;
  const collapsed = world.phase === 'over' && pl.onGround;
  const hurt = world.time - pl.hurtTime < 0.25;
  const blink = isInvulnerable(world) && Math.sin(world.time * 30) > 0;
  const t = world.time;

  let legSwing = Math.sin(pl.runCycle) * 38;
  let armSwing = -Math.sin(pl.runCycle) * 42;
  let armBase = 0;
  let lean = 8 + Math.cos(pl.runCycle * 2) * 2;
  let bob = Math.abs(Math.sin(pl.runCycle)) * -3;
  if (airborne) {
    armBase = 150;
    armSwing = Math.sin(t * 22) * 25;
    legSwing = 25 + Math.sin(t * 9) * 10;
    lean = Math.max(-15, Math.min(25, pl.vy / 30));
    bob = 0;
  }
  if (collapsed) { lean = 80; legSwing = 10; armSwing = 30; armBase = 20; bob = 6; }

  const alpha = blink ? 0.35 : 1;
  const shirt = hurt ? '#E5484D' : colors.shirt;
  // Local frame: origin at the hip, +y down. Feet sit at the ground when grounded.
  const limb = (x: number, y: number, len: number, deg: number, width: number, color: string, shoe?: string) => {
    const r = (deg * Math.PI) / 180;
    const ex = x - Math.sin(r) * len;
    const ey = y + Math.cos(r) * len;
    p.line(x, y, ex, ey, width, color, alpha);
    if (shoe) p.line(ex - 1, ey, ex + 5, ey, 5, shoe, alpha);
  };

  p.save();
  p.translate(playerX(world), pl.y + PLAYER_HALF_HEIGHT - 30 + bob);
  p.rotate(lean);
  limb(0, 8, 18, -legSwing, 7, '#2F3946', colors.shoe); // back leg
  limb(0, -10, 15, armBase - armSwing, 6, '#A87452'); // back arm
  p.rrect(-15, -12, 9, 16, 3, colors.bag, alpha); // bag
  p.rrect(-8, -14, 16, 24, 4, shirt, alpha); // torso
  p.rect(0, -8, 6, 6, colors.shirtPatch, alpha);
  p.poly([-8, 8, -5, 13, -2, 8, 2, 8, 5, 13, 8, 8], shirt, alpha); // torn hem
  p.circle(2, -24, 9, colors.skin, alpha); // head
  p.poly([-7, -26, -6, -31, 2, -34, 9, -31, 11, -26], colors.hair, alpha); // head wrap
  const tail = Math.sin(t * 15) * 4;
  p.line(-6, -28, -12, -27 + tail, 3, colors.hair, alpha);
  p.rect(6, hurt ? -24 : -25, 3, hurt ? 1 : 3, colors.ink, alpha); // eye
  limb(0, 8, 18, legSwing, 7, colors.pants, colors.shoe); // front leg
  p.rrect(-4, 4, 9, 8, 2, colors.pants, alpha);
  p.rect(-3, 6, 4, 4, colors.pantsPatch, alpha);
  limb(0, -10, 15, armBase + armSwing, 6, colors.skin); // front arm
  p.restore();
}

function drawBlasts(p: Painter, world: World) {
  for (const bl of world.blasts) {
    const t = bl.age / BLAST_TIME;
    const ring = BLAST_RADIUS * (0.4 + t * 1.3);
    const fire = BLAST_RADIUS * (0.35 + Math.sin(Math.min(1, t * 1.6) * Math.PI) * 0.65);
    p.ring(bl.x, bl.y, ring, Math.max(0.5, 4 * (1 - t)), '#FFE9B0', 1 - t);
    p.circle(bl.x, bl.y - fire * 0.1, fire, colors.fire, Math.max(0, 1 - t * 1.2));
    p.circle(bl.x, bl.y - fire * 0.25, fire * 0.55, colors.fireCore, Math.max(0, 1 - t * 1.6));
  }
}

function drawParticles(p: Painter, world: World) {
  for (const pt of world.particles) {
    const t = pt.age / pt.life;
    if (pt.kind === 'pickup') {
      p.text(pt.text ?? '', pt.x + 1.5, pt.y + 1.5, pt.size, '#000000', 'center', 1 - t);
      p.text(pt.text ?? '', pt.x, pt.y, pt.size, pt.color, 'center', 1 - t);
    } else if (pt.kind === 'debris') {
      p.save();
      p.translate(pt.x, pt.y);
      p.rotate(pt.age * 720 + pt.id * 37);
      p.rect(-pt.size / 2, -pt.size / 2, pt.size, pt.size, pt.color, 1 - t * t);
      p.restore();
    } else {
      p.circle(pt.x, pt.y, pt.size / 2, pt.color, pt.kind === 'smoke' ? 0.6 * (1 - t) : 1 - t * t);
    }
  }
}

/** Draw the complete world. The painter is already scaled so 1 unit = 1 world px. */
export function drawScene(p: Painter, world: World) {
  const w = world.width;
  const shakeX = Math.sin(world.time * 93) * world.shake * 9;
  const shakeY = Math.cos(world.time * 71) * world.shake * 7;

  p.save();
  p.translate(shakeX, shakeY);
  drawSky(p, w);
  drawPlanes(p, world);

  const far = p.cache('far', CITY_TILE, GROUND_Y + 4, (c) => drawCityLayer(c, FAR, colors.farRuins));
  const farX = -wrap(world.scroll * 0.15, CITY_TILE);
  p.drawCached(far, farX, 0);
  p.drawCached(far, farX + CITY_TILE, 0);

  drawSmoke(p, world);

  const mid = p.cache('mid', CITY_TILE, GROUND_Y + 4, (c) => drawCityLayer(c, MID, colors.midRuins));
  const midX = -wrap(world.scroll * 0.45, CITY_TILE);
  p.drawCached(mid, midX, 0);
  p.drawCached(mid, midX + CITY_TILE, 0);
  drawFires(p, world, midX);

  const ground = p.cache('ground', GROUND_TILE, GROUND_HEIGHT, drawGroundTile);
  const gX = -wrap(world.scroll, GROUND_TILE);
  for (let x = gX; x < w; x += GROUND_TILE) p.drawCached(ground, x, GROUND_Y);
  drawCraters(p, world);

  drawSupplies(p, world);
  drawBombs(p, world);
  drawSurvivor(p, world);
  drawBlasts(p, world);
  drawParticles(p, world);
  p.restore();

  if (world.flash > 0) p.rect(0, 0, w, WORLD_HEIGHT, '#FFB070', world.flash * 0.3);
  if (isInvulnerable(world) && world.phase === 'playing') {
    p.rect(0, 0, w, 6, '#E5484D', 0.6);
    p.rect(0, WORLD_HEIGHT - 6, w, 6, '#E5484D', 0.6);
    p.rect(0, 6, 6, WORLD_HEIGHT - 12, '#E5484D', 0.6);
    p.rect(w - 6, 6, 6, WORLD_HEIGHT - 12, '#E5484D', 0.6);
  }
}
