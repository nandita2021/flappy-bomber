import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

/**
 * One sound module for every platform: expo-audio uses native players on
 * iOS/Android and HTML audio on the web. Sounds that can overlap (explosions,
 * coins) get a small pool of players so a new hit never cuts off the last one.
 */
const SOURCES = {
  jump: require('../../assets/sounds/jump.wav'),
  food: require('../../assets/sounds/food.wav'),
  drink: require('../../assets/sounds/drink.wav'),
  coin: require('../../assets/sounds/coin.wav'),
  whistle: require('../../assets/sounds/whistle.wav'),
  explosion: require('../../assets/sounds/explosion.wav'),
  hurt: require('../../assets/sounds/hurt.wav'),
  warning: require('../../assets/sounds/warning.wav'),
  gameover: require('../../assets/sounds/gameover.wav'),
  siren: require('../../assets/sounds/siren.wav'),
} as const;

export type SoundName = keyof typeof SOURCES;

const POOL: Partial<Record<SoundName, number>> = { explosion: 3, whistle: 3, coin: 2, jump: 2, food: 2, drink: 2 };
const VOLUME: Partial<Record<SoundName, number>> = { whistle: 0.35, jump: 0.5, siren: 0.5, explosion: 0.9 };

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
  ambience = createAudioPlayer(require('../../assets/sounds/ambience.wav'));
  ambience.loop = true;
  ambience.volume = 0.35;
}

export const sound = {
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
