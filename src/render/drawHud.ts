import { LOW_ENERGY, MAX_ENERGY, MAX_HEARTS, metres, type World } from '../engine';
import { colors } from '../components/theme';
import type { Painter } from './Painter';

export interface Insets { top: number; left: number; right: number }

const HEART = (() => {
  // Heart outline as a polygon, 20 units wide, centred on (0, 0).
  const pts: number[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push(x * 0.62, y * 0.62);
  }
  return pts;
})();

/** Hearts, strength bar, distance and money, drawn in the same canvas as the game. */
export function drawHud(p: Painter, world: World, inset: Insets) {
  if (world.phase === 'ready') return;
  const pl = world.player;
  const x0 = inset.left + 14;
  const y0 = inset.top + 22;

  for (let i = 0; i < MAX_HEARTS; i++) {
    p.save();
    p.translate(x0 + 10 + i * 26, y0);
    p.save(); p.translate(1.5, 1.5); p.poly(HEART, '#000000', 0.6); p.restore();
    p.poly(HEART, i < pl.hearts ? '#E5484D' : '#2A1F1B');
    p.restore();
  }

  const pct = Math.max(0, pl.energy / MAX_ENERGY);
  const low = pl.energy <= LOW_ENERGY;
  const pulse = low ? 0.55 + Math.abs(Math.sin(world.time * 8)) * 0.45 : 1;
  const barColor = pct > 0.5 ? colors.energyHigh : low ? colors.energyLow : colors.energyMid;
  const by = y0 + 20;
  // little bread icon
  p.rrect(x0, by - 1, 16, 10, 5, '#C98A3E', pulse);
  p.rrect(x0 + 1, by - 2, 14, 5, 3, '#E3AE62', pulse);
  p.rrect(x0 + 22, by - 3, 124, 14, 7, '#000000', 0.85 * pulse);
  if (pct > 0) p.rrect(x0 + 24, by - 1, 120 * pct, 10, 5, barColor, pulse);
  if (low) {
    p.text('Find food & water!', x0 + 1.5, by + 25.5, 13, '#000000', 'left', pulse);
    p.text('Find food & water!', x0, by + 24, 13, colors.energyLow, 'left', pulse);
  }

  const cx = world.width / 2;
  const m = `${metres(world)} m`;
  p.text(m, cx + 2, inset.top + 34, 38, '#000000', 'center');
  p.text(m, cx, inset.top + 32, 38, colors.text, 'center');
  const coinY = inset.top + 64;
  p.circle(cx - 22, coinY, 8, '#E0A21A');
  p.circle(cx - 22, coinY, 5.5, '#FFD34D');
  p.text(String(world.coins), cx - 10 + 1.5, coinY + 1.5, 18, '#000000', 'left');
  p.text(String(world.coins), cx - 10, coinY, 18, '#FFD34D', 'left');
}
