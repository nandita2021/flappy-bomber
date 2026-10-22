import { memo } from 'react';
import { View } from 'react-native';
import { PLAYER_HALF_HEIGHT } from '../engine';
import { colors } from './theme';

/**
 * The civilian survivor, built from plain Views so it renders identically on
 * web, iOS and Android. Limbs pivot at the hip/shoulder: each limb sits in a
 * square box centred on its joint, and rotating the box swings the limb.
 */
function Limb({ x, y, len, angle, thick, color, end, s }: {
  x: number; y: number; len: number; angle: number; thick: number; color: string; end?: string; s: number;
}) {
  return (
    <View style={{ position: 'absolute', left: (x - len) * s, top: (y - len) * s, width: len * 2 * s, height: len * 2 * s, transform: [{ rotate: `${angle}deg` }] }}>
      <View style={{ position: 'absolute', left: (len - thick / 2) * s, top: len * s, width: thick * s, height: len * s, backgroundColor: color, borderRadius: (thick / 2) * s }} />
      {end && <View style={{ position: 'absolute', left: (len - thick / 2) * s, top: (len * 2 - 4) * s, width: (thick + 5) * s, height: 5 * s, backgroundColor: end, borderRadius: 2 * s }} />}
    </View>
  );
}

interface Props {
  x: number;
  y: number;
  scale: number;
  runCycle: number;
  airborne: boolean;
  vy: number;
  time: number;
  blink: boolean;
  hurt: boolean;
  collapsed: boolean;
}

function SurvivorView({ x, y, scale: s, runCycle, airborne, vy, time, blink, hurt, collapsed }: Props) {
  const BOX = 70; // local canvas, centre at (35, 35)
  const c = BOX / 2;
  let legSwing = Math.sin(runCycle) * 38;
  let armSwing = -Math.sin(runCycle) * 42;
  let armBase = 0;
  let lean = 8 + Math.cos(runCycle * 2) * 2;
  let bob = Math.abs(Math.sin(runCycle)) * -3;
  if (airborne) {
    // Flailing "flying" pose: arms flap overhead, legs tuck and kick.
    const flap = Math.sin(time * 22) * 25;
    armBase = 150;
    armSwing = flap;
    legSwing = 25 + Math.sin(time * 9) * 10;
    lean = Math.max(-15, Math.min(25, vy / 30));
    bob = 0;
  }
  if (collapsed) { lean = 80; legSwing = 10; armSwing = 30; armBase = 20; bob = 6; }

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: (x - c) * s,
        top: (y + PLAYER_HALF_HEIGHT - BOX + 5 + bob) * s,
        width: BOX * s,
        height: BOX * s,
        opacity: blink ? 0.35 : 1,
        transform: [{ rotate: `${lean}deg` }],
      }}
    >
      {/* back limbs (darker) */}
      <Limb x={c} y={c + 8} len={18} angle={-legSwing} thick={7} color="#2F3946" end={colors.shoe} s={s} />
      <Limb x={c} y={c - 10} len={15} angle={armBase - armSwing} thick={6} color="#A87452" s={s} />
      {/* bag on the back */}
      <View style={{ position: 'absolute', left: (c - 15) * s, top: (c - 12) * s, width: 9 * s, height: 16 * s, backgroundColor: colors.bag, borderRadius: 3 * s }} />
      {/* torso: worn shirt with a patch and a torn hem */}
      <View style={{ position: 'absolute', left: (c - 8) * s, top: (c - 14) * s, width: 16 * s, height: 24 * s, backgroundColor: hurt ? '#E5484D' : colors.shirt, borderRadius: 4 * s }}>
        <View style={{ position: 'absolute', left: 8 * s, top: 6 * s, width: 6 * s, height: 6 * s, backgroundColor: colors.shirtPatch }} />
        <View style={{ position: 'absolute', left: 2 * s, bottom: -3 * s, width: 4 * s, height: 4 * s, backgroundColor: hurt ? '#E5484D' : colors.shirt, transform: [{ rotate: '45deg' }] }} />
        <View style={{ position: 'absolute', left: 10 * s, bottom: -3 * s, width: 4 * s, height: 4 * s, backgroundColor: hurt ? '#E5484D' : colors.shirt, transform: [{ rotate: '45deg' }] }} />
      </View>
      {/* head with a head-wrap */}
      <View style={{ position: 'absolute', left: (c - 7) * s, top: (c - 33) * s, width: 18 * s, height: 18 * s, borderRadius: 9 * s, backgroundColor: colors.skin }}>
        <View style={{ position: 'absolute', left: -1 * s, top: -2 * s, width: 20 * s, height: 8 * s, borderTopLeftRadius: 10 * s, borderTopRightRadius: 10 * s, backgroundColor: colors.hair }} />
        <View style={{ position: 'absolute', left: -6 * s, top: 1 * s, width: 7 * s, height: 3 * s, backgroundColor: colors.hair, transform: [{ rotate: `${Math.sin(time * 15) * 20}deg` }] }} />
        <View style={{ position: 'absolute', right: 3 * s, top: 8 * s, width: 3 * s, height: hurt ? 1 * s : 3 * s, borderRadius: 2 * s, backgroundColor: colors.ink }} />
      </View>
      {/* front limbs */}
      <Limb x={c} y={c + 8} len={18} angle={legSwing} thick={7} color={colors.pants} end={colors.shoe} s={s} />
      <View style={{ position: 'absolute', left: (c - 4) * s, top: (c + 4) * s, width: 9 * s, height: 8 * s, backgroundColor: colors.pants, borderRadius: 2 * s }}>
        <View style={{ position: 'absolute', left: 1 * s, top: 2 * s, width: 4 * s, height: 4 * s, backgroundColor: colors.pantsPatch }} />
      </View>
      <Limb x={c} y={c - 10} len={15} angle={armBase + armSwing} thick={6} color={colors.skin} s={s} />
    </View>
  );
}

export const Survivor = memo(SurvivorView);
