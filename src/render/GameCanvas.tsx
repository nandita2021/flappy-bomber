// Type-only entry so TypeScript resolves `./GameCanvas`; Metro picks
// GameCanvas.web.tsx or GameCanvas.native.tsx at bundle time.
export { GameCanvas } from './GameCanvas.native';
