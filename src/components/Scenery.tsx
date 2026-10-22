import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GROUND_HEIGHT, PLAY_HEIGHT } from '../engine';
import { colors } from './theme';

/** Static sky with parallax clouds/skyline (offset is in world px). */
export const Sky = memo(function Sky({ width, scale, offset }: { width: number; scale: number; offset: number }) {
  const clouds = [0.1, 0.45, 0.8, 1.15].map((r, i) => {
    const span = width + 160;
    const x = (((r * span - offset * 0.15) % span) + span) % span - 80;
    return <View key={i} style={[styles.cloud, { left: x * scale, top: (60 + i * 37 % 90) * scale, width: 90 * scale, height: 28 * scale, borderRadius: 14 * scale }]} />;
  });
  const buildings = Array.from({ length: Math.ceil(width / 40) + 2 }, (_, i) => {
    const x = i * 40 - ((offset * 0.3) % 40);
    const h = 40 + ((i * 37) % 50);
    return <View key={i} style={[styles.building, { left: x * scale, width: 38 * scale, height: h * scale, top: (PLAY_HEIGHT - h) * scale }]} />;
  });
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.skyLow, { top: PLAY_HEIGHT * 0.55 * scale, height: PLAY_HEIGHT * 0.45 * scale }]} />
      {clouds}
      {buildings}
    </View>
  );
});

export const Ground = memo(function Ground({ width, scale, offset }: { width: number; scale: number; offset: number }) {
  const stripes = Array.from({ length: Math.ceil(width / 24) + 3 }, (_, i) => (
    <View key={i} style={[styles.stripe, { left: (i * 24 - (offset % 24)) * scale, width: 12 * scale, height: 14 * scale, transform: [{ skewX: '-30deg' }] }]} />
  ));
  return (
    <View pointerEvents="none" style={[styles.ground, { top: PLAY_HEIGHT * scale, height: GROUND_HEIGHT * scale }]}>
      <View style={[styles.grass, { height: 14 * scale }]}>{stripes}</View>
      <View style={[styles.dirtLine, { top: 14 * scale, height: 4 * scale }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  skyLow: { position: 'absolute', left: 0, right: 0, backgroundColor: colors.skyLow },
  cloud: { position: 'absolute', backgroundColor: colors.cloud, opacity: 0.9 },
  building: { position: 'absolute', backgroundColor: colors.city, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  ground: { position: 'absolute', left: 0, right: 0, backgroundColor: colors.ground, borderTopWidth: 2, borderColor: colors.ink, overflow: 'hidden' },
  grass: { position: 'absolute', left: 0, right: 0, top: 0, backgroundColor: colors.grass, overflow: 'hidden' },
  stripe: { position: 'absolute', top: 0, backgroundColor: '#9BE870' },
  dirtLine: { position: 'absolute', left: 0, right: 0, backgroundColor: colors.groundDark },
});
