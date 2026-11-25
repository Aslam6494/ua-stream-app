import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChannelDrawer } from './components/ChannelDrawer';
import { LivePlayer } from './components/LivePlayer';
import { SplashScreen } from './components/SplashScreen';
import { VirtualRemote } from './components/VirtualRemote';
import { fetchAllSourcesLineup, saveCachedChannels } from './services/streamDirectory';
import type { DrawerFilter, FocusZone, ThemeMode, TvChannel } from './types/tv';
import {
  exitTizenAppIfSupported,
  registerTizenRemoteKeys,
  TIZEN_KEYS,
} from './utils/tizenRemote';

const VOLUME_STORAGE_KEY = 'ua_stream_volume';
const THEME_STORAGE_KEY = 'ua_stream_theme';
const IDLE_HIDE_MS = 3000;

export default function App() {
  // 10-Second Splash Screen
  const [showSplash, setShowSplash] = useState(true);

  // Adaptive Dark & Light Theme
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Live Channel Lineup (with localStorage fallback)
  const [allChannels, setAllChannels] = useState<TvChannel[]>([]);
  const [isLoadingLineup, setIsLoadingLineup] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Slide-over Drawer Filter & Search (zero categories on home screen)
  const [drawerFilter, setDrawerFilter] = useState<DrawerFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Playback & 3-Second Auto-Hiding Controls
  const [activeChannel, setActiveChannel] = useState<TvChannel | null>(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(VOLUME_STORAGE_KEY);
      if (saved !== null) {
        const parsed = Number(saved);
        if (!Number.isNaN(parsed)) return Math.max(0, Math.min(100, parsed));
      }
    } catch {
      // ignore
    }
    return 85;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Slide-Over Drawer, Floating Remote & Spatial Focus
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [remoteOpen, setRemoteOpen] = useState(false);
  const [focusZone, setFocusZone] = useState<FocusZone>('stage');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [dialBuffer, setDialBuffer] = useState('');

  const appContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const dialTimerRef = useRef<number | null>(null);
  const startupAutoSkipsLeftRef = useRef<number>(8);

  // Sync theme to <html class="dark">
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Persist volume
  useEffect(() => {
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(volume));
    } catch {
      // ignore
    }
  }, [volume]);

  // Register Samsung Tizen OS Hardware Remote Keys
  useEffect(() => {
    return registerTizenRemoteKeys();
  }, []);

  // Fullscreen listener
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = appContainerRef.current ?? document.documentElement;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // Ignore fullscreen denial in restricted environments
    }
  }, []);

  // 3-Second Auto-Hide Timer Management
  const scheduleAutoHide = useCallback(() => {
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (!drawerOpen && !remoteOpen && isPlaying) {
      idleTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
      }, IDLE_HIDE_MS);
    }
  }, [drawerOpen, remoteOpen, isPlaying]);

  const wakeControls = useCallback(() => {
    setControlsVisible(true);
    scheduleAutoHide();
  }, [scheduleAutoHide]);

  const toggleControls = useCallback(() => {
    setControlsVisible((prev) => {
      const next = !prev;
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      if (next && !drawerOpen && !remoteOpen && isPlaying) {
        idleTimerRef.current = window.setTimeout(() => {
          setControlsVisible(false);
        }, IDLE_HIDE_MS);
      }
      return next;
    });
  }, [drawerOpen, remoteOpen, isPlaying]);

  useEffect(() => {
    if (drawerOpen || remoteOpen || !isPlaying) {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      setControlsVisible(true);
    } else if (controlsVisible) {
      scheduleAutoHide();
    }
  }, [drawerOpen, remoteOpen, isPlaying, controlsVisible, scheduleAutoHide]);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    wakeControls();
  }, [wakeControls]);

  // Load Channels from CHANNELS_URL (with localStorage fallback)
  const loadChannels = useCallback(async () => {
    setIsLoadingLineup(true);
    setLoadError(null);
    try {
      const channels = await fetchAllSourcesLineup();
      setAllChannels(channels);

      const firstBd =
        channels.find((c) => c.group === 'bangladesh') ?? channels[0] ?? null;
      if (firstBd) {
        setActiveChannel((prev) => prev ?? firstBd);
        setSourceIndex(0);
        setIsPlaying(true);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load live channels.');
    } finally {
      setIsLoadingLineup(false);
    }
  }, []);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  // Filtered channels inside slide-over drawer
  const visibleChannels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allChannels.filter((ch) => {
      if (drawerFilter !== 'all' && ch.group !== drawerFilter) return false;
      if (!q) return true;
      return (
        ch.name.toLowerCase().includes(q) ||
        ch.groupLabel.toLowerCase().includes(q) ||
        ch.countryName.toLowerCase().includes(q) ||
        ch.language.toLowerCase().includes(q) ||
        String(ch.number) === q
      );
    });
  }, [allChannels, drawerFilter, searchQuery]);

  useEffect(() => {
    if (visibleChannels.length === 0) setFocusedIndex(0);
    else if (focusedIndex >= visibleChannels.length) setFocusedIndex(0);
  }, [visibleChannels.length, focusedIndex]);

  // Tune a specific channel
  const tuneChannel = useCallback(
    (channel: TvChannel, listIndex?: number) => {
      setActiveChannel(channel);
      setSourceIndex(0);
      setIsPlaying(true);
      if (typeof listIndex === 'number') {
        setFocusedIndex(listIndex);
      } else {
        const idx = visibleChannels.findIndex((c) => c.id === channel.id);
        if (idx >= 0) setFocusedIndex(idx);
      }
      wakeControls();
    },
    [visibleChannels, wakeControls],
  );

  // Startup health check: auto-advance if the first startup stream is unresponsive
  const handleStreamHealthy = useCallback(() => {
    startupAutoSkipsLeftRef.current = 0;
  }, []);

  const handleStartupStreamFailed = useCallback((): boolean => {
    if (startupAutoSkipsLeftRef.current <= 0 || allChannels.length === 0) {
      return false;
    }
    startupAutoSkipsLeftRef.current -= 1;
    const currentIdx = activeChannel
      ? allChannels.findIndex((c) => c.id === activeChannel.id)
      : -1;
    const nextIdx = (currentIdx + 1) % allChannels.length;
    const nextCh = allChannels[nextIdx];
    if (nextCh && nextCh.id !== activeChannel?.id) {
      setActiveChannel(nextCh);
      setSourceIndex(0);
      return true;
    }
    return false;
  }, [allChannels, activeChannel]);

  const handleChannelOffline = useCallback(
    (offlineId: string): boolean => {
      const remaining = allChannels.filter((c) => c.id !== offlineId);
      if (remaining.length === 0) return false;

      const oldIdx = allChannels.findIndex((c) => c.id === offlineId);
      const renumbered = remaining.map((c, idx) => ({ ...c, number: idx + 1 }));
      setAllChannels(renumbered);
      saveCachedChannels(renumbered);

      if (activeChannel?.id === offlineId) {
        const nextIdx = oldIdx >= 0 ? oldIdx % renumbered.length : 0;
        setActiveChannel(renumbered[nextIdx]);
        setSourceIndex(0);
        setIsPlaying(true);
      }
      return true;
    },
    [allChannels, activeChannel],
  );

  // Channel Up / Down zapping
  const zapChannel = useCallback(
    (delta: 1 | -1) => {
      startupAutoSkipsLeftRef.current = 0;
      const pool = visibleChannels.length > 0 ? visibleChannels : allChannels;
      if (pool.length === 0) return;

      const currentIdx = activeChannel ? pool.findIndex((c) => c.id === activeChannel.id) : -1;
      const nextIdx =
        currentIdx === -1
          ? delta > 0
            ? 0
            : pool.length - 1
          : (currentIdx + delta + pool.length) % pool.length;

      tuneChannel(pool[nextIdx], nextIdx);
    },
    [visibleChannels, allChannels, activeChannel, tuneChannel],
  );

  const handleNextChannel = useCallback(() => zapChannel(1), [zapChannel]);
  const handlePrevChannel = useCallback(() => zapChannel(-1), [zapChannel]);

  // Volume & Mute
  const handleVolumeChange = useCallback(
    (nextVol: number) => {
      const clamped = Math.max(0, Math.min(100, nextVol));
      setVolume(clamped);
      if (clamped > 0) setIsMuted(false);
      wakeControls();
    },
    [wakeControls],
  );

  const handleVolumeStep = useCallback(
    (delta: number) => {
      setIsMuted(false);
      setVolume((prev) => Math.max(0, Math.min(100, prev + delta)));
      wakeControls();
    },
    [wakeControls],
  );

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    wakeControls();
  }, [wakeControls]);

  // Numeric Direct Dialing
  const commitDial = useCallback(
    (bufferOverride?: string) => {
      const code = bufferOverride ?? dialBuffer;
      if (dialTimerRef.current) {
        window.clearTimeout(dialTimerRef.current);
        dialTimerRef.current = null;
      }
      setDialBuffer('');
      if (!code) return;

      const num = parseInt(code, 10);
      if (Number.isNaN(num) || num <= 0) return;

      const target = allChannels.find((c) => c.number === num) ?? allChannels[num - 1];
      if (target) {
        startupAutoSkipsLeftRef.current = 0;
        tuneChannel(target);
      }
    },
    [dialBuffer, allChannels, tuneChannel],
  );

  const handleDigitPress = useCallback(
    (digit: string) => {
      wakeControls();
      setDialBuffer((prev) => {
        const next = (prev + digit).slice(0, 4);
        if (dialTimerRef.current) window.clearTimeout(dialTimerRef.current);
        dialTimerRef.current = window.setTimeout(() => commitDial(next), 1500);
        return next;
      });
    },
    [commitDial, wakeControls],
  );

  // Drawer Open/Close Helpers
  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
    setFocusZone('drawer');
    if (activeChannel) {
      const idx = visibleChannels.findIndex((c) => c.id === activeChannel.id);
      if (idx >= 0) setFocusedIndex(idx);
    }
    wakeControls();
  }, [activeChannel, visibleChannels, wakeControls]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setFocusZone('stage');
    wakeControls();
  }, [wakeControls]);

  // Back Action (Samsung Tizen Back 10009 / Escape / Backspace)
  const handleBackAction = useCallback(() => {
    if (dialBuffer) {
      setDialBuffer('');
      return;
    }
    if (remoteOpen) {
      setRemoteOpen(false);
      setFocusZone(drawerOpen ? 'drawer' : 'stage');
      return;
    }
    if (drawerOpen) {
      closeDrawer();
      return;
    }
    if (controlsVisible) {
      setControlsVisible(false);
      return;
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    exitTizenAppIfSupported();
  }, [dialBuffer, remoteOpen, drawerOpen, closeDrawer, controlsVisible]);

  // Spatial D-Pad Actions (Shared by Tizen Remote, Keyboard & Virtual Remote)
  const handleDpadUp = useCallback(() => {
    wakeControls();
    if (drawerOpen && focusZone === 'drawer' && visibleChannels.length > 0) {
      setFocusedIndex((prev) => (prev - 1 + visibleChannels.length) % visibleChannels.length);
    } else {
      handleNextChannel();
    }
  }, [wakeControls, drawerOpen, focusZone, visibleChannels.length, handleNextChannel]);

  const handleDpadDown = useCallback(() => {
    wakeControls();
    if (drawerOpen && focusZone === 'drawer' && visibleChannels.length > 0) {
      setFocusedIndex((prev) => (prev + 1) % visibleChannels.length);
    } else {
      handlePrevChannel();
    }
  }, [wakeControls, drawerOpen, focusZone, visibleChannels.length, handlePrevChannel]);

  const handleDpadLeft = useCallback(() => {
    wakeControls();
    if (!drawerOpen) {
      openDrawer();
    } else {
      handleVolumeStep(-5);
    }
  }, [wakeControls, drawerOpen, openDrawer, handleVolumeStep]);

  const handleDpadRight = useCallback(() => {
    wakeControls();
    if (drawerOpen) {
      closeDrawer();
    } else {
      handleVolumeStep(5);
    }
  }, [wakeControls, drawerOpen, closeDrawer, handleVolumeStep]);

  const handleDpadOk = useCallback(() => {
    wakeControls();
    if (dialBuffer) {
      commitDial();
      return;
    }
    if (drawerOpen && visibleChannels[focusedIndex]) {
      startupAutoSkipsLeftRef.current = 0;
      tuneChannel(visibleChannels[focusedIndex], focusedIndex);
      closeDrawer();
      return;
    }
    toggleControls();
  }, [
    wakeControls,
    dialBuffer,
    commitDial,
    drawerOpen,
    visibleChannels,
    focusedIndex,
    tuneChannel,
    closeDrawer,
    toggleControls,
  ]);

  // Unified Samsung Tizen OS & Hardware Keyboard Listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showSplash) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTextField = tag === 'input' || tag === 'textarea' || tag === 'select';
      const code = e.keyCode;

      if (
        code === TIZEN_KEYS.BACK ||
        e.key === 'Escape' ||
        (!isTextField && (e.key === 'Backspace' || code === 8))
      ) {
        e.preventDefault();
        if (isTextField && target) {
          target.blur();
          return;
        }
        handleBackAction();
        return;
      }

      if (isTextField) {
        if (e.key === 'Enter' && target && target === searchInputRef.current && visibleChannels[0]) {
          e.preventDefault();
          startupAutoSkipsLeftRef.current = 0;
          tuneChannel(visibleChannels[0], 0);
          target.blur();
          closeDrawer();
        }
        return;
      }

      if (/^[0-9]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleDigitPress(e.key);
        return;
      }

      if (code === TIZEN_KEYS.CHANNEL_UP || e.key === 'ChannelUp' || e.key === 'PageUp') {
        e.preventDefault();
        handleNextChannel();
        return;
      }
      if (code === TIZEN_KEYS.CHANNEL_DOWN || e.key === 'ChannelDown' || e.key === 'PageDown') {
        e.preventDefault();
        handlePrevChannel();
        return;
      }
      if (
        code === TIZEN_KEYS.PLAY_PAUSE ||
        code === TIZEN_KEYS.PLAY ||
        code === TIZEN_KEYS.PAUSE ||
        e.key === 'MediaPlayPause' ||
        e.key === ' ' ||
        e.key === 'k'
      ) {
        e.preventDefault();
        setIsPlaying((p) => !p);
        wakeControls();
        return;
      }
      if (code === TIZEN_KEYS.INFO || e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        toggleControls();
        return;
      }
      if (code === TIZEN_KEYS.COLOR_RED) {
        e.preventDefault();
        if (drawerOpen) closeDrawer();
        else openDrawer();
        return;
      }
      if (code === TIZEN_KEYS.COLOR_GREEN || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setRemoteOpen((o) => !o);
        return;
      }
      if (code === TIZEN_KEYS.COLOR_YELLOW) {
        e.preventDefault();
        toggleTheme();
        return;
      }
      if (code === TIZEN_KEYS.COLOR_BLUE || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        void toggleFullscreen();
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handleDpadUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleDpadDown();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleDpadLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleDpadRight();
          break;
        case 'Enter':
          e.preventDefault();
          handleDpadOk();
          break;
        case 'AudioVolumeUp':
        case '+':
        case '=':
          e.preventDefault();
          handleVolumeStep(5);
          break;
        case 'AudioVolumeDown':
        case '-':
          e.preventDefault();
          handleVolumeStep(-5);
          break;
        case 'AudioVolumeMute':
        case 'm':
        case 'M':
          e.preventDefault();
          handleToggleMute();
          break;
        case '/':
          e.preventDefault();
          openDrawer();
          window.setTimeout(() => searchInputRef.current?.focus(), 80);
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    showSplash,
    handleBackAction,
    visibleChannels,
    tuneChannel,
    closeDrawer,
    handleDigitPress,
    handleNextChannel,
    handlePrevChannel,
    wakeControls,
    toggleControls,
    drawerOpen,
    openDrawer,
    toggleTheme,
    toggleFullscreen,
    handleDpadUp,
    handleDpadDown,
    handleDpadLeft,
    handleDpadRight,
    handleDpadOk,
    handleVolumeStep,
    handleToggleMute,
  ]);

  return (
    <div
      ref={appContainerRef}
      className="fixed inset-0 w-screen h-screen bg-black text-white overflow-hidden"
    >
      <LivePlayer
        channel={showSplash ? null : activeChannel}
        sourceIndex={sourceIndex}
        onSelectSourceIndex={setSourceIndex}
        isPlaying={isPlaying}
        onPlayingChange={setIsPlaying}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        controlsVisible={controlsVisible}
        onWakeControls={wakeControls}
        onToggleControls={toggleControls}
        dialBuffer={dialBuffer}
        onPrevChannel={handlePrevChannel}
        onNextChannel={handleNextChannel}
        onOpenDrawer={() => (drawerOpen ? closeDrawer() : openDrawer())}
        drawerOpen={drawerOpen}
        onToggleRemote={() => setRemoteOpen((v) => !v)}
        remoteOpen={remoteOpen}
        theme={theme}
        onToggleTheme={toggleTheme}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => void toggleFullscreen()}
        isLoadingLineup={isLoadingLineup || showSplash}
        onStreamHealthy={handleStreamHealthy}
        onStartupStreamFailed={handleStartupStreamFailed}
        onChannelOffline={handleChannelOffline}
      />

      <ChannelDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        channels={visibleChannels}
        activeChannel={activeChannel}
        focusedIndex={focusedIndex}
        isFocusZoneActive={focusZone === 'drawer'}
        onSelectChannel={(ch, idx) => {
          startupAutoSkipsLeftRef.current = 0;
          tuneChannel(ch, idx);
          closeDrawer();
        }}
        drawerFilter={drawerFilter}
        onDrawerFilterChange={(f) => {
          setDrawerFilter(f);
          setFocusedIndex(0);
        }}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        isLoading={isLoadingLineup}
        error={loadError}
        onRetry={() => void loadChannels()}
        searchInputRef={searchInputRef}
      />

      <VirtualRemote
        isOpen={remoteOpen}
        onClose={() => setRemoteOpen(false)}
        focusZone={focusZone}
        isMuted={isMuted}
        volume={volume}
        dialBuffer={dialBuffer}
        onDpadUp={handleDpadUp}
        onDpadDown={handleDpadDown}
        onDpadLeft={handleDpadLeft}
        onDpadRight={handleDpadRight}
        onDpadOk={handleDpadOk}
        onBack={handleBackAction}
        onChannelUp={handleNextChannel}
        onChannelDown={handlePrevChannel}
        onVolumeUp={() => handleVolumeStep(5)}
        onVolumeDown={() => handleVolumeStep(-5)}
        onToggleMute={handleToggleMute}
        onToggleInfo={toggleControls}
        onToggleFullscreen={() => void toggleFullscreen()}
        onToggleDrawer={() => (drawerOpen ? closeDrawer() : openDrawer())}
        onDigitPress={handleDigitPress}
        onDialBackspace={() => setDialBuffer((p) => p.slice(0, -1))}
        onDialConfirm={() => commitDial()}
      />

      {showSplash && <SplashScreen durationMs={10000} onComplete={handleSplashComplete} />}
    </div>
  );
}
