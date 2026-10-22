import AsyncStorage from '@react-native-async-storage/async-storage';

/** AsyncStorage maps to native storage on iOS/Android and localStorage on the web. */
const BEST = 'flappyBomber.best.v1';
const MUTED = 'flappyBomber.muted.v1';

async function get(key: string) {
  try { return await AsyncStorage.getItem(key); } catch { return null; }
}
async function set(key: string, value: string) {
  try { await AsyncStorage.setItem(key, value); } catch { /* ignore */ }
}

export const loadHighScore = async () => Number(await get(BEST)) || 0;
export const saveHighScore = (score: number) => set(BEST, String(score));
export const loadMuted = async () => (await get(MUTED)) === '1';
export const saveMuted = (muted: boolean) => set(MUTED, muted ? '1' : '0');
