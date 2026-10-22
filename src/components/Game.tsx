import { useCallback, useReducer, useRef, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  WORLD_HEIGHT, createWorld, dive, finalScore, isInvulnerable, jump, metres, pause, playerX, resetWorld, resize, step, togglePause,
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
import { City } from './City';
import { Ground } from './Ground';
import { Blasts, Bombs } from './Hazards';
import { Hud } from './Hud';
import { Overlay } from './Overlay';
import { Particles } from './Particles';
import { Supplies } from './Supplies';
import { Survivor } from './Survivor';

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

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
    resize(world, width / (height / WORLD_HEIGHT));
  };

  const s = size.h / WORLD_HEIGHT;
  const viewW = world.width * s;
  const p = world.player;
  const shakeX = Math.sin(world.time * 93) * world.shake * 9 * s;
  const shakeY = Math.cos(world.time * 71) * world.shake * 7 * s;
  const invuln = isInvulnerable(world);
  const blink = invuln && Math.sin(world.time * 30) > 0;
  const score = finalScore(world);
  const isNewBest = world.phase === 'over' && score > 0 && score > bestAtStart.current;

  return (
    <View style={styles.root} onLayout={onLayout}>
      {size.h > 0 && (
        <View style={[styles.stage, { width: viewW, height: size.h }]}>
          <View style={[StyleSheet.absoluteFill, { transform: [{ translateX: shakeX }, { translateY: shakeY }] }]} {...pan.panHandlers}>
            <City scale={s} scroll={world.scroll} time={world.time} planes={world.planes} width={world.width} />
            <Ground scale={s} scroll={world.scroll} craters={world.craters} />
            <Supplies supplies={world.supplies} time={world.time} scale={s} />
            <Bombs world={world} scale={s} />
            <Survivor
              x={playerX(world)} y={p.y} scale={s} runCycle={p.runCycle} airborne={!p.onGround} vy={p.vy} time={world.time}
              blink={blink} hurt={world.time - p.hurtTime < 0.25} collapsed={world.phase === 'over' && p.onGround}
            />
            <Blasts blasts={world.blasts} scale={s} />
            <Particles particles={world.particles} scale={s} />
          </View>
          {world.flash > 0 && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#FFB070', opacity: world.flash * 0.3 }]} />}
          {invuln && world.phase === 'playing' && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderWidth: 6, borderColor: 'rgba(229,72,77,0.6)' }]} />}

          {world.phase !== 'ready' && (
            <Hud
              hearts={p.hearts} energy={p.energy} metres={metres(world)} coins={world.coins} time={world.time} muted={muted}
              top={insets.top} left={insets.left} right={insets.right} onPause={onPause} onToggleMute={onToggleMute}
              showPause={world.phase === 'playing'}
            />
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
