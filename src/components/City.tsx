import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GROUND_Y, type Plane } from '../engine';
import { colors, seeded } from './theme';

/**
 * Parallax ruined city. Each layer is a static strip built once (memoised) and
 * scrolled with a single translateX per frame, so the heavy part never re-renders.
 */
const TILE = 1200;

interface BuildingSpec { x: number; w: number; h: number; notches: { x: number; w: number; d: number }[]; windows: { x: number; y: number; lit: boolean }[]; holes: { x: number; y: number; r: number }[] }

function makeLayer(seed: number, minH: number, maxH: number, withWindows: boolean): BuildingSpec[] {
  const r = seeded(seed);
  const out: BuildingSpec[] = [];
  let x = 0;
  while (x < TILE) {
    const w = 50 + r() * 70;
    const h = minH + r() * (maxH - minH);
    const notches = Array.from({ length: 1 + Math.floor(r() * 3) }, () => ({ x: r() * (w - 14), w: 8 + r() * 18, d: 10 + r() * 40 }));
    const windows: BuildingSpec['windows'] = [];
    if (withWindows) {
      for (let wy = 30; wy < h - 20; wy += 34) for (let wx = 10; wx < w - 14; wx += 22) if (r() < 0.55) windows.push({ x: wx, y: wy, lit: r() < 0.12 });
    }
    const holes = r() < 0.5 ? [{ x: 10 + r() * (w - 30), y: 30 + r() * (h * 0.5), r: 8 + r() * 12 }] : [];
    if (r() > 0.12) out.push({ x, w, h, notches, windows, holes });
    x += w + r() * 18;
  }
  return out;
}

const Layer = memo(function Layer({ specs, color, scale, skyColor }: { specs: BuildingSpec[]; color: string; scale: number; skyColor: string }) {
  const s = scale;
  const items: React.ReactNode[] = [];
  for (const copy of [0, TILE]) {
    for (const b of specs) {
      const key = `${copy}-${b.x}`;
      items.push(
        <View key={key} style={{ position: 'absolute', left: (b.x + copy) * s, top: (GROUND_Y - b.h) * s, width: b.w * s, height: (b.h + 4) * s, backgroundColor: color }}>
          {b.notches.map((n, i) => (
            <View key={i} style={{ position: 'absolute', left: n.x * s, top: -1, width: n.w * s, height: n.d * s, backgroundColor: skyColor, transform: [{ skewX: '18deg' }] }} />
          ))}
          {b.windows.map((w, i) => (
            <View key={`w${i}`} style={{ position: 'absolute', left: w.x * s, top: w.y * s, width: 9 * s, height: 13 * s, backgroundColor: w.lit ? colors.windowLit : colors.window, opacity: w.lit ? 0.85 : 1 }} />
          ))}
          {b.holes.map((h, i) => (
            <View key={`h${i}`} style={{ position: 'absolute', left: h.x * s, top: h.y * s, width: h.r * 2 * s, height: h.r * 1.6 * s, borderRadius: h.r * s, backgroundColor: colors.window }} />
          ))}
        </View>,
      );
    }
  }
  return <View style={{ position: 'absolute', left: 0, top: 0, width: TILE * 2 * s, height: GROUND_Y * s }}>{items}</View>;
});

const FAR = makeLayer(11, 120, 260, false);
const MID = makeLayer(29, 90, 210, true);
/** Burning spots on the mid layer, drawn every frame so they can flicker. */
const FIRES = MID.filter((_, i) => i % 3 === 0).map((b, i) => ({ x: b.x + b.w * (0.3 + (i % 3) * 0.2), y: GROUND_Y - b.h + 6 }));

function scrollOffset(scroll: number, factor: number) {
  return -((scroll * factor) % TILE);
}

