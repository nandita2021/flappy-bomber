import { Platform, StyleSheet, Text, View } from 'react-native';
import type { DeathCause, Phase } from '../engine';
import { GameButton } from './GameButton';
import { colors } from './theme';

interface Props {
  phase: Phase;
  metres: number;
  coins: number;
  score: number;
  best: number;
  isNewBest: boolean;
  cause: DeathCause;
  canRestart: boolean;
  onPlay: () => void;
  onResume: () => void;
  onRestart: () => void;
}

const isWeb = Platform.OS === 'web';

export function Overlay({ phase, metres, coins, score, best, isNewBest, cause, canRestart, onPlay, onResume, onRestart }: Props) {
  if (phase === 'playing') return null;

  if (phase === 'ready') {
    return (
      <View style={styles.center} pointerEvents="box-none">
        <Text style={styles.title}>FLAPPY BOMBER</Text>
        <Text style={styles.subtitle}>The city is under fire. Keep running.</Text>
        <View style={styles.card} pointerEvents="none">
          <Text style={styles.hint}>{isWeb ? 'Tap, click or Space to leap & fly' : 'Tap anywhere to leap & fly'}</Text>
          <Text style={styles.hint}>{isWeb ? 'Swipe down or ↓ to drop fast' : 'Swipe down to drop fast'}</Text>
          <Text style={styles.hint}>🍞 🥫 💧 🧃 refill your strength</Text>
          <Text style={styles.hint}>💵 money adds to your score</Text>
          <Text style={[styles.hint, { color: colors.warning }]}>💣 watch the red marks: bombs land there</Text>
        </View>
        <GameButton label="RUN" onPress={onPlay} />
        {best > 0 && <Text style={styles.best}>Best score: {best}</Text>}
      </View>
    );
  }

  if (phase === 'paused') {
    return (
      <View style={[styles.center, styles.dim]}>
        <Text style={styles.title}>PAUSED</Text>
        <GameButton label="RESUME" onPress={onResume} />
        <View style={{ height: 14 }} />
        <GameButton label="RESTART" variant="secondary" onPress={onRestart} />
        {isWeb && <Text style={styles.small}>P or Esc to resume</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.center, styles.dim]} pointerEvents="box-none">
      <Text style={styles.title}>YOU FELL</Text>
      <Text style={styles.subtitle}>{cause === 'hunger' ? 'You ran out of food and water.' : 'The bombs caught you.'}</Text>
      <View style={styles.panel}>
        <Row label="Distance" value={`${metres} m`} />
        <Row label="Money" value={`💵 ${coins}`} />
        <View style={styles.divider} />
        <Row label="Score" value={String(score)} big />
        <Row label={isNewBest ? 'Best ★ NEW' : 'Best'} value={String(best)} />
      </View>
      <View style={{ opacity: canRestart ? 1 : 0.5 }} pointerEvents={canRestart ? 'auto' : 'none'}>
        <GameButton label="RUN AGAIN" onPress={onRestart} />
      </View>
      {isWeb && <Text style={styles.small}>or press Space</Text>}
    </View>
  );
}

function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, big && { fontSize: 30, color: colors.fireCore }]}>{value}</Text>
    </View>
  );
}

const outline = { textShadowColor: '#000', textShadowOffset: { width: 2, height: 3 }, textShadowRadius: 0 };

const styles = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dim: { backgroundColor: 'rgba(10,6,5,0.55)' },
  title: { fontSize: 42, fontWeight: '900', color: colors.fireCore, letterSpacing: 2, textAlign: 'center', ...outline },
  subtitle: { fontSize: 16, color: colors.text, fontWeight: '700', marginTop: 6, marginBottom: 18, textAlign: 'center', ...outline },
  card: { backgroundColor: 'rgba(20,14,12,0.82)', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 18, marginBottom: 22, borderWidth: 2, borderColor: colors.panelBorder },
  hint: { fontSize: 15, color: colors.text, fontWeight: '600', textAlign: 'center', marginVertical: 3 },
  best: { marginTop: 16, fontSize: 18, fontWeight: '800', color: colors.text, ...outline },
  panel: { width: 270, backgroundColor: colors.panel, borderWidth: 3, borderColor: colors.panelBorder, borderRadius: 14, padding: 16, marginBottom: 22 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 3 },
  rowLabel: { fontSize: 15, fontWeight: '800', color: '#D8C7B8' },
  rowValue: { fontSize: 20, fontWeight: '900', color: colors.text },
  divider: { height: 2, backgroundColor: '#4A3B30', marginVertical: 8 },
  small: { marginTop: 10, color: colors.text, fontWeight: '700', ...outline },
});
