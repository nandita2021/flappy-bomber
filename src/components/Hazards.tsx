import { Text, View } from 'react-native';
import { BLAST_RADIUS, BLAST_TIME, GROUND_Y, bombImpactX, type Blast, type Bomb, type World } from '../engine';
import { colors } from './theme';

/** Falling bombs plus a blinking red target on the ground where each will land. */
export function Bombs({ world, scale: s }: { world: World; scale: number }) {
  return (
    <>
      {world.bombs.map((b: Bomb) => {
        const ix = bombImpactX(world, b);
        const danger = Math.min(1, Math.max(0, (b.y + 50) / (GROUND_Y + 50)));
        const blink = Math.sin(world.time * (10 + danger * 20)) > -0.2;
        const w = 40 + danger * 30;
        return (
          <View key={b.id} pointerEvents="none">
            {/* landing warning */}
            <View style={{ position: 'absolute', left: (ix - w / 2) * s, top: (GROUND_Y - 6) * s, width: w * s, height: 12 * s, borderRadius: (w / 2) * s, borderWidth: 2 * s, borderColor: colors.warning, backgroundColor: 'rgba(255,59,48,0.25)', opacity: blink ? 0.4 + danger * 0.6 : 0.15 }} />
            <Text style={{ position: 'absolute', left: (ix - 10) * s, top: (GROUND_Y - 34) * s, width: 20 * s, textAlign: 'center', fontSize: 20 * s, fontWeight: '900', color: colors.warning, opacity: blink ? danger : 0 }}>!</Text>
            {/* the bomb, nose down, wobbling as it falls */}
            <View style={{ position: 'absolute', left: (b.x - 10) * s, top: (b.y - 22) * s, width: 20 * s, height: 40 * s, transform: [{ rotate: `${Math.sin(world.time * 8 + b.wobble) * 6}deg` }] }}>
              <View style={{ position: 'absolute', left: 1 * s, top: 0, width: 18 * s, height: 8 * s, borderTopLeftRadius: 2 * s, borderTopRightRadius: 2 * s, backgroundColor: colors.bomb, transform: [{ scaleX: 1.3 }] }} />
              <View style={{ position: 'absolute', left: 3 * s, top: 6 * s, width: 14 * s, height: 30 * s, borderRadius: 7 * s, borderBottomLeftRadius: 9 * s, borderBottomRightRadius: 9 * s, backgroundColor: colors.bomb }} />
              <View style={{ position: 'absolute', left: 3 * s, top: 14 * s, width: 14 * s, height: 4 * s, backgroundColor: colors.bombBand }} />
              <View style={{ position: 'absolute', left: 6 * s, top: 20 * s, width: 3 * s, height: 10 * s, borderRadius: 2 * s, backgroundColor: 'rgba(255,255,255,0.18)' }} />
            </View>
          </View>
        );
      })}
    </>
  );
}

/** Fireball, shock ring and glow of each explosion. */
export function Blasts({ blasts, scale: s }: { blasts: Blast[]; scale: number }) {
  return (
    <>
      {blasts.map((bl) => {
        const t = bl.age / BLAST_TIME;
        const ring = BLAST_RADIUS * (0.4 + t * 1.3);
        const fire = BLAST_RADIUS * (0.35 + Math.sin(Math.min(1, t * 1.6) * Math.PI) * 0.65);
        const core = fire * 0.55;
        return (
          <View key={bl.id} pointerEvents="none">
            <View style={{ position: 'absolute', left: (bl.x - ring) * s, top: (bl.y - ring) * s, width: ring * 2 * s, height: ring * 2 * s, borderRadius: ring * s, borderWidth: 4 * s * (1 - t), borderColor: '#FFE9B0', opacity: 1 - t }} />
            <View style={{ position: 'absolute', left: (bl.x - fire) * s, top: (bl.y - fire * 1.1) * s, width: fire * 2 * s, height: fire * 2 * s, borderRadius: fire * s, backgroundColor: colors.fire, opacity: Math.max(0, 1 - t * 1.2) }} />
            <View style={{ position: 'absolute', left: (bl.x - core) * s, top: (bl.y - core * 1.4) * s, width: core * 2 * s, height: core * 2 * s, borderRadius: core * s, backgroundColor: colors.fireCore, opacity: Math.max(0, 1 - t * 1.6) }} />
          </View>
        );
      })}
    </>
  );
}
