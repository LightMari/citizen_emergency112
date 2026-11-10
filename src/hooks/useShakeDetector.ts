import { useEffect, useRef, useCallback } from 'react';

/**
 * Detects a "shake" gesture using the DeviceMotion API.
 * Triggers `onShake` after `shakeCount` rapid shakes within `shakeWindow` ms.
 * Falls back gracefully on desktop (no-op).
 */
export function useShakeDetector(
  onShake: () => void,
  options?: {
    threshold?: number;      // acceleration threshold (m/s²), default 15
    shakeCount?: number;     // number of shakes required, default 3
    shakeWindow?: number;    // time window in ms, default 1500
    cooldown?: number;       // cooldown between triggers in ms, default 3000
    enabled?: boolean;
  }
) {
  const {
    threshold = 15,
    shakeCount = 3,
    shakeWindow = 1500,
    cooldown = 3000,
    enabled = true,
  } = options ?? {};

  const shakeTimes = useRef<number[]>([]);
  const lastTrigger = useRef<number>(0);
  const onShakeRef = useRef(onShake);
  onShakeRef.current = onShake;

  const handleMotion = useCallback(
    (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const x = acc.x ?? 0;
      const y = acc.y ?? 0;
      const z = acc.z ?? 0;

      // Calculate total acceleration magnitude minus gravity (~9.8)
      const totalAcc = Math.sqrt(x * x + y * y + z * z);
      const netAcc = Math.abs(totalAcc - 9.81);

      if (netAcc > threshold) {
        const now = Date.now();
        shakeTimes.current.push(now);

        // Keep only shakes within the window
        shakeTimes.current = shakeTimes.current.filter(
          (t) => now - t < shakeWindow
        );

        if (
          shakeTimes.current.length >= shakeCount &&
          now - lastTrigger.current > cooldown
        ) {
          lastTrigger.current = now;
          shakeTimes.current = [];
          onShakeRef.current();
        }
      }
    },
    [threshold, shakeCount, shakeWindow, cooldown]
  );

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;
    if (!('DeviceMotionEvent' in window)) return;

    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [handleMotion, enabled]);
}
