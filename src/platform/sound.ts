import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { AMBIENCE, AMBIENCE_VOLUME, SOURCES, VOLUME, type SoundApi, type SoundName } from './soundSources';

export type { SoundName } from './soundSources';

/**
 * Native (iOS/Android) sound with expo-audio. The web uses sound.web.ts. Sounds that can overlap (explosions,
 * coins) get a small pool of players so a new hit never cuts off the last one.
 */

const POOL: Partial<Record<SoundName, number>> = { explosion: 3, whistle: 3, coin: 2, jump: 2, food: 2, drink: 2 };

let players: Partial<Record<SoundName, AudioPlayer[]>> = {};
let cursor: Partial<Record<SoundName, number>> = {};
let ambience: AudioPlayer | null = null;
let ready = false;
let muted = false;

function init() {
  if (ready) return;
  ready = true;
  setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  for (const name of Object.keys(SOURCES) as SoundName[]) {
    players[name] = Array.from({ length: POOL[name] ?? 1 }, () => {
      const p = createAudioPlayer(SOURCES[name]);
      p.volume = VOLUME[name] ?? 0.8;
      return p;
    });
  }
  ambience = createAudioPlayer(AMBIENCE);
  ambience.loop = true;
  ambience.volume = AMBIENCE_VOLUME;
}

export const sound: SoundApi = {
  /** Create players lazily on the first user gesture (browsers block audio before one). */
  init,
  play(name: SoundName) {
    if (muted) return;
    init();
    const pool = players[name];
    if (!pool?.length) return;
    const i = (cursor[name] ?? 0) % pool.length;
    cursor[name] = i + 1;
    const p = pool[i];
    try {
      p.seekTo(0).catch(() => {});
      p.play();
    } catch { /* a failed sound must never break the game */ }
  },
  startAmbience() {
    init();
    if (muted || !ambience) return;
    try { ambience.play(); } catch { /* ignore */ }
  },
  stopAmbience() {
    try { ambience?.pause(); } catch { /* ignore */ }
  },
  setMuted(value: boolean) {
    muted = value;
    if (value) sound.stopAmbience();
  },
  isMuted: () => muted,
};
