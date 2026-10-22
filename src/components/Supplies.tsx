import { Text, View } from 'react-native';
import type { Supply, SupplyKind } from '../engine';

const EMOJI: Record<SupplyKind, string[]> = {
  food: ['🍞', '🥫', '🍎', '🍚'],
  drink: ['💧', '🥛', '🧃'],
  money: ['💵', '🪙'],
};
const GLOW: Record<SupplyKind, string> = { food: 'rgba(155,232,112,0.35)', drink: 'rgba(127,211,255,0.35)', money: 'rgba(255,211,77,0.45)' };

/** Air-dropped aid: food and water drift down on little parachutes, money flutters and spins. */
export function Supplies({ supplies, time, scale: s }: { supplies: Supply[]; time: number; scale: number }) {
  return (
    <>
      {supplies.map((it) => {
        const y = it.y + Math.sin(time * 3 + it.phase) * 6;
        const sway = Math.sin(time * 2 + it.phase) * 8;
        const chute = it.kind !== 'money';
        const spin = it.kind === 'money' ? Math.cos(time * 5 + it.phase) : 1;
        return (
          <View key={it.id} pointerEvents="none" style={{ position: 'absolute', left: (it.x - 24) * s, top: (y - 52) * s, width: 48 * s, height: 76 * s, transform: [{ rotate: `${chute ? sway : 0}deg` }] }}>
            {chute && (
              <>
                <View style={{ position: 'absolute', left: 4 * s, top: 0, width: 40 * s, height: 18 * s, borderTopLeftRadius: 20 * s, borderTopRightRadius: 20 * s, backgroundColor: '#E8E2D0' }}>
                  <View style={{ position: 'absolute', left: 13 * s, top: 0, width: 14 * s, height: 18 * s, backgroundColor: '#C9533B' }} />
                </View>
                <View style={{ position: 'absolute', left: 9 * s, top: 17 * s, width: 1.5 * s, height: 22 * s, backgroundColor: '#E8E2D0', transform: [{ rotate: '-24deg' }] }} />
                <View style={{ position: 'absolute', left: 38 * s, top: 17 * s, width: 1.5 * s, height: 22 * s, backgroundColor: '#E8E2D0', transform: [{ rotate: '24deg' }] }} />
              </>
            )}
            <View style={{ position: 'absolute', left: 6 * s, top: 36 * s, width: 36 * s, height: 36 * s, borderRadius: 18 * s, backgroundColor: GLOW[it.kind], transform: [{ scale: 1 + Math.sin(time * 6 + it.phase) * 0.12 }] }} />
            <Text style={{ position: 'absolute', left: 0, top: 38 * s, width: 48 * s, textAlign: 'center', fontSize: 26 * s, lineHeight: 32 * s, transform: [{ scaleX: spin }] }}>
              {EMOJI[it.kind][it.variant % EMOJI[it.kind].length]}
            </Text>
          </View>
        );
      })}
    </>
  );
}
