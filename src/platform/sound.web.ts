import { Asset } from 'expo-asset';
import { AMBIENCE, AMBIENCE_VOLUME, SOURCES, VOLUME, type SoundApi, type SoundName } from './soundSources';

export type { SoundName } from './soundSources';

/**
 * Web sound via the Web Audio API: every effect is decoded once into memory and
 * played from a buffer. Starting a buffer is nearly free, unlike HTML <audio>
 * elements, which stutter on mobile Safari and Chrome for iOS when fired rapidly.
 * The context is created on the first tap, as browsers require.
 */
type Ctx = AudioContext;
let ctx: Ctx | null = null;
let master: GainNode | null = null;
const buffers = new Map<string, AudioBuffer>();
let ambienceNode: AudioBufferSourceNode | null = null;
let wantAmbience = false;
let muted = false;

const uriOf = (mod: number | string) => (typeof mod === 'string' ? mod : Asset.fromModule(mod).uri);

async function load(key: string, mod: number | string) {
  if (!ctx || buffers.has(key)) return;
  try {
    const res = await fetch(uriOf(mod));
    const data = await res.arrayBuffer();
    const buf = await new Promise<AudioBuffer>((resolve, reject) => ctx!.decodeAudioData(data, resolve, reject));
    buffers.set(key, buf);
    if (key === 'ambience' && wantAmbience) sound.startAmbience();
  } catch { /* a missing sound must never break the game */ }
}

function init() {
  if (typeof window === 'undefined') return;
  if (!ctx) {
    const AC: typeof AudioContext | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
    for (const [k, mod] of Object.entries(SOURCES)) load(k, mod);
    load('ambience', AMBIENCE);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}

function playBuffer(key: string, volume: number, loop = false) {
  if (!ctx || !master) return null;
  const buf = buffers.get(key);
  if (!buf) return null;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = loop;
  const g = ctx.createGain();
  g.gain.value = volume;
  src.connect(g).connect(master);
  src.start();
  return src;
}

export const sound: SoundApi = {
  init,
  play(name: SoundName) {
    if (muted) return;
    init();
    playBuffer(name, VOLUME[name] ?? 0.8);
  },
  startAmbience() {
    wantAmbience = true;
    init();
    if (muted || ambienceNode) return;
    ambienceNode = playBuffer('ambience', AMBIENCE_VOLUME, true);
  },
  stopAmbience() {
    wantAmbience = false;
    try { ambienceNode?.stop(); } catch { /* ignore */ }
    ambienceNode = null;
  },
  setMuted(value: boolean) {
    muted = value;
    if (value) {
      try { ambienceNode?.stop(); } catch { /* ignore */ }
      ambienceNode = null;
    }
  },
  isMuted: () => muted,
};
