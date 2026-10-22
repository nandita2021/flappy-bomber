/**
 * All tuning values live here so gameplay feels identical on web, Android and iOS.
 * Units are logical pixels and seconds; the renderer scales the world to the screen.
 */
export const WORLD_HEIGHT = 640;
export const MIN_WORLD_WIDTH = 360;
export const MAX_WORLD_WIDTH = 900;

export const GROUND_HEIGHT = 96;
export const PLAY_HEIGHT = WORLD_HEIGHT - GROUND_HEIGHT;

export const BIRD_RADIUS = 17;
export const BIRD_X_RATIO = 0.3;

export const GRAVITY = 1850;
export const FLAP_VELOCITY = -540;
export const DIVE_VELOCITY = 620;
export const MAX_FALL_SPEED = 900;

export const PIPE_WIDTH = 72;
export const PIPE_GAP = 172;
export const PIPE_MIN_MARGIN = 70;
export const PIPE_SPACING = 250;

export const BASE_SPEED = 165;
export const SPEED_PER_POINT = 3;
export const MAX_SPEED = 280;

/** Physics runs at a fixed rate so it is frame-rate independent (60/90/120 Hz screens). */
export const FIXED_STEP = 1 / 120;
export const MAX_FRAME_DELTA = 0.1;
