import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Native haptics on iOS/Android; short vibrations on supporting mobile browsers; silent elsewhere. */
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

const webVibrate = (ms: number | number[]) => {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(ms); } catch { /* ignore */ }
  }
};
const safe = (p: Promise<void>) => { p.catch(() => {}); };

export const haptics = {
  jump() { if (isNative) safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)); },
  dive() { if (isNative) safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)); else webVibrate(10); },
  pickup() { if (isNative) safe(Haptics.selectionAsync()); },
  explosion() { if (isNative) safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)); else webVibrate(25); },
  hurt() { if (isNative) safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)); else webVibrate([40, 30, 80]); },
  warning() { if (isNative) safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)); },
  over() { if (isNative) safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)); else webVibrate([60, 40, 120]); },
  button() { if (isNative) safe(Haptics.selectionAsync()); },
};
