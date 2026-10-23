/** Sound files shared by the native and web sound modules. */
export const SOURCES = {
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
export const AMBIENCE = require('../../assets/sounds/ambience.wav');

export type SoundName = keyof typeof SOURCES;

export const VOLUME: Partial<Record<SoundName, number>> = { whistle: 0.35, jump: 0.5, siren: 0.5, explosion: 0.9 };
export const AMBIENCE_VOLUME = 0.35;

export interface SoundApi {
  init(): void;
  play(name: SoundName): void;
  startAmbience(): void;
  stopAmbience(): void;
  setMuted(value: boolean): void;
  isMuted(): boolean;
}
