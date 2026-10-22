import { memo } from 'react';
import { View } from 'react-native';
import { GROUND_HEIGHT, GROUND_Y, type Crater } from '../engine';
import { colors, seeded } from './theme';

const TILE = 600;
const ROCKS = (() => {
  const r = seeded(77);
  return Array.from({ length: 34 }, () => ({ x: r() * TILE, y: 4 + r() * (GROUND_HEIGHT - 20), w: 6 + r() * 22, h: 4 + r() * 10, rot: r() * 60 - 30, dark: r() < 0.4 }));
})();
const BARS = (() => {
  const r = seeded(91);
  return Array.from({ length: 5 }, () => ({ x: r() * TILE, len: 30 + r() * 40, rot: -20 - r() * 40 }));
})();

const Strip = memo(function Strip({ scale: s }: { scale: number }) {
  return (
    <View style={{ position: 'absolute', left: 0, top: 0, width: TILE * 2 * s, height: GROUND_HEIGHT * s }}>
      {[0, TILE].flatMap((copy) => [
        ...ROCKS.map((k, i) => (
          <View key={`${copy}r${i}`} style={{
            position: 'absolute', left: (k.x + copy) * s, top: k.y * s, width: k.w * s, height: k.h * s, borderRadius: 2 * s,
            backgroundColor: k.dark ? colors.rubbleDark : colors.rubble, transform: [{ rotate: `${k.rot}deg` }],
          }} />
        )),
        ...BARS.map((b, i) => (
          <View key={`${copy}b${i}`} style={{ position: 'absolute', left: (b.x + copy) * s, top: -6 * s, width: 3 * s, height: b.len * s, backgroundColor: '#5A3A28', transform: [{ rotate: `${b.rot}deg` }] }} />
        )),
      ])}
    </View>
  );
});

export const Ground = memo(function Ground({ scale: s, scroll, craters }: { scale: number; scroll: number; craters: Crater[] }) {
  const offset = -(scroll % TILE);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: GROUND_Y * s, height: GROUND_HEIGHT * s, backgroundColor: colors.ground, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 8 * s, backgroundColor: colors.groundTop }} />
      <View style={{ position: 'absolute', left: offset * s, top: 0 }}>
        <Strip scale={s} />
      </View>
      {craters.map((c) => (
        <View key={c.id} style={{ position: 'absolute', left: (c.x - c.size / 2) * s, top: -c.size * 0.12 * s, width: c.size * s, height: c.size * 0.38 * s, borderRadius: (c.size / 2) * s, backgroundColor: colors.crater, opacity: 0.9 }}>
          <View style={{ position: 'absolute', left: c.size * 0.15 * s, top: c.size * 0.08 * s, width: c.size * 0.7 * s, height: c.size * 0.18 * s, borderRadius: c.size * 0.35 * s, backgroundColor: '#0C0908' }} />
        </View>
      ))}
    </View>
  );
});
