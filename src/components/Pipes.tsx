import { StyleSheet, View } from 'react-native';
import { PIPE_GAP, PIPE_WIDTH, PLAY_HEIGHT, type Pipe } from '../engine';
import { colors } from './theme';

const CAP_H = 26;
const CAP_OVERHANG = 5;

function PipePart({ left, top, height, capAtBottom, scale }: { left: number; top: number; height: number; capAtBottom: boolean; scale: number }) {
  if (height <= 0) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: left * scale, top: top * scale, width: PIPE_WIDTH * scale, height: height * scale }}>
      <View style={[styles.shaft, { left: 0, right: 0, top: 0, bottom: 0 }]}>
        <View style={[styles.shine, { width: 10 * scale, left: 10 * scale }]} />
      </View>
      <View style={[styles.cap, {
        height: CAP_H * scale, left: -CAP_OVERHANG * scale, right: -CAP_OVERHANG * scale,
        ...(capAtBottom ? { bottom: 0 } : { top: 0 }),
      }]} />
    </View>
  );
}

export function Pipes({ pipes, scale }: { pipes: Pipe[]; scale: number }) {
  return (
    <>
      {pipes.map((p) => {
        const left = p.x - PIPE_WIDTH / 2;
        const topH = p.gapY - PIPE_GAP / 2;
        const bottomY = p.gapY + PIPE_GAP / 2;
        return (
          <View key={p.id} pointerEvents="none">
            <PipePart left={left} top={0} height={topH} capAtBottom scale={scale} />
            <PipePart left={left} top={bottomY} height={PLAY_HEIGHT - bottomY} capAtBottom={false} scale={scale} />
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  shaft: { position: 'absolute', backgroundColor: colors.pipe, borderWidth: 2, borderColor: colors.pipeDark },
  shine: { position: 'absolute', top: 0, bottom: 0, backgroundColor: colors.pipeLight, opacity: 0.7 },
  cap: { position: 'absolute', backgroundColor: colors.pipe, borderWidth: 2, borderColor: colors.pipeDark, borderRadius: 3 },
});
