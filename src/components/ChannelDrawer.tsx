import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Search, Tv, X } from 'lucide-react';
import type { DrawerFilter, TvChannel } from '../types/tv';
import { UaStreamLogo } from './UaStreamLogo';

interface ChannelDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  channels: TvChannel[];
  activeChannel: TvChannel | null;
  focusedIndex: number;
  isFocusZoneActive: boolean;
  onSelectChannel: (channel: TvChannel, index: number) => void;
  drawerFilter: DrawerFilter;
  onDrawerFilterChange: (filter: DrawerFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

const DRAWER_TABS: Array<{ id: DrawerFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'bangladesh', label: 'Bangladesh' },
  { id: 'indian-bangla', label: 'Indian Bangla' },
  { id: 'sports', label: 'Sports' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'global', label: 'Global' },
];

function ChannelAvatar({ name, logo }: { name: string; logo?: string }) {
  const [failed, setFailed] = useState(false);

  if (!logo || failed) {
    return (
      <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200/70 dark:border-white/10 flex items-center justify-center shrink-0 font-display text-xs xl:text-base font-bold text-slate-600 dark:text-slate-300">
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200/70 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden p-1">
      <img
        src={logo}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

export function ChannelDrawer({
  isOpen,
  onClose,
  channels,
  activeChannel,
  focusedIndex,
  isFocusZoneActive,
  onSelectChannel,
  drawerFilter,
  onDrawerFilterChange,
  searchQuery,
  onSearchQueryChange,
  isLoading,
  error,
  onRetry,
  searchInputRef,
}: ChannelDrawerProps) {
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!isOpen || !isFocusZoneActive) return;
    const row = rowRefs.current[focusedIndex];
    if (row) {
      row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isOpen, focusedIndex, isFocusZoneActive]);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        aria-label="Channel Switcher Drawer"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 left-0 z-40 w-[88vw] max-w-[420px] xl:max-w-[540px] xl:py-6 xl:pl-6 flex flex-col border-r border-slate-200 dark:border-white/15 bg-white/95 dark:bg-[#0E1219]/96 backdrop-blur-xl shadow-2xl transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 xl:p-5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3">
          <UaStreamLogo size="sm" inverted />
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs xl:text-base tabular-nums text-slate-500 dark:text-slate-400">
              {channels.length} ch
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close channel drawer"
              className="min-w-[44px] min-h-[44px] xl:min-w-[52px] xl:min-h-[52px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500"
            >
              <X className="w-5 h-5 xl:w-6 xl:h-6" />
            </button>
          </div>
        </div>

        {/* Search & Group Filter Tabs */}
        <div className="p-4 xl:p-5 border-b border-slate-200/80 dark:border-white/10 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 xl:w-5 xl:h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search channels (/)"
              aria-label="Search channels"
              className="w-full min-h-[44px] xl:min-h-[54px] pl-10 xl:pl-12 pr-10 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#090B0F] text-sm xl:text-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange('')}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {DRAWER_TABS.map((tab) => {
              const active = drawerFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onDrawerFilterChange(tab.id)}
                  className={`px-3.5 py-2 min-h-[40px] xl:min-h-[48px] xl:px-4 text-xs xl:text-base font-medium rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500 ${
                    active
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Channel Rows */}
        <div className="flex-1 overflow-y-auto tv-scroll divide-y divide-slate-100 dark:divide-white/5">
          {error ? (
            <div className="p-6 text-center">
              <p className="text-sm xl:text-lg text-rose-600 dark:text-rose-400">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 inline-flex items-center gap-2 px-5 py-3 min-h-[44px] xl:min-h-[54px] rounded-xl bg-rose-600 text-white text-sm xl:text-base font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
              >
                <RefreshCw className="w-4 h-4 xl:w-5 xl:h-5" />
                <span>Retry</span>
              </button>
            </div>
          ) : isLoading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 9 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-[64px] xl:h-[76px] rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : channels.length === 0 ? (
            <div className="p-8 text-center">
              <Tv className="w-8 h-8 xl:w-12 xl:h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-sm xl:text-lg font-medium text-slate-800 dark:text-slate-200">
                No channels found
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchQueryChange('')}
                  className="mt-3 px-4 py-2 min-h-[44px] rounded-xl border border-slate-200 dark:border-white/15 text-xs xl:text-base font-medium text-slate-700 dark:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            channels.map((ch, idx) => {
              const isActive = activeChannel?.id === ch.id;
              const isFocused = isFocusZoneActive && focusedIndex === idx;

              return (
                <button
                  key={ch.id}
                  ref={(el) => {
                    rowRefs.current[idx] = el;
                  }}
                  type="button"
                  onClick={() => onSelectChannel(ch, idx)}
                  className={`w-full min-h-[64px] xl:min-h-[78px] px-4 xl:px-5 py-3 flex items-center gap-3.5 text-left transition-colors cursor-pointer focus-visible:outline-none ${
                    isFocused
                      ? 'bg-rose-600/20 dark:bg-rose-500/25 ring-4 ring-inset ring-rose-500 border-l-4 border-l-rose-500'
                      : isActive
                        ? 'bg-rose-50/90 dark:bg-rose-500/12 border-l-4 border-l-rose-500/60'
                        : 'bg-transparent'
                  }`}
                >
                  <span
                    className={`font-mono text-xs xl:text-base font-bold tabular-nums w-9 xl:w-12 shrink-0 ${
                      isFocused || isActive
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {String(ch.number).padStart(3, '0')}
                  </span>

                  <ChannelAvatar name={ch.name} logo={ch.logo} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        title={ch.name}
                        className={`text-sm xl:text-lg truncate ${
                          isFocused || isActive
                            ? 'font-bold text-slate-950 dark:text-white'
                            : 'font-medium text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {ch.name}
                      </span>
                      {isActive && (
                        <span className="font-mono text-[10px] xl:text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 shrink-0">
                          On Air
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs xl:text-sm text-slate-500 dark:text-slate-400 truncate">
                      <span className="truncate">{ch.groupLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{ch.language}</span>
                      {ch.sources.length > 1 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="shrink-0">{ch.sources.length} feeds</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
