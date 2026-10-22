export const colors = {
  skyTop: '#1E1412',
  skyMid: '#4A2619',
  skyLow: '#9A4524',
  horizon: '#D9733A',
  sun: '#F09A5B',
  farRuins: '#3A2622',
  midRuins: '#211715',
  window: '#0E0908',
  windowLit: '#FFB347',
  fire: '#FF6A1A',
  fireCore: '#FFD34D',
  smoke: '#3A3532',
  ground: '#4A3B30',
  groundTop: '#6B5646',
  rubble: '#7D6A59',
  rubbleDark: '#3A2E26',
  crater: '#1C1512',
  bomb: '#3C3F2E',
  bombBand: '#B3261E',
  warning: '#FF3B30',
  skin: '#C98E64',
  hair: '#2B1D14',
  shirt: '#8C5A3C',
  shirtPatch: '#5F7A61',
  pants: '#3E4A5A',
  pantsPatch: '#7A6248',
  shoe: '#1E1A17',
  bag: '#6B4E2E',
  text: '#FFFFFF',
  ink: '#1A120F',
  panel: '#2A1F1B',
  panelBorder: '#D9733A',
  button: '#D9733A',
  energyHigh: '#7BD35A',
  energyMid: '#F2C14E',
  energyLow: '#E5484D',
};

/** Tiny deterministic PRNG for building the static city layers. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
