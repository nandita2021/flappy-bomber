import { useCallback, useReducer, useRef, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  WORLD_HEIGHT, createWorld, dive, finalScore, jump, metres, pause, resetWorld, resize, step, togglePause,
  type GameEvent, type World,
} from '../engine';
import { useAutoPause } from '../hooks/useAutoPause';
import { useGameLoop } from '../hooks/useGameLoop';
import { useHighScore } from '../hooks/useHighScore';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { useMuted } from '../hooks/useMuted';
import { useSwipeControls } from '../hooks/useSwipeControls';
import { haptics } from '../platform/haptics';
import { sound } from '../platform/sound';
import { GameCanvas } from '../render/GameCanvas';
import { drawHud } from '../render/drawHud';
import { drawScene } from '../render/drawScene';
import type { Painter } from '../render/Painter';
import { Hud } from './Hud';
import { Overlay } from './Overlay';

const RESTART_DELAY = 0.8;

/** The single game screen shared by web, iOS and Android. */
export function Game() {
  const insets = useSafeAreaInsets();
  const world = useRef<World>(createWorld(400)).current;
  const [, render] = useReducer((n: number) => (n + 1) % 1e9, 0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { best, submit } = useHighScore();
  const { muted, toggle: toggleMute } = useMuted();
  const bestAtStart = useRef(0);
  const overAt = useRef(0);

  const handleEvents = useCallback((events: GameEvent[]) => {
    for (const e of events) {
      switch (e) {
        case 'start': bestAtStart.current = best; sound.play('siren'); sound.startAmbience(); break;
        case 'jump': sound.play('jump'); haptics.jump(); break;
        case 'dive': haptics.dive(); break;
        case 'food': sound.play('food'); haptics.pickup(); break;
        case 'drink': sound.play('drink'); haptics.pickup(); break;
        case 'money': sound.play('coin'); haptics.pickup(); break;
        case 'bombDrop': sound.play('whistle'); break;
        case 'explosion': sound.play('explosion'); haptics.explosion(); break;
        case 'hurt': sound.play('hurt'); haptics.hurt(); break;
        case 'lowEnergy': sound.play('warning'); haptics.warning(); break;
        case 'over':
          sound.play('gameover');
          haptics.over();
          overAt.current = world.time;
          submit(finalScore(world));
          break;
      }
    }
  }, [best, submit, world]);

  const canRestart = world.phase === 'over' && world.time - overAt.current > RESTART_DELAY;

  const restart = useCallback(() => {
    resetWorld(world);
    handleEvents(jump(world));
  }, [handleEvents, world]);

  const onJump = useCallback(() => {
    sound.init();
    if (world.phase === 'over') {
      if (world.time - overAt.current > RESTART_DELAY) restart();
      return;
    }
    handleEvents(jump(world));
  }, [handleEvents, restart, world]);

  const onDive = useCallback(() => handleEvents(dive(world)), [handleEvents, world]);
  const onPause = useCallback(() => {
    const ev = togglePause(world);
    if (ev.includes('pause')) sound.stopAmbience();
    if (ev.includes('resume')) sound.startAmbience();
    handleEvents(ev);
    render();
  }, [handleEvents, world]);
  const onToggleMute = useCallback(() => {
    const nowMuted = toggleMute();
    if (!nowMuted && world.phase === 'playing') sound.startAmbience();
  }, [toggleMute, world]);

  useGameLoop((dt) => handleEvents(step(world, dt)), render);
  useKeyboardControls({ onFlap: onJump, onDive, onPause });
  useAutoPause(() => { pause(world); sound.stopAmbience(); render(); });
  const pan = useSwipeControls({ onTap: onJump, onSwipeUp: () => {}, onSwipeDown: onDive });

  const s = size.h / WORLD_HEIGHT;
  const insetsRef = useRef({ top: 0, left: 0, right: 0 });
  insetsRef.current = s > 0 ? { top: insets.top / s, left: insets.left / s, right: insets.right / s } : insetsRef.current;
  const drawFrame = useCallback((painter: Painter) => {
    drawScene(painter, world);
    drawHud(painter, world, insetsRef.current);
  }, [world]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
    resize(world, width / (height / WORLD_HEIGHT));
  };

  const viewW = world.width * s;
  const p = world.player;
  const score = finalScore(world);
  const isNewBest = world.phase === 'over' && score > 0 && score > bestAtStart.current;

  return (
    <View style={styles.root} onLayout={onLayout}>
      {size.h > 0 && (
        <View style={[styles.stage, { width: viewW, height: size.h }]}>
          <GameCanvas width={viewW} height={size.h} scale={s} draw={drawFrame} />
          <View style={StyleSheet.absoluteFill} {...pan.panHandlers} />

          {world.phase !== 'ready' && (
            <Hud muted={muted} top={insets.top} right={insets.right} showPause={world.phase === 'playing'} onPause={onPause} onToggleMute={onToggleMute} />
          )}

          <Overlay
            phase={world.phase}
            metres={metres(world)}
            coins={world.coins}
            score={score}
            best={Math.max(best, world.phase === 'over' ? score : 0)}
            isNewBest={isNewBest}
            cause={world.deathCause}
            canRestart={canRestart}
            onPlay={onJump}
            onResume={onPause}
            onRestart={restart}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E0908', alignItems: 'center', overflow: 'hidden' },
  stage: { backgroundColor: '#1E1412', overflow: 'hidden' },
});
