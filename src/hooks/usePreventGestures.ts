import { useEffect } from 'react';

/**
 * Prevents accidental browser gestures (pinch-to-zoom, pull-to-refresh)
 * on the referenced element. Only active on touch-primary devices.
 *
 * - Sets `touch-action: manipulation` on the element
 * - Adds `gesturestart` and `gesturechange` listeners that call preventDefault()
 *   (iOS Safari pinch-to-zoom prevention)
 * - Cleans up on unmount
 */
export function usePreventGestures(ref: React.RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Only apply on touch-primary devices
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (!isTouch) return;

    // Set touch-action via inline style
    el.style.touchAction = 'manipulation';

    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    // iOS Safari fires gesturestart/gesturechange for pinch-to-zoom
    el.addEventListener('gesturestart', preventGesture, { passive: false });
    el.addEventListener('gesturechange', preventGesture, { passive: false });

    return () => {
      el.removeEventListener('gesturestart', preventGesture);
      el.removeEventListener('gesturechange', preventGesture);
      el.style.touchAction = '';
    };
  }, [ref]);
}
