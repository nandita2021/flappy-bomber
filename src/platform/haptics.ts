import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Native haptics on iOS/Android; a short vibration on supporting mobile browsers; silent elsewhere. */
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

const webVibrate = (ms: number | number[]) => {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(ms); } catch { /* ignore */ }
  }
};

export const haptics = {
  flap() {
    if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  dive() {
    if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    else webVibrate(10);
  },
  score() {
    if (isNative) Haptics.selectionAsync().catch(() => {});
  },
  hit() {
    if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    else webVibrate([30, 40, 60]);
  },
  button() {
    if (isNative) Haptics.selectionAsync().catch(() => {});
  },
};
