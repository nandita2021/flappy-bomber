/**
 * Every tuning value lives here so the game feels identical on web, Android and iOS.
 * Units are logical pixels and seconds; the renderer scales the world to the screen.
 */
export const WORLD_HEIGHT = 640;
export const MIN_WORLD_WIDTH = 280; // narrow enough that tall phones (e.g. 430x932) are not cropped
export const MAX_WORLD_WIDTH = 900;

export const GROUND_HEIGHT = 96;
export const GROUND_Y = WORLD_HEIGHT - GROUND_HEIGHT;
export const CEILING_Y = 40;

// The survivor
export const PLAYER_X_RATIO = 0.28;
export const PLAYER_HALF_HEIGHT = 30; // centre to feet
export const PLAYER_HIT_RADIUS = 20;
export const PLAYER_PICKUP_RADIUS = 38;
export const GRAVITY = 1750;
export const JUMP_VELOCITY = -560;
export const DIVE_VELOCITY = 700;
export const MAX_FALL_SPEED = 950;
export const MAX_HEARTS = 3;
export const INVULNERABLE_TIME = 1.6;

// Energy (hunger / thirst): drains over time, refilled by supplies
export const MAX_ENERGY = 100;
export const ENERGY_DRAIN = 5.5; // per second at the start
export const ENERGY_DRAIN_GROWTH = 0.035; // extra drain per second survived
export const MAX_ENERGY_DRAIN = 11;
export const LOW_ENERGY = 25;

// Scrolling
export const BASE_SPEED = 180;
export const SPEED_GROWTH = 2.2; // px/s gained per second survived
export const MAX_SPEED = 330;
export const PX_PER_METRE = 30;

// Supplies floating in the air (air-dropped aid)
export const SUPPLY_MIN_GAP = 170;
export const SUPPLY_MAX_GAP = 330;
export const SUPPLY_MIN_Y = CEILING_Y + 50;
export const SUPPLY_MAX_Y = GROUND_Y - 40;
export const SUPPLY_VALUES = {
  food: { energy: 30, coins: 0 },
  drink: { energy: 22, coins: 0 },
  money: { energy: 6, coins: 1 },
} as const;
export const COIN_SCORE = 10;

// Bombs
export const BOMB_RADIUS = 13;
export const BOMB_START_Y = -50;
export const BOMB_START_VY = 140;
export const BOMB_GRAVITY = 620;
export const BLAST_RADIUS = 78;
export const BLAST_TIME = 0.75;
export const BOMB_MIN_INTERVAL = 0.55;
export const BOMB_START_INTERVAL = 1.7;
export const BOMB_INTERVAL_SHRINK = 0.012; // seconds removed per second survived
export const FIRST_BOMB_DELAY = 1.6;

/** Physics runs at a fixed rate so it is frame-rate independent (60/90/120 Hz screens). */
export const FIXED_STEP = 1 / 120;
export const MAX_FRAME_DELTA = 0.1;
export const MAX_PARTICLES = 90;
