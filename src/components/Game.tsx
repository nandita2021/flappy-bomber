import { useCallback, useReducer, useRef, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  WORLD_HEIGHT, birdX, createWorld, dive, flap, pause, resetWorld, resize, step, togglePause,
  type GameEvent, type World,
} from '../engine';
import { useAutoPause } from '../hooks/useAutoPause';
import { useGameLoop } from '../hooks/useGameLoop';
import { useHighScore } from '../hooks/useHighScore';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { useSwipeControls } from '../hooks/useSwipeControls';
import { haptics } from '../platform/haptics';
import { Bird } from './Bird';
import { GameButton } from './GameButton';
import { Overlay } from './Overlay';
import { Pipes } from './Pipes';
import { Ground, Sky } from './Scenery';
import { colors } from './theme';

const RESTART_DELAY = 0.6;

/** The single game screen shared by web, iOS and Android. */
export function Game() {
  const insets = useSafeAreaInsets();
  const world = useRef<World>(createWorld(400)).current;
  const [, render] = useReducer((n: number) => (n + 1) % 1e9, 0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { best, submit } = useHighScore();
  const bestAtStart = useRef(0);
  const overAt = useRef(0);

  const handleEvents = useCallback((events: GameEvent[]) => {
    for (const e of events) {
      if (e === 'flap') haptics.flap();
      else if (e === 'dive') haptics.dive();
      else if (e === 'score') haptics.score();
      else if (e === 'hit') {
        haptics.hit();
        overAt.current = world.time;
        submit(world.score);
      } else if (e === 'start') bestAtStart.current = best;
    }
  }, [best, submit, world]);

  const canRestart = world.phase === 'over' && world.time - overAt.current > RESTART_DELAY;

  const restart = useCallback(() => {
    resetWorld(world);
    handleEvents(flap(world));
  }, [handleEvents, world]);

  const onFlap = useCallback(() => {
    if (world.phase === 'over') {
      if (world.time - overAt.current > RESTART_DELAY) restart();
      return;
    }
    handleEvents(flap(world));
  }, [handleEvents, restart, world]);

  const onDive = useCallback(() => handleEvents(dive(world)), [handleEvents, world]);
  const onPause = useCallback(() => { handleEvents(togglePause(world)); render(); }, [handleEvents, world]);

  useGameLoop((dt) => handleEvents(step(world, dt)), render);
  useKeyboardControls({ onFlap, onDive, onPause });
  useAutoPause(() => { pause(world); render(); });
  const pan = useSwipeControls({
    onTap: onFlap,
    onSwipeUp: () => {}, // the touch-down already flapped; a swipe up is just a flap
    onSwipeDown: onDive,
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
    resize(world, width / (height / WORLD_HEIGHT));
  };

  const scale = size.h / WORLD_HEIGHT;
  const viewW = world.width * scale;
  const wingUp = world.phase === 'ready' ? Math.sin(world.time * 14) > 0 : world.time - world.bird.flapTime < 0.12;
  const isNewBest = world.phase === 'over' && world.score > 0 && world.score > bestAtStart.current;

  return (
    <View style={styles.root} onLayout={onLayout}>
      {size.h > 0 && (
        <View style={[styles.stage, { width: viewW, height: size.h }]}>
          <View style={StyleSheet.absoluteFill} {...pan.panHandlers}>
            <Sky width={world.width} scale={scale} offset={world.time * 60} />
            <Pipes pipes={world.pipes} scale={scale} />
            <Ground width={world.width} scale={scale} offset={world.groundOffset} />
            <Bird x={birdX(world)} y={world.bird.y} rotation={world.bird.rotation} wingUp={wingUp} scale={scale} />
          </View>

          {world.phase === 'playing' && (
            <>
              <Text pointerEvents="none" style={[styles.score, { top: insets.top + 24 }]}>{world.score}</Text>
              <GameButton
                label="II"
                variant="icon"
                accessibilityLabel="Pause"
                onPress={onPause}
                style={{ position: 'absolute', top: insets.top + 16, right: insets.right + 16 }}
              />
            </>
          )}

          <Overlay
            phase={world.phase}
            score={world.score}
            best={Math.max(best, world.phase === 'over' ? world.score : 0)}
            isNewBest={isNewBest}
            canRestart={canRestart}
            onPlay={onFlap}
            onResume={onPause}
            onRestart={restart}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2B2B2B', alignItems: 'center', overflow: 'hidden' },
  stage: { backgroundColor: colors.sky, overflow: 'hidden' },
  score: {
    position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 64, fontWeight: '900', color: colors.text,
    textShadowColor: colors.ink, textShadowOffset: { width: 3, height: 4 }, textShadowRadius: 0,
  },
});
