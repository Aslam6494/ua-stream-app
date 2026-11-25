export type ThemeMode = 'dark' | 'light';

export type FocusZone = 'stage' | 'drawer' | 'remote';

export type ChannelGroup = 'bangladesh' | 'indian-bangla' | 'sports' | 'entertainment' | 'global';

export type DrawerFilter = 'all' | ChannelGroup;

export interface StreamSource {
  type: 'hls' | 'mpegts' | 'youtube' | 'token';
  url: string;
  label: string;
  isHttps: boolean;
  preferProxy?: boolean;
}

export interface TvChannel {
  id: string;
  number: number;
  name: string;
  countryCode: string;
  countryName: string;
  language: string;
  group: ChannelGroup;
  groupLabel: string;
  logo?: string;
  isGeoBlocked: boolean;
  sources: StreamSource[];
}

export interface RawChannelEntry {
  nanoid: string;
  name: string;
  sources?: {
    streams?: string[];
    youtube?: string[];
  };
  languages?: string[];
  country?: string;
  isGeoBlocked?: boolean;
}
