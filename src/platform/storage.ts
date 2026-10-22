import AsyncStorage from '@react-native-async-storage/async-storage';

/** AsyncStorage maps to native storage on iOS/Android and localStorage on the web. */
const KEY = 'flappy.highScore.v1';

export async function loadHighScore(): Promise<number> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v ? Number(v) || 0 : 0;
  } catch {
    return 0;
  }
}

export async function saveHighScore(score: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, String(score));
  } catch { /* ignore */ }
}
