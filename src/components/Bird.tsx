import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BIRD_RADIUS } from '../engine';
import { colors } from './theme';

interface Props { x: number; y: number; rotation: number; wingUp: boolean; scale: number }

function BirdView({ x, y, rotation, wingUp, scale }: Props) {
  const size = BIRD_RADIUS * 2 * scale;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.body,
        {
          width: size * 1.15, height: size, borderRadius: size / 2,
          left: (x - BIRD_RADIUS * 1.15) * scale, top: (y - BIRD_RADIUS) * scale,
          transform: [{ rotate: `${rotation}deg` }],
        },
      ]}
    >
      <View style={[styles.belly, { width: size * 0.7, height: size * 0.42, borderRadius: size * 0.21, left: size * 0.12, bottom: size * 0.06 }]} />
      <View style={[styles.wing, {
        width: size * 0.5, height: size * 0.32, borderRadius: size * 0.16,
        left: size * 0.05, top: wingUp ? size * 0.2 : size * 0.45,
        transform: [{ rotate: wingUp ? '-20deg' : '15deg' }],
      }]} />
      <View style={[styles.eye, { width: size * 0.38, height: size * 0.38, borderRadius: size * 0.19, right: size * 0.1, top: size * 0.08 }]}>
        <View style={[styles.pupil, { width: size * 0.14, height: size * 0.16, borderRadius: size * 0.08 }]} />
      </View>
      <View style={[styles.beak, { width: size * 0.42, height: size * 0.24, borderRadius: size * 0.1, right: -size * 0.18, top: size * 0.5 }]} />
    </View>
  );
}

export const Bird = memo(BirdView);

const styles = StyleSheet.create({
  body: { position: 'absolute', backgroundColor: colors.bird, borderWidth: 2, borderColor: colors.ink },
  belly: { position: 'absolute', backgroundColor: '#FFF3B0' },
  wing: { position: 'absolute', backgroundColor: '#FFFBEA', borderWidth: 2, borderColor: colors.ink },
  eye: { position: 'absolute', backgroundColor: '#fff', borderWidth: 2, borderColor: colors.ink, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 2 },
  pupil: { backgroundColor: colors.ink },
  beak: { position: 'absolute', backgroundColor: colors.beak, borderWidth: 2, borderColor: colors.ink },
});