export const City = memo(function City({ scale, scroll, time, planes, width }: { scale: number; scroll: number; time: number; planes: Plane[]; width: number }) {
  const s = scale;
  const farX = scrollOffset(scroll, 0.15);
  const midX = scrollOffset(scroll, 0.45);
  const smoke = useMemo(() => [0.12, 0.47, 0.81].map((r, i) => ({ r, i })), []);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* smoky sky gradient */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: GROUND_Y * 0.35 * s, backgroundColor: colors.skyTop }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: GROUND_Y * 0.3 * s, height: GROUND_Y * 0.3 * s, backgroundColor: colors.skyMid }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: GROUND_Y * 0.58 * s, height: GROUND_Y * 0.25 * s, backgroundColor: colors.skyLow }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: GROUND_Y * 0.8 * s, height: GROUND_Y * 0.2 * s, backgroundColor: colors.horizon }} />
      <View style={{ position: 'absolute', left: width * 0.62 * s, top: GROUND_Y * 0.42 * s, width: 90 * s, height: 90 * s, borderRadius: 45 * s, backgroundColor: colors.sun, opacity: 0.45 }} />

      {/* planes crossing the sky */}
      {planes.map((p) => (
        <View key={p.id} style={{ position: 'absolute', left: (p.x - 40) * s, top: p.y * s, width: 80 * s, height: 22 * s }}>
          <View style={{ position: 'absolute', left: 0, top: 8 * s, width: 70 * s, height: 8 * s, borderRadius: 4 * s, backgroundColor: '#140E0C' }} />
          <View style={{ position: 'absolute', left: 26 * s, top: 2 * s, width: 14 * s, height: 20 * s, borderRadius: 3 * s, backgroundColor: '#140E0C', transform: [{ skewX: '25deg' }] }} />
          <View style={{ position: 'absolute', left: 60 * s, top: 0, width: 8 * s, height: 12 * s, backgroundColor: '#140E0C', transform: [{ skewX: '30deg' }] }} />
          <View style={{ position: 'absolute', left: -2 * s, top: 10 * s, width: 3 * s, height: 4 * s, borderRadius: 2 * s, backgroundColor: Math.sin(time * 12) > 0 ? '#FF3B30' : '#140E0C' }} />
        </View>
      ))}

      <View style={{ position: 'absolute', left: farX * s, top: 0 }}>
        <Layer specs={FAR} color={colors.farRuins} scale={s} skyColor={colors.skyLow} />
      </View>

      {/* smoke columns rising from the far city */}
      {smoke.map(({ r, i }) => {
        const baseX = (((r * width * 1.4 - scroll * 0.15) % (width * 1.4)) + width * 1.4) % (width * 1.4) - width * 0.2;
        return [0, 1, 2, 3, 4].map((k) => {
          const t = (time * 0.35 + k / 5 + i * 0.13) % 1;
          const size = (24 + t * 60) * s;
          return (
            <View key={`${i}-${k}`} style={{
              position: 'absolute', left: (baseX + t * 40) * s - size / 2, top: (GROUND_Y - 140 - t * 240) * s - size / 2,
              width: size, height: size, borderRadius: size / 2, backgroundColor: colors.smoke, opacity: 0.55 * (1 - t),
            }} />
          );
        });
      })}

      <View style={{ position: 'absolute', left: midX * s, top: 0 }}>
        <Layer specs={MID} color={colors.midRuins} scale={s} skyColor={colors.horizon} />
        {/* flickering fires on the mid buildings */}
        {[0, TILE].flatMap((copy) =>
          FIRES.map((f, i) => {
            const fx = f.x + copy;
            const flick = 0.75 + Math.sin(time * 17 + i * 3) * 0.15 + Math.sin(time * 29 + i) * 0.1;
            return (
              <View key={`${copy}-${i}`} style={{ position: 'absolute', left: (fx - 12) * s, top: (f.y - 26 * flick) * s, width: 24 * s, height: 30 * flick * s }}>
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, borderTopLeftRadius: 12 * s, borderTopRightRadius: 12 * s, borderBottomLeftRadius: 4 * s, borderBottomRightRadius: 4 * s, backgroundColor: colors.fire, opacity: 0.9 }} />
                <View style={{ position: 'absolute', left: 6 * s, right: 6 * s, bottom: 0, height: 16 * flick * s, borderTopLeftRadius: 6 * s, borderTopRightRadius: 6 * s, backgroundColor: colors.fireCore }} />
              </View>
            );
          }),
        )}
      </View>
    </View>
  );
});
