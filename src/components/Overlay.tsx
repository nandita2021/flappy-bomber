import { Platform, StyleSheet, Text, View } from 'react-native';
import type { Phase } from '../engine';
import { GameButton } from './GameButton';
import { colors } from './theme';

interface Props {
  phase: Phase;
  score: number;
  best: number;
  isNewBest: boolean;
  canRestart: boolean;
  onPlay: () => void;
  onResume: () => void;
  onRestart: () => void;
}

const isWeb = Platform.OS === 'web';

function medal(score: number) {
  if (score >= 40) return { label: 'PLATINUM', color: '#E5E4E2' };
  if (score >= 30) return { label: 'GOLD', color: '#FFD700' };
  if (score >= 20) return { label: 'SILVER', color: '#C0C0C0' };
  if (score >= 10) return { label: 'BRONZE', color: '#CD7F32' };
  return null;
}

export function Overlay({ phase, score, best, isNewBest, canRestart, onPlay, onResume, onRestart }: Props) {
  if (phase === 'playing') return null;

  if (phase === 'ready') {
    return (
      <View style={styles.center} pointerEvents="box-none">
        <Text style={styles.title}>Flappy Wings</Text>
        <View style={styles.hintCard} pointerEvents="none">
          <Text style={styles.hint}>{isWeb ? 'Tap, click or press Space to flap' : 'Tap anywhere to flap'}</Text>
          <Text style={styles.hint}>{isWeb ? 'Swipe down or press ↓ to dive' : 'Swipe down to dive'}</Text>
          <Text style={styles.hint}>{isWeb ? 'P / Esc to pause' : 'Swipe up also flaps'}</Text>
        </View>
        <GameButton label="PLAY" onPress={onPlay} />
        {best > 0 && <Text style={styles.best}>Best: {best}</Text>}
      </View>
    );
  }

  if (phase === 'paused') {
    return (
      <View style={[styles.center, styles.dim]}>
        <Text style={styles.title}>Paused</Text>
        <GameButton label="RESUME" onPress={onResume} />
        <View style={{ height: 14 }} />
        <GameButton label="RESTART" variant="secondary" onPress={onRestart} />
      </View>
    );
  }

  const m = medal(score);
  return (
    <View style={styles.center} pointerEvents="box-none">
      <Text style={styles.title}>Game Over</Text>
      <View style={styles.panel}>
        <View style={[styles.medal, { backgroundColor: m?.color ?? '#E8DDB5' }]}>
          <Text style={styles.medalText}>{m?.label ?? '–'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.panelLabel}>SCORE</Text>
          <Text style={styles.panelValue}>{score}</Text>
          <Text style={styles.panelLabel}>BEST {isNewBest ? '★ NEW' : ''}</Text>
          <Text style={styles.panelValue}>{best}</Text>
        </View>
      </View>
      <View style={{ opacity: canRestart ? 1 : 0.5 }} pointerEvents={canRestart ? 'auto' : 'none'}>
        <GameButton label="PLAY AGAIN" onPress={onRestart} />
      </View>
      {isWeb && <Text style={styles.small}>or press Space</Text>}
    </View>
  );
}

const outline = { textShadowColor: colors.ink, textShadowOffset: { width: 2, height: 3 }, textShadowRadius: 0 };

const styles = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dim: { backgroundColor: 'rgba(0,0,0,0.35)' },
  title: { fontSize: 46, fontWeight: '900', color: colors.text, marginBottom: 24, ...outline },
  hintCard: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 18, marginBottom: 24, borderWidth: 2, borderColor: colors.ink },
  hint: { fontSize: 16, color: colors.ink, fontWeight: '600', textAlign: 'center', marginVertical: 2 },
  best: { marginTop: 18, fontSize: 20, fontWeight: '800', color: colors.text, ...outline },
  panel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: 280, backgroundColor: colors.panel, borderWidth: 3, borderColor: colors.panelBorder, borderRadius: 14, padding: 18, marginBottom: 24 },
  medal: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  medalText: { fontSize: 12, fontWeight: '900', color: colors.ink },
  panelLabel: { fontSize: 14, fontWeight: '800', color: colors.beak },
  panelValue: { fontSize: 30, fontWeight: '900', color: colors.ink, marginBottom: 4 },
  small: { marginTop: 10, color: colors.text, fontWeight: '700', ...outline },
});
