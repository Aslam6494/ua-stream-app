import { useCallback, useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import mpegts from 'mpegts.js';
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Moon,
  Pause,
  Play,
  Radio,
  Ratio,
  RefreshCw,
  SlidersHorizontal,
  Sun,
  Tv,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { getApiUrl, resolveChannelSourceUrl } from '../services/streamDirectory';
import type { StreamSource, ThemeMode, TvChannel } from '../types/tv';
import { UaStreamLogo } from './UaStreamLogo';

const MAX_AUTO_RETRIES = 3;
const AUTO_RETRY_DELAY_SEC = 3;

interface LivePlayerProps {
  channel: TvChannel | null;
  sourceIndex: number;
  onSelectSourceIndex: (index: number) => void;
  isPlaying: boolean;
  onPlayingChange: (playing: boolean) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  controlsVisible: boolean;
  onWakeControls: () => void;
  onToggleControls: () => void;
  dialBuffer: string;
  onPrevChannel: () => void;
  onNextChannel: () => void;
  onOpenDrawer: () => void;
  drawerOpen: boolean;
  onToggleRemote: () => void;
  remoteOpen: boolean;
  theme: ThemeMode;
  onToggleTheme: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isLoadingLineup: boolean;
  onStreamHealthy: () => void;
  onStartupStreamFailed: () => boolean;
  onChannelOffline?: (channelId: string) => boolean;
}

function resolvePlaybackUrl(rawUrl: string, useOptionalRelay: boolean): string {
  if (!useOptionalRelay) return rawUrl;
  const relayUrl = getApiUrl(`/api/proxy?url=${encodeURIComponent(rawUrl)}`);
  return relayUrl ?? rawUrl;
}

function isMpegTsSource(resolvedUrl: string, source: StreamSource): boolean {
  if (source.type === 'mpegts') return true;
  try {
    const parsed = new URL(resolvedUrl);
    const p = parsed.pathname.toLowerCase();
    const ext = parsed.searchParams.get('extension')?.toLowerCase();
    return p.endsWith('.ts') || p.endsWith('.mpegts') || ext === 'ts';
  } catch {
    return /\.ts(\?|$)/i.test(resolvedUrl);
  }
}

export function LivePlayer({
  channel,
  sourceIndex,
  onSelectSourceIndex,
  isPlaying,
  onPlayingChange,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  controlsVisible,
  onWakeControls,
  onToggleControls,
  dialBuffer,
  onPrevChannel,
  onNextChannel,
  onOpenDrawer,
  drawerOpen,
  onToggleRemote,
  remoteOpen,
  theme,
  onToggleTheme,
  isFullscreen,
  onToggleFullscreen,
  isLoadingLineup,
  onStreamHealthy,
  onStartupStreamFailed,
  onChannelOffline,
}: LivePlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const mpegtsRef = useRef<mpegts.Player | null>(null);

  const [isBuffering, setIsBuffering] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [autoplayMutedNotice, setAutoplayMutedNotice] = useState(false);
  const [gestureFeedback, setGestureFeedback] = useState<string | null>(null);
  const [fillScreen, setFillScreen] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
    startVol: number;
    mode: 'none' | 'horizontal' | 'vertical';
  }>({
    x: 0,
    y: 0,
    time: 0,
    startVol: volume,
    mode: 'none',
  });
  const lastTapRef = useRef<number>(0);
  const feedbackTimerRef = useRef<number | null>(null);

  const activeSource = channel?.sources[sourceIndex] ?? channel?.sources[0] ?? null;

  const showFeedback = useCallback((label: string) => {
    setGestureFeedback(label);
    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      setGestureFeedback(null);
    }, 1100);
  }, []);

  // Reset retry state when tuning to a different channel
  useEffect(() => {
    setAutoRetryCount(0);
    setRetryCountdown(null);
    setStreamError(null);
  }, [channel?.id]);

  // Auto-retry countdown timer when a stream fails
  useEffect(() => {
    if (!streamError || autoRetryCount >= MAX_AUTO_RETRIES) {
      setRetryCountdown(null);
      return;
    }

    setRetryCountdown(AUTO_RETRY_DELAY_SEC);
    const interval = window.setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          window.clearInterval(interval);
          setAutoRetryCount((c) => c + 1);
          setStreamError(null);
          onSelectSourceIndex(0);
          setRetryToken((n) => n + 1);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [streamError, autoRetryCount, onSelectSourceIndex]);

  // Sync volume & mute to <video>
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.max(0, Math.min(1, volume / 100));
    video.muted = isMuted;
  }, [volume, isMuted]);

  // Sync Play / Pause commands
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSource || activeSource.type === 'youtube') return;
    if (isPlaying && video.paused) {
      video.play().catch(() => {});
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [isPlaying, activeSource]);

  // Failover across mirrors, startup auto-advance, or enter error + auto-retry state
  const handleMirrorFailure = useCallback(
    (reason: string) => {
      if (!channel) return;
      const nextIdx = sourceIndex + 1;
      if (nextIdx < channel.sources.length) {
        onSelectSourceIndex(nextIdx);
        return;
      }
      if (onStartupStreamFailed()) {
        return;
      }
      if (onChannelOffline?.(channel.id)) {
        showFeedback(`Removed offline channel · ${channel.name}`);
        return;
      }
      setIsBuffering(false);
      setStreamError(reason);
    },
    [channel, sourceIndex, onSelectSourceIndex, onStartupStreamFailed, onChannelOffline, showFeedback],
  );

  // Attach hls.js for .m3u8 with native HLS fallback (plus mpegts.js for raw .ts)
  useEffect(() => {
    const video = videoRef.current;
    setStreamError(null);
    setAutoplayMutedNotice(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (mpegtsRef.current) {
      mpegtsRef.current.destroy();
      mpegtsRef.current = null;
    }

    if (!channel || !activeSource) {
      setIsBuffering(false);
      return;
    }

    if (activeSource.type === 'youtube') {
      setIsBuffering(false);
      onPlayingChange(true);
      onStreamHealthy();
      return;
    }

    if (!video) return;

    setIsBuffering(true);
    let cancelled = false;
    let cleanupNative: (() => void) | null = null;

    const attemptPlay = () => {
      if (cancelled || !video) return;
      video.volume = Math.max(0, Math.min(1, volume / 100));
      video.muted = isMuted;
      const playPromise = video.play();
      if (playPromise) {
        playPromise
          .then(() => {
            if (!cancelled) {
              setAutoRetryCount(0);
              setRetryCountdown(null);
              onPlayingChange(true);
              setIsBuffering(false);
              onStreamHealthy();
            }
          })
          .catch(() => {
            if (cancelled) return;
            video.muted = true;
            setAutoplayMutedNotice(true);
            video
              .play()
              .then(() => {
                if (!cancelled) {
                  setAutoRetryCount(0);
                  setRetryCountdown(null);
                  onPlayingChange(true);
                  setIsBuffering(false);
                  onStreamHealthy();
                }
              })
              .catch(() => {
                if (!cancelled) setIsBuffering(false);
              });
          });
      }
    };

    const startNativeHls = (streamUrl: string) => {
      if (cancelled || !video) return;
      if (!video.canPlayType('application/vnd.apple.mpegurl')) {
        handleMirrorFailure('HLS playback is not supported on this device.');
        return;
      }

      video.src = streamUrl;
      const onCanPlay = () => {
        if (!cancelled) attemptPlay();
      };
      const onError = () => {
        if (!cancelled) {
          handleMirrorFailure('Stream failed to load or is temporarily offline.');
        }
      };
      video.addEventListener('canplay', onCanPlay);
      video.addEventListener('error', onError);
      cleanupNative = () => {
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('error', onError);
        video.removeAttribute('src');
        video.load();
      };
    };

    const startMpegTs = (streamUrl: string) => {
      if (cancelled || !video) return;
      const targetUrl = resolvePlaybackUrl(streamUrl, true);
      if (!mpegts.isSupported()) {
        startNativeHls(targetUrl);
        return;
      }

      const player = mpegts.createPlayer(
        {
          type: 'mpegts',
          isLive: true,
          url: targetUrl,
        },
        {
          enableWorker: true,
          enableStashBuffer: false,
          stashInitialSize: 128,
          liveBufferLatencyChasing: true,
        },
      );
      mpegtsRef.current = player;

      player.attachMediaElement(video);
      player.load();
      attemptPlay();

      player.on(mpegts.Events.ERROR, () => {
        if (cancelled) return;
        if (mpegtsRef.current === player) {
          player.destroy();
          mpegtsRef.current = null;
        }
        handleMirrorFailure('Live transport stream did not respond or is temporarily offline.');
      });
    };

    const startHls = (streamUrl: string, viaRelay: boolean) => {
      if (cancelled || !video) return;
      const targetUrl = resolvePlaybackUrl(streamUrl, viaRelay);
      const canUseOptionalRelay = Boolean(getApiUrl('/api/proxy'));

      if (Hls.isSupported()) {
        let mediaRecoveries = 0;
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
          manifestLoadingTimeOut: 9000,
          manifestLoadingMaxRetry: 1,
          levelLoadingTimeOut: 9000,
          fragLoadingTimeOut: 11000,
        });
        hlsRef.current = hls;

        hls.loadSource(targetUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!cancelled) attemptPlay();
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (cancelled || !data.fatal) return;

          if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRecoveries < 1) {
            mediaRecoveries += 1;
            hls.recoverMediaError();
            return;
          }

          hls.destroy();
          if (hlsRef.current === hls) {
            hlsRef.current = null;
          }

          if (!viaRelay && canUseOptionalRelay && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            startHls(streamUrl, true);
            return;
          }

          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            startNativeHls(targetUrl);
            return;
          }

          handleMirrorFailure(
            channel.isGeoBlocked
              ? 'This channel is regionally restricted or temporarily offline.'
              : 'Broadcast feed did not respond or is temporarily offline.',
          );
        });
      } else {
        startNativeHls(targetUrl);
      }
    };

    const startStream = async () => {
      let resolvedUrl: string;
      try {
        resolvedUrl = await resolveChannelSourceUrl(activeSource);
      } catch (err) {
        if (!cancelled) {
          handleMirrorFailure(
            err instanceof Error ? err.message : 'Unable to authorize stream feed.',
          );
        }
        return;
      }

      if (cancelled) return;

      if (isMpegTsSource(resolvedUrl, activeSource)) {
        startMpegTs(resolvedUrl);
        return;
      }

      const canUseRelay = Boolean(getApiUrl('/api/proxy'));
      const preferRelay =
        canUseRelay &&
        (Boolean(activeSource.preferProxy) ||
          (window.location.protocol === 'https:' && resolvedUrl.startsWith('http://')));

      startHls(resolvedUrl, preferRelay);
    };

    void startStream();

    return () => {
      cancelled = true;
      if (cleanupNative) cleanupNative();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (mpegtsRef.current) {
        mpegtsRef.current.destroy();
        mpegtsRef.current = null;
      }
    };
  }, [channel, activeSource, retryToken, handleMirrorFailure]); // eslint-disable-line react-hooks/exhaustive-deps

  // Touch Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStartRef.current = {
      x: t.clientX,
      y: t.clientY,
      time: Date.now(),
      startVol: volume,
      mode: 'none',
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const start = touchStartRef.current;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;

    if (start.mode === 'none') {
      if (Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy)) {
        start.mode = 'horizontal';
      } else if (Math.abs(dy) > 18 && Math.abs(dy) > Math.abs(dx)) {
        const rect = e.currentTarget.getBoundingClientRect();
        if (t.clientX - rect.left > rect.width * 0.45) {
          start.mode = 'vertical';
        }
      }
    }

    if (start.mode === 'vertical') {
      const nextVol = Math.max(0, Math.min(100, Math.round(start.startVol - dy * 0.45)));
      onVolumeChange(nextVol);
      showFeedback(`Volume ${nextVol}%`);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const elapsed = Date.now() - start.time;

    if (start.mode === 'horizontal' && Math.abs(dx) > 52) {
      if (dx < 0) {
        showFeedback('Next Channel');
        onNextChannel();
      } else {
        showFeedback('Previous Channel');
        onPrevChannel();
      }
      return;
    }

    if (start.mode === 'none' && elapsed < 280 && Math.abs(dx) < 12) {
      const now = Date.now();
      if (now - lastTapRef.current < 280) {
        lastTapRef.current = 0;
        onToggleFullscreen();
      } else {
        lastTapRef.current = now;
        onToggleControls();
      }
    }
  };

  const handleUnmuteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) video.muted = false;
    if (isMuted) onToggleMute();
    setAutoplayMutedNotice(false);
    onWakeControls();
  };

  const handleManualRetry = () => {
    setAutoRetryCount(0);
    setRetryCountdown(null);
    setStreamError(null);
    onSelectSourceIndex(0);
    setRetryToken((n) => n + 1);
  };

  const formattedNumber = channel ? String(channel.number).padStart(3, '0') : '---';

  return (
    <div
      onClick={onToggleControls}
      className="relative w-full h-full bg-black overflow-hidden select-none"
    >
      {/* Full-Screen Broadcast Video */}
      {activeSource?.type === 'youtube' ? (
        <iframe
          key={`${channel?.id}-${activeSource.url}-${retryToken}`}
          src={activeSource.url}
          title={channel?.name || 'UA Stream Live TV'}
          className="w-full h-full border-0 bg-black"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          playsInline
          autoPlay
          className={`w-full h-full bg-black ${fillScreen ? 'object-cover' : 'object-contain'}`}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => {
            setIsBuffering(false);
            setStreamError(null);
            setAutoRetryCount(0);
            setRetryCountdown(null);
            onPlayingChange(true);
            onStreamHealthy();
          }}
          onPause={() => onPlayingChange(false)}
        />
      )}

      {/* Touch Gesture Surface */}
      {activeSource?.type !== 'youtube' && !streamError && (
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onToggleFullscreen();
          }}
          className="absolute inset-0 z-10 cursor-pointer"
          aria-label="Live broadcast surface"
        />
      )}

      {/* Wake Button when YouTube Embed is Active & Controls Hidden */}
      {activeSource?.type === 'youtube' && !controlsVisible && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onWakeControls();
          }}
          className="absolute bottom-8 right-8 xl:bottom-12 xl:right-12 z-20 px-4 py-2.5 min-h-[48px] xl:min-h-[56px] rounded-xl bg-black/80 border border-white/20 text-sm xl:text-base font-medium text-white backdrop-blur-md cursor-pointer focus-visible:ring-4 focus-visible:ring-rose-500"
        >
          Show Controls
        </button>
      )}

      {/* Buffering / Tuning Indicator */}
      {(isLoadingLineup || isBuffering) && !streamError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px] pointer-events-none">
          <div className="w-12 h-12 xl:w-16 xl:h-16 rounded-full border-3 border-white/20 border-t-rose-500 animate-spin" />
          <p className="mt-4 text-sm sm:text-base xl:text-2xl font-medium text-white/95">
            {isLoadingLineup ? 'Loading live channels…' : `Tuning ${channel?.name || 'stream'}…`}
          </p>
        </div>
      )}

      {/* Empty Fallback */}
      {!isLoadingLineup && !channel && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#090B0F] text-center px-8 xl:px-16">
          <Tv className="w-12 h-12 xl:w-16 xl:h-16 text-slate-500 mb-4" />
          <h2 className="font-display text-2xl xl:text-4xl font-semibold text-white">
            No Channels Available
          </h2>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDrawer();
            }}
            className="mt-6 px-6 py-3 min-h-[48px] xl:min-h-[56px] rounded-xl bg-rose-600 text-white text-sm xl:text-lg font-medium cursor-pointer focus-visible:ring-4 focus-visible:ring-white"
          >
            Open Channel Drawer
          </button>
        </div>
      )}

      {/* Stream Error & Auto-Retry Recovery Overlay */}
      {streamError && channel && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#090B0F]/95 px-8 xl:px-16 text-center"
        >
          <p className="font-mono text-sm xl:text-xl tabular-nums text-rose-400 mb-2">
            CH {formattedNumber}
          </p>
          <h3 className="font-display text-2xl sm:text-3xl xl:text-5xl font-bold text-white">
            {channel.name}
          </h3>
          <p className="mt-3 text-sm sm:text-base xl:text-xl text-slate-300 max-w-2xl">
            {streamError}
          </p>

          {retryCountdown !== null && autoRetryCount < MAX_AUTO_RETRIES && (
            <p className="mt-3 font-mono text-xs sm:text-sm xl:text-lg text-amber-300 tabular-nums">
              Auto-retrying in {retryCountdown}s (Attempt {autoRetryCount + 1}/{MAX_AUTO_RETRIES})…
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleManualRetry}
              className="inline-flex items-center gap-2.5 px-5 py-3 min-h-[48px] xl:min-h-[58px] xl:px-7 rounded-xl border-2 border-white/25 bg-white/10 text-sm xl:text-lg font-semibold text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Retry Now</span>
            </button>
            <button
              type="button"
              onClick={onNextChannel}
              className="inline-flex items-center gap-2.5 px-6 py-3 min-h-[48px] xl:min-h-[58px] xl:px-7 rounded-xl bg-rose-600 text-sm xl:text-lg font-semibold text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
            >
              <span>Next Channel</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Autoplay Unmute Prompt */}
      {autoplayMutedNotice && !streamError && (
        <button
          type="button"
          onClick={handleUnmuteClick}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 inline-flex items-center gap-3 px-6 py-3.5 min-h-[52px] xl:min-h-[64px] rounded-2xl bg-black/90 border-2 border-white/25 text-white text-sm xl:text-xl font-semibold backdrop-blur-md cursor-pointer shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500"
        >
          <VolumeX className="w-5 h-5 xl:w-6 xl:h-6 text-rose-400" />
          <span>Press OK or Tap to Unmute</span>
        </button>
      )}

      {/* Gesture HUD Feedback */}
      {gestureFeedback && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 px-5 py-3 rounded-xl bg-black/90 border border-white/20 text-white font-mono text-base xl:text-2xl tabular-nums backdrop-blur-md pointer-events-none">
          {gestureFeedback}
        </div>
      )}

      {/* Numeric Channel Dial HUD */}
      {dialBuffer && (
        <div className="absolute top-24 right-8 xl:top-28 xl:right-14 z-30 px-5 py-3 rounded-xl bg-black/90 border border-white/20 backdrop-blur-md pointer-events-none">
          <div className="text-xs xl:text-sm font-medium text-slate-400">Direct Dial</div>
          <div className="font-mono text-2xl xl:text-4xl font-bold tabular-nums text-white tracking-wider">
            CH {dialBuffer}
          </div>
        </div>
      )}

      {/* Top Auto-Hiding OSD Header Bar (1920x1080 TV Safe Margins) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute top-0 inset-x-0 z-20 p-4 sm:p-6 lg:p-10 xl:p-12 bg-gradient-to-b from-black/92 via-black/60 to-transparent transition-opacity duration-200 ${
          controlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 xl:gap-5 min-w-0">
            <UaStreamLogo size="sm" showWordmark={false} />
            {channel && (
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 xl:gap-3 text-xs sm:text-sm xl:text-lg text-slate-200/95">
                  <span className="font-mono font-bold tabular-nums text-rose-400">
                    CH {formattedNumber}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{channel.groupLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate hidden sm:inline">{channel.language}</span>
                  {isPlaying && !streamError && (
                    <>
                      <span aria-hidden="true" className="hidden sm:inline">
                        ·
                      </span>
                      <span className="hidden sm:inline-flex items-center gap-2 font-mono text-xs xl:text-base font-semibold text-white">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span>LIVE</span>
                      </span>
                    </>
                  )}
                </div>
                <h1 className="font-display text-lg sm:text-2xl xl:text-4xl font-bold text-white truncate">
                  {channel.name}
                </h1>
              </div>
            )}
          </div>

          {/* Top Action Buttons (Explicitly visible, no hover-only controls) */}
          <div className="flex items-center gap-2.5 xl:gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenDrawer}
              aria-pressed={drawerOpen}
              className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] xl:min-h-[56px] xl:px-5 rounded-xl border-2 text-xs sm:text-sm xl:text-lg font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500 ${
                drawerOpen
                  ? 'bg-rose-600 border-rose-400 text-white'
                  : 'bg-black/70 border-white/20 text-white backdrop-blur-md'
              }`}
            >
              <Radio className="w-4 h-4 xl:w-5 xl:h-5" />
              <span>Channels</span>
            </button>

            <button
              type="button"
              onClick={onToggleRemote}
              aria-pressed={remoteOpen}
              className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] xl:min-h-[56px] xl:px-5 rounded-xl border-2 text-xs sm:text-sm xl:text-lg font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500 ${
                remoteOpen
                  ? 'bg-rose-600 border-rose-400 text-white'
                  : 'bg-black/70 border-white/20 text-white backdrop-blur-md'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 xl:w-5 xl:h-5" />
              <span className="hidden sm:inline">Remote</span>
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="min-w-[44px] min-h-[44px] xl:min-w-[56px] xl:min-h-[56px] flex items-center justify-center rounded-xl border-2 border-white/20 bg-black/70 text-white backdrop-blur-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 xl:w-5 xl:h-5 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 xl:w-5 xl:h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Auto-Hiding Transport Bar (1920x1080 TV Safe Margins) */}
      {channel && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute bottom-0 inset-x-0 z-20 p-4 sm:p-6 lg:p-10 xl:p-12 bg-gradient-to-t from-black/94 via-black/65 to-transparent transition-opacity duration-200 ${
            controlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 xl:gap-5">
            {/* Left Transport */}
            <div className="flex items-center gap-2 xl:gap-3">
              <button
                type="button"
                onClick={onPrevChannel}
                aria-label="Previous Channel"
                className="min-w-[44px] min-h-[44px] xl:min-w-[56px] xl:min-h-[56px] flex items-center justify-center rounded-xl bg-white/15 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500"
              >
                <ChevronLeft className="w-5 h-5 xl:w-6 xl:h-6" />
              </button>

              {activeSource?.type !== 'youtube' && (
                <button
                  type="button"
                  onClick={() => onPlayingChange(!isPlaying)}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className="min-w-[44px] min-h-[44px] xl:min-w-[56px] xl:min-h-[56px] flex items-center justify-center rounded-xl bg-white/15 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 xl:w-6 xl:h-6" />
                  ) : (
                    <Play className="w-5 h-5 xl:w-6 xl:h-6" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onNextChannel}
                aria-label="Next Channel"
                className="min-w-[44px] min-h-[44px] xl:min-w-[56px] xl:min-h-[56px] flex items-center justify-center rounded-xl bg-white/15 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500"
              >
                <ChevronRight className="w-5 h-5 xl:w-6 xl:h-6" />
              </button>

              {activeSource?.type !== 'youtube' && (
                <div className="flex items-center gap-2.5 ml-1">
                  <button
                    type="button"
                    onClick={onToggleMute}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                    className="min-w-[44px] min-h-[44px] xl:min-w-[56px] xl:min-h-[56px] flex items-center justify-center rounded-xl bg-white/15 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 xl:w-6 xl:h-6 text-rose-400" />
                    ) : (
                      <Volume2 className="w-5 h-5 xl:w-6 xl:h-6" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onVolumeChange(Number(e.target.value))}
                    aria-label="Volume"
                    className="hidden sm:block w-24 xl:w-36 accent-rose-500 cursor-pointer"
                  />
                </div>
              )}

              <span className="hidden xl:inline-block ml-4 font-mono text-sm text-slate-300">
                ◀ Channels · ▲▼ Zap · ENTER Info · BACK Exit
              </span>
            </div>

            {/* Right Mirror, Aspect & Fullscreen */}
            <div className="flex items-center gap-2.5">
              {channel.sources.length > 1 && (
                <div className="flex items-center gap-1 p-1 rounded-xl bg-black/70 border border-white/20">
                  {channel.sources.map((src, idx) => (
                    <button
                      key={`${src.url}-${idx}`}
                      type="button"
                      onClick={() => {
                        setStreamError(null);
                        setAutoRetryCount(0);
                        onSelectSourceIndex(idx);
                      }}
                      className={`px-3 py-1.5 min-h-[36px] xl:min-h-[44px] xl:px-4 text-xs xl:text-base font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500 ${
                        sourceIndex === idx
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-200 bg-white/5'
                      }`}
                    >
                      {src.label}
                    </button>
                  ))}
                </div>
              )}

              {activeSource?.type !== 'youtube' && (
                <button
                  type="button"
                  onClick={() => setFillScreen((f) => !f)}
                  aria-label={fillScreen ? 'Fit video to screen' : 'Fill screen'}
                  className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] xl:min-h-[56px] xl:px-5 rounded-xl bg-white/15 text-xs xl:text-base font-medium text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500"
                >
                  <Ratio className="w-4 h-4 xl:w-5 xl:h-5" />
                  <span>{fillScreen ? 'Fill' : 'Fit'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onToggleFullscreen}
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                className="min-w-[44px] min-h-[44px] xl:min-w-[56px] xl:min-h-[56px] flex items-center justify-center rounded-xl bg-white/15 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500"
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5 xl:w-6 xl:h-6" />
                ) : (
                  <Maximize className="w-5 h-5 xl:w-6 xl:h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
