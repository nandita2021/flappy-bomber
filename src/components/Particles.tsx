import { Text, View } from 'react-native';
import type { Particle } from '../engine';

export function Particles({ particles, scale: s }: { particles: Particle[]; scale: number }) {
  return (
    <>
      {particles.map((p) => {
        const t = p.age / p.life;
        if (p.kind === 'pickup') {
          return (
            <Text key={p.id} pointerEvents="none" style={{ position: 'absolute', left: (p.x - 30) * s, top: (p.y - 12) * s, width: 60 * s, textAlign: 'center', fontSize: p.size * s, fontWeight: '900', color: p.color, opacity: 1 - t, textShadowColor: '#000', textShadowRadius: 3, textShadowOffset: { width: 1, height: 1 } }}>
              {p.text}
            </Text>
          );
        }
        const size = p.size;
        return (
          <View
            key={p.id}
            pointerEvents="none"
            style={{
              position: 'absolute', left: (p.x - size / 2) * s, top: (p.y - size / 2) * s, width: size * s, height: size * s,
              borderRadius: p.kind === 'debris' ? 1.5 * s : (size / 2) * s,
              backgroundColor: p.color,
              opacity: p.kind === 'smoke' ? 0.6 * (1 - t) : 1 - t * t,
              transform: p.kind === 'debris' ? [{ rotate: `${p.age * 720 + p.id * 37}deg` }] : undefined,
            }}
          />
        );
      })}
    </>
  );
}
