import { Pressable, StyleSheet, Text, type PressableStateCallbackType, type ViewStyle } from 'react-native';
import { haptics } from '../platform/haptics';
import { colors } from './theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'icon';
  accessibilityLabel?: string;
  style?: ViewStyle;
}

type State = PressableStateCallbackType & { hovered?: boolean };

/** Native-feeling button: press-in scale, haptic tick, hover on web, generous hit area. */
export function GameButton({ label, onPress, variant = 'primary', accessibilityLabel, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={12}
      onPressIn={() => haptics.button()}
      onPress={onPress}
      style={(state) => {
        const { pressed, hovered } = state as State;
        return [
          styles.base,
          variant === 'icon' ? styles.icon : variant === 'secondary' ? styles.secondary : styles.primary,
          hovered && styles.hovered,
          pressed && styles.pressed,
          style,
        ];
      }}
    >
      <Text style={[styles.label, variant === 'icon' && styles.iconLabel, variant === 'secondary' && { color: colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.ink, borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 0, shadowOffset: { width: 0, height: 4 }, elevation: 4,
    cursor: 'pointer',
  } as ViewStyle,
  primary: { backgroundColor: colors.button, paddingVertical: 14, paddingHorizontal: 28, minWidth: 180 },
  secondary: { backgroundColor: colors.panel, paddingVertical: 12, paddingHorizontal: 24, minWidth: 180 },
  icon: { backgroundColor: colors.panel, width: 52, height: 52, borderRadius: 26 },
  hovered: { opacity: 0.92 },
  pressed: { transform: [{ scale: 0.94 }, { translateY: 3 }], shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  label: { color: colors.text, fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  iconLabel: { color: colors.ink, fontSize: 20 },
});
