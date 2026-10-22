import { StyleSheet, Text, View } from 'react-native';
import { LOW_ENERGY, MAX_ENERGY, MAX_HEARTS } from '../engine';
import { GameButton } from './GameButton';
import { colors } from './theme';

interface Props {
  hearts: number;
  energy: number;
  metres: number;
  coins: number;
  time: number;
  muted: boolean;
  top: number;
  left: number;
  right: number;
  onPause: () => void;
  onToggleMute: () => void;
  showPause: boolean;
}

export function Hud({ hearts, energy, metres, coins, time, muted, top, left, right, onPause, onToggleMute, showPause }: Props) {
  const pct = energy / MAX_ENERGY;
  const low = energy <= LOW_ENERGY;
  const barColor = pct > 0.5 ? colors.energyHigh : pct > LOW_ENERGY / MAX_ENERGY ? colors.energyMid : colors.energyLow;
  const pulse = low ? 0.55 + Math.abs(Math.sin(time * 8)) * 0.45 : 1;
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View pointerEvents="none" style={[styles.left, { top: top + 12, left: left + 12 }]}>
        <Text style={styles.hearts}>
          {Array.from({ length: MAX_HEARTS }, (_, i) => (i < hearts ? '❤️' : '🖤')).join(' ')}
        </Text>
        <View style={[styles.barRow, { opacity: pulse }]}>
          <Text style={styles.barIcon}>🍞</Text>
          <View style={styles.barOuter}>
            <View style={[styles.barInner, { width: `${Math.max(0, pct) * 100}%`, backgroundColor: barColor }]} />
          </View>
        </View>
        {low && <Text style={[styles.lowText, { opacity: pulse }]}>Find food & water!</Text>}
      </View>

      <View pointerEvents="none" style={[styles.center, { top: top + 10 }]}>
        <Text style={styles.metres}>{metres} m</Text>
        <Text style={styles.coins}>💵 {coins}</Text>
      </View>

      <View pointerEvents="box-none" style={[styles.right, { top: top + 12, right: right + 12 }]}>
        <GameButton label={muted ? '🔇' : '🔊'} variant="icon" accessibilityLabel={muted ? 'Unmute' : 'Mute'} onPress={onToggleMute} />
        {showPause && <GameButton label="II" variant="icon" accessibilityLabel="Pause" onPress={onPause} style={{ marginLeft: 10 }} />}
      </View>
    </View>
  );
}

const shadow = { textShadowColor: '#000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 0 };

const styles = StyleSheet.create({
  left: { position: 'absolute' },
  hearts: { fontSize: 20, letterSpacing: 2 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  barIcon: { fontSize: 16, marginRight: 6 },
  barOuter: { width: 120, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#000', backgroundColor: 'rgba(0,0,0,0.5)', overflow: 'hidden' },
  barInner: { height: '100%', borderRadius: 5 },
  lowText: { marginTop: 4, color: colors.energyLow, fontWeight: '900', fontSize: 13, ...shadow },
  center: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  metres: { fontSize: 40, fontWeight: '900', color: colors.text, ...shadow },
  coins: { fontSize: 18, fontWeight: '800', color: '#FFD34D', ...shadow },
  right: { position: 'absolute', flexDirection: 'row' },
});
