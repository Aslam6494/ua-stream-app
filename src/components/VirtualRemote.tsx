import { useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Delete,
  Hash,
  Info,
  Maximize,
  Minus,
  Plus,
  Radio,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { FocusZone } from '../types/tv';

interface VirtualRemoteProps {
  isOpen: boolean;
  onClose: () => void;
  focusZone: FocusZone;
  isMuted: boolean;
  volume: number;
  dialBuffer: string;
  onDpadUp: () => void;
  onDpadDown: () => void;
  onDpadLeft: () => void;
  onDpadRight: () => void;
  onDpadOk: () => void;
  onBack: () => void;
  onChannelUp: () => void;
  onChannelDown: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onToggleMute: () => void;
  onToggleInfo: () => void;
  onToggleFullscreen: () => void;
  onToggleDrawer: () => void;
  onDigitPress: (digit: string) => void;
  onDialBackspace: () => void;
  onDialConfirm: () => void;
}

export function VirtualRemote({
  isOpen,
  onClose,
  focusZone,
  isMuted,
  volume,
  dialBuffer,
  onDpadUp,
  onDpadDown,
  onDpadLeft,
  onDpadRight,
  onDpadOk,
  onBack,
  onChannelUp,
  onChannelDown,
  onVolumeUp,
  onVolumeDown,
  onToggleMute,
  onToggleInfo,
  onToggleFullscreen,
  onToggleDrawer,
  onDigitPress,
  onDialBackspace,
  onDialConfirm,
}: VirtualRemoteProps) {
  const [showKeypad, setShowKeypad] = useState(false);

  if (!isOpen) return null;

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] lg:hidden"
        aria-hidden="true"
      />

      <aside
        aria-label="UA Stream Remote Control"
        className="fixed bottom-0 inset-x-0 lg:inset-auto lg:right-6 lg:bottom-20 z-50 lg:w-[300px] rounded-t-3xl lg:rounded-2xl border border-slate-200 dark:border-white/15 bg-white/95 dark:bg-[#10141C]/95 backdrop-blur-xl shadow-2xl p-4 sm:p-5 select-none"
      >
        {/* Mobile Grab Handle */}
        <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-3 lg:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              UA Remote
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {focusZone === 'drawer' ? 'Navigating Channels' : 'Controlling Live TV'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close remote"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Utility Strip */}
        <div className="grid grid-cols-4 gap-2 mt-3.5">
          <button
            type="button"
            onClick={onToggleDrawer}
            className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#090B0F] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 text-[11px] font-medium active:scale-95 transition-transform cursor-pointer"
          >
            <Radio className="w-4 h-4 text-rose-500" />
            <span>Channels</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl border text-[11px] font-medium active:scale-95 transition-transform cursor-pointer ${
              isMuted
                ? 'border-rose-500/50 bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400'
                : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#090B0F] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>Mute</span>
          </button>

          <button
            type="button"
            onClick={onToggleInfo}
            className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#090B0F] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 text-[11px] font-medium active:scale-95 transition-transform cursor-pointer"
          >
            <Info className="w-4 h-4" />
            <span>Info</span>
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#090B0F] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 text-[11px] font-medium active:scale-95 transition-transform cursor-pointer"
          >
            <Maximize className="w-4 h-4" />
            <span>Full</span>
          </button>
        </div>

        {/* Status & Keypad Switcher */}
        <div className="flex items-center justify-between mt-3.5 mb-2.5">
          <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {dialBuffer ? `CH ${dialBuffer}` : `VOL ${isMuted ? 0 : volume}%`}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 px-2.5 py-1 min-h-[34px] rounded-lg border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setShowKeypad((v) => !v)}
              className="inline-flex items-center gap-1 px-2.5 py-1 min-h-[34px] rounded-lg border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
            >
              <Hash className="w-3.5 h-3.5" />
              <span>{showKeypad ? 'D-Pad' : '0–9'}</span>
            </button>
          </div>
        </div>

        {/* 5-Way D-Pad or 0-9 Dial Pad */}
        {!showKeypad ? (
          <div className="mx-auto w-[188px] h-[188px] rounded-full border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-[#090B0F] p-2 grid grid-cols-3 grid-rows-3 gap-1.5 place-items-center">
            <div />
            <button
              type="button"
              onClick={onDpadUp}
              aria-label="Up"
              className="w-full h-full min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
            <div />

            <button
              type="button"
              onClick={onDpadLeft}
              aria-label="Left"
              className="w-full h-full min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={onDpadOk}
              aria-label="OK"
              className="w-full h-full min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full bg-rose-600 hover:bg-rose-500 text-white font-display text-xs font-bold tracking-wider active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              OK
            </button>

            <button
              type="button"
              onClick={onDpadRight}
              aria-label="Right"
              className="w-full h-full min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div />
            <button
              type="button"
              onClick={onDpadDown}
              aria-label="Down"
              className="w-full h-full min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <div />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {digits.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDigitPress(d)}
                className="min-h-[44px] rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#090B0F] hover:bg-slate-100 dark:hover:bg-white/10 font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-white active:scale-95 transition-transform cursor-pointer"
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={onDialBackspace}
              aria-label="Backspace"
              className="min-h-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#090B0F] hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 active:scale-95 transition-transform cursor-pointer"
            >
              <Delete className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDigitPress('0')}
              className="min-h-[44px] rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#090B0F] hover:bg-slate-100 dark:hover:bg-white/10 font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-white active:scale-95 transition-transform cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={onDialConfirm}
              className="min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white active:scale-95 transition-transform cursor-pointer"
            >
              Tune
            </button>
          </div>
        )}

        {/* VOL +/- & CH +/- Rockers */}
        <div className="grid grid-cols-2 gap-3 mt-3.5">
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#090B0F] p-1 flex flex-col items-center">
            <button
              type="button"
              onClick={onVolumeUp}
              aria-label="Volume Up"
              className="w-full min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 py-0.5">
              VOL
            </span>
            <button
              type="button"
              onClick={onVolumeDown}
              aria-label="Volume Down"
              className="w-full min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#090B0F] p-1 flex flex-col items-center">
            <button
              type="button"
              onClick={onChannelUp}
              aria-label="Channel Up"
              className="w-full min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 py-0.5">
              CH
            </span>
            <button
              type="button"
              onClick={onChannelDown}
              aria-label="Channel Down"
              className="w-full min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
