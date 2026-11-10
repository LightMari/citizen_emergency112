import React, { useState, useRef, useCallback, useEffect } from 'react';

interface SOSButtonProps {
  onActivate: () => void;
}

const LONG_PRESS_DURATION = 800;
const TAP_CONFIRM_TIMEOUT = 2000;
const PROGRESS_INTERVAL = 16;

const SOSButton: React.FC<SOSButtonProps> = ({ onActivate }) => {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tapConfirm, setTapConfirm] = useState(false);

  const pressStartRef = useRef<number>(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapConfirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activatedRef = useRef(false);

  const clearAllTimers = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimers();
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      if (tapConfirmTimerRef.current) clearTimeout(tapConfirmTimerRef.current);
    };
  }, [clearAllTimers]);

  const startPress = useCallback(() => {
    activatedRef.current = false;
    pressStartRef.current = Date.now();
    setIsLongPressing(true);
    setProgress(0);
    setShowTooltip(false);

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - pressStartRef.current;
      const pct = Math.min((elapsed / LONG_PRESS_DURATION) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    }, PROGRESS_INTERVAL);

    longPressTimerRef.current = setTimeout(() => {
      activatedRef.current = true;
      setIsLongPressing(false);
      setProgress(0);
      clearAllTimers();
      onActivate();
    }, LONG_PRESS_DURATION);
  }, [onActivate, clearAllTimers]);

  const endPress = useCallback(() => {
    if (activatedRef.current) return;

    clearAllTimers();
    const wasLongPressing = pressStartRef.current > 0;
    setIsLongPressing(false);
    setProgress(0);

    if (wasLongPressing && !activatedRef.current) {
      setShowTooltip(true);
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = setTimeout(() => {
        setShowTooltip(false);
      }, 1500);
    }

    pressStartRef.current = 0;
  }, [clearAllTimers]);

  const handleClick = useCallback(() => {
    if (activatedRef.current) return;

    if (tapConfirm) {
      setTapConfirm(false);
      if (tapConfirmTimerRef.current) {
        clearTimeout(tapConfirmTimerRef.current);
        tapConfirmTimerRef.current = null;
      }
      onActivate();
      return;
    }

    setTapConfirm(true);
    setShowTooltip(false);
    tapConfirmTimerRef.current = setTimeout(() => {
      setTapConfirm(false);
    }, TAP_CONFIRM_TIMEOUT);
  }, [tapConfirm, onActivate]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return;
      startPress();
    },
    [startPress]
  );

  const handleMouseUp = useCallback(() => {
    endPress();
  }, [endPress]);

  const handleMouseLeave = useCallback(() => {
    if (isLongPressing) {
      endPress();
    }
  }, [isLongPressing, endPress]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      e.preventDefault();
      startPress();
    },
    [startPress]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      e.preventDefault();
      endPress();
    },
    [endPress]
  );

  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-center gap-1.5">
      {/* Tooltip */}
      <div
        className={`
          bg-neutral-800 text-neutral-400 text-xs rounded-md px-2 py-1
          transition-opacity duration-150
          ${showTooltip ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        Hold for SOS
      </div>

      {/* Tap confirm label */}
      <div
        className={`
          text-rose-400 text-xs font-medium
          transition-opacity duration-150
          ${tapConfirm ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        Tap again to confirm
      </div>

      {/* Button container */}
      <div className="relative">
        {/* Pulse ring — behind the button */}
        <span
          className="absolute inset-0 rounded-full animate-[sos-ping_1.8s_cubic-bezier(0,0,0.2,1)_infinite] bg-rose-600/30"
          aria-hidden="true"
        />

        {/* Circular progress SVG */}
        <svg
          className={`
            absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)]
            -rotate-90 transition-opacity duration-100
            ${isLongPressing ? 'opacity-100' : 'opacity-0'}
          `}
          viewBox="0 0 64 64"
          aria-hidden="true"
        >
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="3"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-[16ms] linear"
          />
        </svg>

        {/* Main button */}
        <button
          role="button"
          aria-label="Emergency SOS - Hold to activate"
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`
            relative z-10
            w-14 h-14 md:w-16 md:h-16
            rounded-full
            bg-rose-600 hover:bg-rose-700 active:bg-rose-800
            text-white font-bold text-lg
            select-none
            cursor-pointer touch-action-none
            [touch-action:none]
            [@media(pointer:coarse)]:cursor-default
            transition-colors duration-100
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500
          `}
        >
          SOS
        </button>
      </div>

      {/* Mobile hint */}
      <span className="text-[10px] text-neutral-500 md:hidden select-none">
        Shake 3× for SOS
      </span>

      {/* Keyframes injected via style tag */}
      <style>{`
        @keyframes sos-ping {
          0% {
            transform: scale(1);
            opacity: 0.4;
          }
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SOSButton;
