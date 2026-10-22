import { Platform } from 'react-native';

/**
 * Browser-only polish: stop the page from scrolling, zooming, text-selecting or
 * pull-to-refreshing while the player taps and swipes. No-op on native.
 */
export function setupWebPage() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const s = document.body.style as CSSStyleDeclaration & Record<string, string>;
  s.overscrollBehavior = 'none';
  s.touchAction = 'none';
  s.userSelect = 'none';
  s.webkitUserSelect = 'none';
  s.webkitTouchCallout = 'none';
  s.webkitTapHighlightColor = 'transparent';
  s.overflow = 'hidden';
  document.documentElement.style.overscrollBehavior = 'none';
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('gesturestart', (e) => e.preventDefault());
}
