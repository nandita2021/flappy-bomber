import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GameButton } from './GameButton';

interface Props {
  muted: boolean;
  top: number;
  right: number;
  showPause: boolean;
  onPause: () => void;
  onToggleMute: () => void;
}

/**
 * The HUD's buttons. The hearts, strength bar and score are drawn in the game
 * canvas (render/drawHud.ts), so this only re-renders when a button changes.
 */
function HudButtons({ muted, top, right, showPause, onPause, onToggleMute }: Props) {
  return (
    <View pointerEvents="box-none" style={[styles.right, { top: top + 12, right: right + 12 }]}>
      <GameButton label={muted ? '🔇' : '🔊'} variant="icon" accessibilityLabel={muted ? 'Unmute' : 'Mute'} onPress={onToggleMute} />
      {showPause && <GameButton label="II" variant="icon" accessibilityLabel="Pause" onPress={onPause} style={{ marginLeft: 10 }} />}
    </View>
  );
}

export const Hud = memo(HudButtons);

const styles = StyleSheet.create({
  right: { position: 'absolute', flexDirection: 'row' },
});
