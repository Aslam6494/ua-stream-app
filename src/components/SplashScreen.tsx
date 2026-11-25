import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { UaStreamLogo } from './UaStreamLogo';

const DEVELOPER_PHOTO_URL =
  'https://i.postimg.cc/J0h7zBWp/Gemini-Generated-Image-iygwjqiygwjqiygw.jpg';

interface SplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export function SplashScreen({ onComplete, durationMs = 10000 }: SplashScreenProps) {
  const [fadingOut, setFadingOut] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => Math.ceil(durationMs / 1000));
  const completedRef = useRef(false);

  const finishSplash = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setFadingOut(true);
    window.setTimeout(() => {
      onComplete();
    }, 380);
  }, [onComplete]);

  useEffect(() => {
    const startTime = Date.now();
    const fadeDelay = Math.max(0, durationMs - 380);

    const fadeTimer = window.setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        setFadingOut(true);
      }
    }, fadeDelay);

    const doneTimer = window.setTimeout(() => {
      onComplete();
    }, durationMs);

    const tickTimer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((durationMs - (Date.now() - startTime)) / 1000));
      setSecondsLeft(remaining);
    }, 250);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === 'Backspace' || e.keyCode === 10009) {
        e.preventDefault();
        finishSplash();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
      window.clearInterval(tickTimer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [durationMs, onComplete, finishSplash]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: fadingOut ? 0 : 1 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#090B0F] text-white px-6 py-8 sm:py-12 xl:px-14 xl:py-14 overflow-hidden select-none"
      role="status"
      aria-label="Loading UA Stream"
    >
      {/* Clean Obsidian & Crimson Atmospheric Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(225,29,72,0.18),transparent_58%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_88%,rgba(225,29,72,0.08),transparent_48%)]"
      />

      {/* Top Row with Optional Skip */}
      <div className="relative z-10 w-full max-w-7xl flex items-center justify-end min-h-[48px]">
        <button
          type="button"
          onClick={finishSplash}
          className="px-4 py-2.5 min-h-[44px] xl:min-h-[52px] xl:px-5 rounded-xl bg-white/[0.08] border border-white/15 text-xs xl:text-base font-medium text-slate-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500"
        >
          Skip · <span className="font-mono tabular-nums">{secondsLeft}s</span>
        </button>
      </div>

      {/* Center Brand Reveal */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.86, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          <UaStreamLogo size="lg" showWordmark={false} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 font-display text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-white"
        >
          UA <span className="text-rose-500">Stream</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.38 }}
          className="mt-2 text-xs sm:text-sm xl:text-lg tracking-[0.22em] uppercase text-slate-400"
        >
          Live Television
        </motion.p>

        {/* Smooth 10-Second Progress Sweep */}
        <div className="mt-8 w-52 sm:w-72 xl:w-96 h-1.5 xl:h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: durationMs / 1000, ease: 'linear' }}
            style={{ transformOrigin: 'left' }}
            className="h-full w-full bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400"
          />
        </div>
      </div>

      {/* Foreground Developer Identity Card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex items-center gap-4 xl:gap-5 px-4 py-3.5 sm:px-5 sm:py-4 xl:px-6 xl:py-5 rounded-2xl bg-[#121620]/90 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md max-w-lg"
      >
        <div className="relative shrink-0">
          <img
            src={DEVELOPER_PHOTO_URL}
            alt="Aslam Hossain"
            className="w-16 h-16 sm:w-20 sm:h-20 xl:w-24 xl:h-24 rounded-xl object-cover object-top border border-rose-500/45 shadow-md"
          />
        </div>

        <div className="min-w-0 text-left">
          <p className="font-mono text-[10px] sm:text-[11px] xl:text-xs font-semibold uppercase tracking-[0.18em] text-rose-400">
            Developed by
          </p>
          <p className="mt-0.5 font-display text-base sm:text-lg xl:text-2xl font-bold text-white truncate">
            Aslam Hossain
          </p>
          <p className="mt-0.5 font-mono text-[11px] sm:text-xs xl:text-base text-slate-300">
            (Bsc in CSE - GUB Batch 221)
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
