import type { ChannelGroup, RawChannelEntry, StreamSource, TvChannel } from '../types/tv';

/**
 * Optional backend API base URL (e.g. 'https://your-relay.example.com').
 * Leave empty '' for pure static / Samsung Tizen TV mode with zero server dependency.
 */
export const API_BASE_URL = '';

/**
 * Primary channels source URL (supports HTTPS JSON or M3U/M3U8 playlist).
 */
export const CHANNELS_URL =
  'https://raw.githubusercontent.com/famelack/famelack-data/main/tv/countries/bd.json';

const CHANNELS_CACHE_KEY = 'ua_stream_cached_channels_v2';

const CHITRABANI_M3U_URL = 'https://tv.chitrabani24.com/trail.m3u';

const RANGDHONU_WORKER_BASES = [
  'https://live.rangdhonu.live',
  'https://live.indiansserials.com',
];
const RANGDHONU_CATALOG_URL = `${RANGDHONU_WORKER_BASES[1]}/channels`;
const RANGDHONU_SONYLIV_URL =
  'https://raw.githubusercontent.com/sayanpal514-hue/SONYLIV-AUTO-UPDATED-PLAYLIST/main/sonyliv.json';
const RANGDHONU_FANCODE_URL =
  'https://rangdhonutv.tasinazadkafi99.workers.dev/fancode-api';

const RANGDHONU_CHANNEL_NAMES: Record<string, string> = {
  ch1: 'BTV',
  ch2: 'BTV News',
  ch3: 'BTV Chattogram',
  ch4: 'Sangsad Television',
  ch5: 'NTV',
  ch6: 'Jamuna TV',
  ch7: 'Star News',
  ch8: 'Rangdhonu TV',
  ch9: 'Channel 1',
  ch10: 'Channel 24 HD',
  ch11: 'Ekattor TV',
  ch12: 'Independent TV',
  ch13: 'ATN News',
  ch14: 'Ekhon TV',
  ch15: 'Boishakhi TV',
  ch16: 'Channel 9',
  ch17: 'Bangla Vision',
  ch18: 'SA TV',
  ch19: 'Deepto TV',
  ch20: 'DBC News',
  ch21: 'Ananda TV',
  ch22: 'News 24',
  ch23: 'Maasranga TV',
  ch24: 'Channel I',
  ch25: 'Somoy TV',
  ch26: 'ATN Bangla TV',
  ch27: 'My Tv',
  ch28: 'Mohona Tv',
  ch29: 'Nagorik Tv',
  ch30: 'Bijoy Tv',
  ch31: 'Bangla Tv',
  ch32: 'Asian Tv',
  ch33: 'G TV',
  ch34: 'Movie Bangla',
  ch35: 'R TV',
  ch36: 'Desh TV',
  ch37: 'Ruposhi Bangla',
  ch38: 'Channel S',
  ch39: 'Ekushe TV',
  ch40: 'Global TV',
  ch41: 'Nexus TV',
  ch42: 'Green TV',
  ch43: 'T Sports',
  ch44: 'Eurosport HD',
  ch45: 'Sky Sport',
  ch46: 'Bein Sports',
  ch47: 'A Sports',
  ch48: 'Star Sports 3',
  ch49: 'Willow TV',
  ch50: 'Star Sports 1',
  ch51: 'Star Sports 2',
  ch52: 'Star Sports SL 1',
  ch53: 'Star Sports SL 2',
  ch54: 'Unite8 Sports 1 HD',
  ch55: 'Unite8 Server 2',
  ch56: 'PTV Sports',
  ch57: 'Sony Sports TEN 1',
  ch58: 'Sony Sports TEN 2',
  ch59: 'Sony Sports TEN 3',
  ch60: 'Sony Sports TEN 4',
  ch61: 'Sony Sports TEN 5',
  ch62: 'Ten Cricket',
  ch63: 'Zee Bangla',
  ch64: 'Zee Bangla 2',
  ch65: 'Star Jalsha',
  ch66: 'Star Jalsha 2',
  ch67: 'Jalsha Movies HD',
  ch68: 'Star Plus',
  ch69: 'COLORS BANGLA',
  ch70: 'Dangal TV',
  ch71: 'COLORS HD',
  ch72: 'COLORS TAMIL',
  ch73: 'SONY AATH',
  ch74: 'Zee Cinema HD',
  ch75: 'Colors Bangla Cinema',
  ch76: 'Enter 10 Bangla',
  ch77: 'Z Bangla Sonar',
  ch78: 'Sony Max',
  ch79: 'Sun Bangla',
  ch80: 'COLORS CINEPLEX',
  ch81: 'Jalsha Movies',
  ch82: '& TV',
  ch83: 'PictureTv',
  ch84: 'Zee Tv',
  ch85: 'ZB Cartoon TV',
  ch86: 'Sangeet Bangla',
  ch87: 'Sangeet Bhojpuri',
  ch88: '9XM Music',
  ch89: 'ZOOM Music',
  ch90: 'Music Mastii',
  ch91: 'Goldmines SD',
  ch92: 'Star Movies',
  ch93: 'Duronto TV',
  ch94: 'POGO',
  ch95: 'Discovery Kids',
  ch96: 'Cartoon Network',
  ch97: 'Nick',
  ch98: 'HungamaTV',
  ch99: 'Sony Sab HD',
  ch100: 'Sony YaY',
  ch101: 'Sony BBC Earth',
  ch102: 'Sony BBC Earth HINDI',
  ch103: 'Sony Max 2',
  ch104: 'Sony Pix',
  ch105: 'Discovery HD',
  ch106: 'Discovery Bangla',
  ch107: 'National Geographic',
  ch108: 'Sony Television',
  ch109: 'Sony Max HD',
  ch110: 'Sony Television HD',
  ch111: 'B4U Movie',
  ch112: 'HUM TV',
  ch113: 'HUM Sitaray',
  ch114: 'Animal Planet',
  ch115: 'Animal Planet HD',
  ch116: 'B4U Music',
  ch117: 'Zee Bollywood',
  ch118: 'Star Gold HD',
  ch119: 'Makkah Live',
  ch120: 'Sony Pal',
  ch121: 'Sony Wah',
  ch122: 'Sony Marathi',
  ch123: 'Sonic Bangla',
  ch124: 'Bein Sports 2',
  ch125: 'Bein Sports 3',
  ch126: 'Akash Aath',
  ch127: 'Star Gold 2',
  ch128: 'Star Movies Select HD',
  ch129: 'History TV 18 HD',
  ch130: 'Nat Geo Wild',
  ch131: 'Xplor HD',
  ch132: 'Travelxp',
  ch133: 'Premier Sports',
  ch134: 'Star Bharat',
  ch135: 'BBC Earth',
  ch136: 'Rangdhonu Sports',
  ch137: 'Makkah TV',
  ch138: 'VisionHDTV',
  ch139: 'Star Gold Select',
  ch140: 'Star Gold HD',
};

const VERIFIED_MIRRORS: Record<string, StreamSource[]> = {
  zeebangla: [
    {
      type: 'hls',
      url: 'https://d1rc86nwwc9fag.cloudfront.net/260723/smil:zeebangla.smil/chunklist_b2628000.m3u8',
      label: 'Cloud HD',
      isHttps: true,
    },
    {
      type: 'hls',
      url: 'https://raw.githubusercontent.com/amazeyourself/adaptive-streams/refs/heads/main/streams/in/YuppTV/ZeeBanglaHD.m3u8',
      label: 'Adaptive HD',
      isHttps: true,
    },
  ],
  jalshamovies: [
    {
      type: 'hls',
      url: 'https://box.bbaria.net:8083/Jalsha_Movie/tracks-v1a1/mono.m3u8',
      label: 'HLS HD',
      isHttps: true,
    },
  ],
  sonyaath: [
    {
      type: 'hls',
      url: 'http://27.124.71.27/Sony_Aath/index.m3u8',
      label: 'Relay HD',
      isHttps: false,
      preferProxy: true,
    },
  ],
  sonyyay: [
    {
      type: 'hls',
      url: 'https://r2.amml.in/sony-yay/live.m3u8',
      label: 'HLS HD',
      isHttps: true,
    },
  ],
  cartoonnetworkus: [
    {
      type: 'hls',
      url: 'https://vodzong.mjunoon.tv:8087/streamtest/cartoon-network-87/live/87H/chunks.m3u8',
      label: 'HLS Live',
      isHttps: true,
    },
  ],
  cartoonnetwork: [
    {
      type: 'hls',
      url: 'https://vodzong.mjunoon.tv:8087/streamtest/cartoon-network-87/live/87H/chunks.m3u8',
      label: 'HLS Live',
      isHttps: true,
    },
  ],
  nickus: [
    {
      type: 'hls',
      url: 'https://jmp2.uk/plu-5ca673e0d0bd6c2689c94ce3.m3u8',
      label: 'HLS Live',
      isHttps: true,
    },
  ],
  nick: [
    {
      type: 'hls',
      url: 'https://jmp2.uk/plu-5ca673e0d0bd6c2689c94ce3.m3u8',
      label: 'HLS Live',
      isHttps: true,
    },
  ],
  skysportsepl: [
    {
      type: 'hls',
      url: 'http://45.228.234.9:8000/play/a06b/index.m3u8',
      label: 'Relay HD',
      isHttps: false,
      preferProxy: true,
    },
  ],
  banglavision: [
    {
      type: 'hls',
      url: 'https://tvsen5.aynaott.com/banglavision/index.m3u8',
      label: 'HLS HD',
      isHttps: true,
    },
  ],
  tsports: [
    {
      type: 'hls',
      url: 'https://tvsen5.aynaott.com/TnMn5kZz8aLm/index.m3u8',
      label: 'HLS HD',
      isHttps: true,
    },
  ],
};

const DEGRADED_URL_PATTERNS = [
  'drk6xq0vhn.gpcdn.net',
  'live20.bozztv.com',
  '2756d46c.akciatv.ru',
  'd1g8wgjurz8via.cloudfront.net/bpk-tv/ColorsHD',
];

const GROUP_PRIORITY_ORDER: Record<ChannelGroup, number> = {
  bangladesh: 0,
  'indian-bangla': 1,
  sports: 2,
  entertainment: 3,
  global: 4,
};

export function getApiUrl(path: string): string | null {
  const base = API_BASE_URL.trim().replace(/\/+$/, '');
  if (!base) return null;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function normalizeChannelKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(hd|sd|fhd|uhd|4k|tv|live)\b/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function isMpegTsStreamUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    const p = parsed.pathname.toLowerCase();
    const ext = parsed.searchParams.get('extension')?.toLowerCase();
    return p.endsWith('.ts') || p.endsWith('.mpegts') || ext === 'ts';
  } catch {
    return /\.ts(\?|$)/i.test(rawUrl);
  }
}

function createStreamSource(rawUrl: string, label: string): StreamSource {
  const clean = rawUrl.trim();
  const isHttps = clean.startsWith('https://');
  const isTs = isMpegTsStreamUrl(clean);
  const needsProxy =
    !isHttps ||
    isTs ||
    clean.includes('erbvr.com') ||
    clean.includes('getaj.net') ||
    clean.includes('yuppcdn.net');

  return {
    type: isTs ? 'mpegts' : 'hls',
    url: clean,
    label,
    isHttps,
    preferProxy: needsProxy,
  };
}

function normalizeYoutubeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    if (url.hostname.includes('youtube.com') || url.hostname.includes('youtube-nocookie.com')) {
      url.searchParams.set('autoplay', '1');
      url.searchParams.set('rel', '0');
      url.searchParams.set('modestbranding', '1');
      url.searchParams.set('playsinline', '1');
      return url.toString();
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
}

function classifyM3uGroup(groupTitle: string, channelName: string): {
  group: ChannelGroup;
  groupLabel: string;
  countryCode: string;
  countryName: string;
  language: string;
} {
  const g = groupTitle.toUpperCase();
  const n = channelName.toLowerCase();

  if (g === 'BANGLA' || g.includes('BANGLADESH') || n.includes('bangla')) {
    if (g.includes('INDIAN')) {
      return {
        group: 'indian-bangla',
        groupLabel: 'Indian Bangla',
        countryCode: 'in',
        countryName: 'India',
        language: 'Bengali',
      };
    }
    return {
      group: 'bangladesh',
      groupLabel: 'Bangladesh',
      countryCode: 'bd',
      countryName: 'Bangladesh',
      language: 'Bengali',
    };
  }
  if (g.includes('INDIAN BANGLA')) {
    return {
      group: 'indian-bangla',
      groupLabel: 'Indian Bangla',
      countryCode: 'in',
      countryName: 'India',
      language: 'Bengali',
    };
  }
  if (g.includes('SPORT')) {
    return {
      group: 'sports',
      groupLabel: 'Sports',
      countryCode: 'intl',
      countryName: 'Sports',
      language: 'Live Sports',
    };
  }
  if (
    g.includes('HINDI') ||
    g.includes('CARTOON') ||
    g.includes('KIDS') ||
    g.includes('MOVIE') ||
    g.includes('ENTERTAINMENT')
  ) {
    return {
      group: 'entertainment',
      groupLabel: groupTitle || 'Entertainment',
      countryCode: g.includes('HINDI') ? 'in' : 'intl',
      countryName: g.includes('HINDI') ? 'India' : 'Entertainment',
      language: g.includes('HINDI') ? 'Hindi' : 'English',
    };
  }
  return {
    group: 'global',
    groupLabel: groupTitle || 'International',
    countryCode: 'intl',
    countryName: 'International',
    language: 'Live TV',
  };
}

function classifyRangdhonuCat(cat: string, name: string): {
  group: ChannelGroup;
  groupLabel: string;
  countryCode: string;
  countryName: string;
  language: string;
} {
  const c = cat.toLowerCase();
  const n = name.toLowerCase();
  const bdNames = [
    'btv',
    'ntv',
    'jamuna',
    'ekattor',
    'somoy',
    'independent',
    'boishakhi',
    'channel 24',
    'channel i',
    'atn',
    'dbc',
    'ekhon',
    'deepto',
    'maasranga',
    'nagorik',
    'bijoy',
    'asian tv',
    'g tv',
    'r tv',
    'desh tv',
    'sa tv',
    'ananda',
    'news 24',
    'my tv',
    'mohona',
    'bangla vision',
    'ekushe',
    'nexus',
    'green tv',
    'duronto',
    'rangdhonu tv',
    'sangsad',
  ];

  if (bdNames.some((b) => n.includes(b))) {
    return {
      group: 'bangladesh',
      groupLabel: 'Bangladesh',
      countryCode: 'bd',
      countryName: 'Bangladesh',
      language: 'Bengali',
    };
  }
  if (
    c === 'bangla' ||
    n.includes('jalsha') ||
    n.includes('zee bangla') ||
    n.includes('colors bangla') ||
    n.includes('sony aath') ||
    n.includes('akash aath') ||
    n.includes('sun bangla') ||
    n.includes('sangeet bangla') ||
    n.includes('sonic bangla') ||
    n.includes('discovery bangla')
  ) {
    return {
      group: 'indian-bangla',
      groupLabel: 'Indian Bangla',
      countryCode: 'in',
      countryName: 'India',
      language: 'Bengali',
    };
  }
  if (c === 'sports' || n.includes('sport') || n.includes('cricket') || n.includes('willow')) {
    return {
      group: 'sports',
      groupLabel: 'Sports',
      countryCode: 'intl',
      countryName: 'Sports',
      language: 'Live Sports',
    };
  }
  if (c === 'entertainment' || c === 'movies' || c === 'music' || c === 'kids') {
    return {
      group: 'entertainment',
      groupLabel: cat || 'Entertainment',
      countryCode: 'in',
      countryName: 'Entertainment',
      language: 'Hindi / English',
    };
  }
  return {
    group: 'global',
    groupLabel: cat || 'International',
    countryCode: 'intl',
    countryName: 'International',
    language: 'Live TV',
  };
}

function parseM3uPlaylist(text: string, prefix: string): Omit<TvChannel, 'number'>[] {
  const lines = text.split(/\r?\n/);
  const items: Omit<TvChannel, 'number'>[] = [];

  let pendingMeta: {
    name: string;
    logo?: string;
    groupTitle: string;
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      const commaIdx = line.lastIndexOf(',');
      const name = commaIdx >= 0 ? line.slice(commaIdx + 1).trim() : '';

      pendingMeta = {
        name: name || `Channel ${items.length + 1}`,
        logo: logoMatch?.[1]?.trim() || undefined,
        groupTitle: groupMatch?.[1]?.trim() || 'Bangladesh',
      };
      continue;
    }

    if (line.startsWith('#')) {
      continue;
    }

    if (pendingMeta && (line.startsWith('http://') || line.startsWith('https://'))) {
      const meta = classifyM3uGroup(pendingMeta.groupTitle, pendingMeta.name);
      items.push({
        id: `${prefix}-${items.length + 1}-${normalizeChannelKey(pendingMeta.name)}`,
        name: pendingMeta.name,
        countryCode: meta.countryCode,
        countryName: meta.countryName,
        language: meta.language,
        group: meta.group,
        groupLabel: meta.groupLabel,
        logo: pendingMeta.logo,
        isGeoBlocked: false,
        sources: [createStreamSource(line, line.startsWith('https://') ? 'HD Stream' : 'Relay Stream')],
      });
      pendingMeta = null;
    }
  }

  return items;
}

function parseGenericJsonChannels(payload: unknown): Omit<TvChannel, 'number'>[] {
  const rawArray = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { channels?: unknown[] }).channels)
      ? (payload as { channels: unknown[] }).channels
      : [];

  const items: Omit<TvChannel, 'number'>[] = [];

  for (let idx = 0; idx < rawArray.length; idx++) {
    const entry = rawArray[idx] as RawChannelEntry & {
      id?: string;
      url?: string;
      streamUrl?: string;
      logo?: string;
      img?: string;
      group?: string;
      cat?: string;
    };
    if (!entry?.name) continue;

    const sources: StreamSource[] = [];
    const streams = Array.isArray(entry.sources?.streams) ? entry.sources.streams : [];
    const youtube = Array.isArray(entry.sources?.youtube) ? entry.sources.youtube : [];

    streams.forEach((u, sIdx) => {
      if (typeof u !== 'string' || !u.trim()) return;
      sources.push(createStreamSource(u, `Feed ${sIdx + 1}`));
    });

    if (typeof entry.url === 'string' && entry.url.startsWith('http')) {
      sources.push(createStreamSource(entry.url, 'Live Feed'));
    } else if (typeof entry.streamUrl === 'string' && entry.streamUrl.startsWith('http')) {
      sources.push(createStreamSource(entry.streamUrl, 'Live Feed'));
    }

    youtube.forEach((u, yIdx) => {
      if (typeof u !== 'string' || !u.trim()) return;
      sources.push({
        type: 'youtube',
        url: normalizeYoutubeUrl(u.trim()),
        label: youtube.length > 1 ? `HD Live ${yIdx + 1}` : 'HD Live',
        isHttps: true,
      });
    });

    if (sources.length === 0) continue;

    const meta = entry.cat || entry.group
      ? classifyM3uGroup(entry.cat || entry.group || 'Bangladesh', entry.name)
      : {
          group: 'bangladesh' as ChannelGroup,
          groupLabel: 'Bangladesh',
          countryCode: entry.country || 'bd',
          countryName: 'Bangladesh',
          language: 'Bengali',
        };

    items.push({
      id: `primary-${entry.nanoid || entry.id || idx + 1}`,
      name: entry.name.trim(),
      countryCode: meta.countryCode,
      countryName: meta.countryName,
      language: meta.language,
      group: meta.group,
      groupLabel: meta.groupLabel,
      logo: entry.logo || entry.img,
      isGeoBlocked: Boolean(entry.isGeoBlocked),
      sources,
    });
  }

  return items;
}

/**
 * 1. Fetch primary channels from CHANNELS_URL (supports HTTPS JSON or M3U/M3U8).
 */
async function fetchPrimaryChannelsFromUrl(): Promise<Omit<TvChannel, 'number'>[]> {
  try {
    const res = await fetch(CHANNELS_URL, { cache: 'no-store' });
    if (!res.ok) return [];
    const text = await res.text();
    const trimmed = text.trimStart();

    if (trimmed.startsWith('#EXTM3U') || trimmed.startsWith('#EXTINF')) {
      return parseM3uPlaylist(text, 'primary');
    }

    const parsed = JSON.parse(text) as unknown;
    return parseGenericJsonChannels(parsed);
  } catch {
    return [];
  }
}

/**
 * 2. Parse ALL channels from tv.chitrabani24.com/trail.m3u (direct HTTPS; optional API relay only if configured).
 */
async function fetchChitrabaniChannels(): Promise<Omit<TvChannel, 'number'>[]> {
  try {
    const targetUrl = `${CHITRABANI_M3U_URL}?t=${Date.now()}`;
    let res: Response | null = null;
    try {
      res = await fetch(targetUrl);
    } catch {
      res = null;
    }

    if (!res || !res.ok) {
      const proxyEndpoint = getApiUrl(`/api/proxy?url=${encodeURIComponent(CHITRABANI_M3U_URL)}`);
      if (proxyEndpoint) {
        res = await fetch(proxyEndpoint).catch(() => null);
      }
    }
    if (!res || !res.ok) return [];

    const text = await res.text();
    return parseM3uPlaylist(text, 'chitra');
  } catch {
    return [];
  }
}

interface RangdhonuRawChannel {
  id?: string;
  name?: string;
  cat?: string;
  img?: string;
  url?: string;
  type?: string;
}

interface SonylivRawMatch {
  contentId?: string | number;
  isLive?: boolean;
  match_name?: string;
  event_name?: string;
  broadcast_channel?: string;
  src?: string;
  dai_url?: string;
  pub_url?: string;
  video_url?: string;
}

interface FancodeRawMatch {
  match_id?: string;
  title?: string;
  tournament?: string;
  image?: string;
  streams?: {
    primary?: string;
    fancode_bd_cdn?: string;
    fancode_cdn?: string;
  };
}

/**
 * 3. Fetch ALL channels & live sports feeds directly (optional backend aggregation only if API_BASE_URL is set).
 */
async function fetchRangdhonuChannels(): Promise<Omit<TvChannel, 'number'>[]> {
  const items: Omit<TvChannel, 'number'>[] = [];
  const rawCatalogMap = new Map<string, RangdhonuRawChannel>();
  const aggregateEndpoint = getApiUrl('/api/sources/rangdhonu');

  const [browserCatalog, serverAggregate, directSonyliv, directFancode] = await Promise.all([
    fetch(RANGDHONU_CATALOG_URL, { cache: 'no-store', credentials: 'omit' })
      .then((r) => (r.ok ? (r.json() as Promise<{ channels?: RangdhonuRawChannel[] }>) : null))
      .catch(() => null),
    aggregateEndpoint
      ? fetch(aggregateEndpoint, { cache: 'no-store' })
          .then((r) =>
            r.ok
              ? (r.json() as Promise<{
                  channels?: RangdhonuRawChannel[];
                  sonylivMatches?: SonylivRawMatch[];
                  fancodeMatches?: FancodeRawMatch[];
                }>)
              : null,
          )
          .catch(() => null)
      : Promise.resolve(null),
    fetch(RANGDHONU_SONYLIV_URL, { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<{ matches?: SonylivRawMatch[] }>) : null))
      .catch(() => null),
    fetch(RANGDHONU_FANCODE_URL, { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<{ matches?: FancodeRawMatch[] }>) : null))
      .catch(() => null),
  ]);

  for (const ch of [
    ...(browserCatalog?.channels ?? []),
    ...(serverAggregate?.channels ?? []),
  ]) {
    if (ch?.id && ch?.url && !rawCatalogMap.has(ch.id)) {
      rawCatalogMap.set(ch.id, ch);
    }
  }

  for (const ch of rawCatalogMap.values()) {
    if (!ch.id || !ch.url) continue;
    const displayName = (ch.name && RANGDHONU_CHANNEL_NAMES[ch.name]) || ch.name || ch.id;
    const meta = classifyRangdhonuCat(ch.cat || '', displayName);
    const isToken = ch.url.startsWith('w1:') || ch.url.startsWith('w2:');

    items.push({
      id: `rd-${ch.id}`,
      name: displayName.trim(),
      countryCode: meta.countryCode,
      countryName: meta.countryName,
      language: meta.language,
      group: meta.group,
      groupLabel: meta.groupLabel,
      logo: ch.img,
      isGeoBlocked: false,
      sources: [
        isToken
          ? {
              type: 'token',
              url: ch.url,
              label: 'Live Feed',
              isHttps: true,
            }
          : createStreamSource(ch.url, 'Live Feed'),
      ],
    });
  }

  const sonylivMatches: SonylivRawMatch[] =
    directSonyliv?.matches ?? serverAggregate?.sonylivMatches ?? [];
  for (const m of sonylivMatches) {
    const streamUrls = [m.dai_url, m.pub_url, m.video_url].filter(
      (u): u is string => typeof u === 'string' && u.startsWith('http'),
    );
    const uniqueUrls = Array.from(new Set(streamUrls));
    if (uniqueUrls.length === 0) continue;

    items.push({
      id: `rd-sl-${m.contentId || items.length}`,
      name: m.match_name || m.broadcast_channel || m.event_name || 'Live Sports',
      countryCode: 'intl',
      countryName: m.broadcast_channel || 'Sports',
      language: 'Live Sports',
      group: 'sports',
      groupLabel: m.isLive ? 'Live Sports' : 'Sports Event',
      logo: m.src,
      isGeoBlocked: false,
      sources: uniqueUrls.map((u, idx) => createStreamSource(u, `Feed ${idx + 1}`)),
    });
  }

  const fancodeMatches: FancodeRawMatch[] =
    directFancode?.matches ?? serverAggregate?.fancodeMatches ?? [];
  for (const m of fancodeMatches) {
    const candidates = [
      m.streams?.fancode_bd_cdn,
      m.streams?.primary,
      m.streams?.fancode_cdn,
    ].filter(
      (u): u is string =>
        typeof u === 'string' && u.startsWith('http') && !u.includes('UNAVAILABLE'),
    );
    if (candidates.length === 0) continue;

    items.push({
      id: `rd-fc-${m.match_id || items.length}`,
      name: m.title || m.tournament || 'Live Match',
      countryCode: 'intl',
      countryName: m.tournament || 'Sports',
      language: 'Live Sports',
      group: 'sports',
      groupLabel: 'Sports',
      logo: m.image,
      isGeoBlocked: false,
      sources: candidates.map((u, idx) => createStreamSource(u, `Stream ${idx + 1}`)),
    });
  }

  return items;
}

/**
 * Resolve tokenized Rangdhonu worker URLs (`w1:<key>` / `w2:<key>`) directly,
 * with optional API_BASE_URL fallback if configured.
 */
export async function resolveChannelSourceUrl(source: StreamSource): Promise<string> {
  if (source.type !== 'token') return source.url;
  const parts = source.url.split(':');
  const worker = parts[0] === 'w1' ? 'w1' : 'w2';
  const base = worker === 'w1' ? RANGDHONU_WORKER_BASES[0] : RANGDHONU_WORKER_BASES[1];
  const key = parts[1];
  if (!key) throw new Error('Invalid stream key');

  try {
    const res = await fetch(`${base}/api/token/${key}`, {
      cache: 'no-store',
      credentials: 'omit',
    });
    if (res.ok) {
      const data = (await res.json()) as { url?: string };
      if (data.url) return data.url;
    }
  } catch {
    // Try optional backend relay below if configured
  }

  const tokenRelay = getApiUrl(
    `/api/rangdhonu-token?worker=${encodeURIComponent(worker)}&key=${encodeURIComponent(key)}`,
  );
  if (tokenRelay) {
    const fallbackRes = await fetch(tokenRelay, { cache: 'no-store' });
    if (fallbackRes.ok) {
      const fallbackData = (await fallbackRes.json()) as { url?: string };
      if (fallbackData.url) return fallbackData.url;
    }
  }

  throw new Error('Unable to authorize stream token');
}

function sourceSortWeight(src: StreamSource): number {
  const isDegraded = DEGRADED_URL_PATTERNS.some((p) => src.url.includes(p));
  if (isDegraded) return 100;
  if (src.type === 'hls' && src.isHttps && !src.preferProxy) return 0;
  if (src.type === 'hls' && src.isHttps) return 1;
  if (src.type === 'hls') return 2;
  if (src.type === 'mpegts') return 3;
  if (src.type === 'token') return 4;
  return 5;
}

function mergeAndOrderChannels(lists: Array<Omit<TvChannel, 'number'>[]>): TvChannel[] {
  const mergedMap = new Map<string, Omit<TvChannel, 'number'>>();

  for (const list of lists) {
    for (const item of list) {
      const normalized = normalizeChannelKey(item.name);
      const key = `${item.group}:${normalized || item.id}`;
      const existing = mergedMap.get(key);
      if (!existing) {
        mergedMap.set(key, {
          ...item,
          sources: [...item.sources],
        });
      } else {
        const seenUrls = new Set(existing.sources.map((s) => s.url));
        for (const src of item.sources) {
          if (!seenUrls.has(src.url)) {
            seenUrls.add(src.url);
            existing.sources.push({
              ...src,
              label: `Mirror ${existing.sources.length + 1}`,
            });
          }
        }
        if (!existing.logo && item.logo) {
          existing.logo = item.logo;
        }
      }
    }
  }

  for (const ch of mergedMap.values()) {
    const norm = normalizeChannelKey(ch.name);
    const extraMirrors = VERIFIED_MIRRORS[norm];
    if (!extraMirrors) continue;
    const seenUrls = new Set(ch.sources.map((s) => s.url));
    for (const mirror of extraMirrors) {
      if (!seenUrls.has(mirror.url)) {
        seenUrls.add(mirror.url);
        ch.sources.push(mirror);
      }
    }
  }

  const all = Array.from(mergedMap.values());

  all.sort((a, b) => {
    const groupDiff = GROUP_PRIORITY_ORDER[a.group] - GROUP_PRIORITY_ORDER[b.group];
    if (groupDiff !== 0) return groupDiff;

    const aBest = Math.min(...a.sources.map(sourceSortWeight));
    const bBest = Math.min(...b.sources.map(sourceSortWeight));
    if (aBest !== bBest) return aBest - bBest;

    const aGeo = a.isGeoBlocked ? 1 : 0;
    const bGeo = b.isGeoBlocked ? 1 : 0;
    if (aGeo !== bGeo) return aGeo - bGeo;

    return a.name.localeCompare(b.name);
  });

  return all.map((ch, idx) => {
    const sortedSources = [...ch.sources].sort((x, y) => sourceSortWeight(x) - sourceSortWeight(y));
    return {
      ...ch,
      number: idx + 1,
      sources: sortedSources,
    };
  });
}

/**
 * Optional stream health check via API_BASE_URL/api/verify-streams.
 * Always skips cleanly or falls back to all channels if API_BASE_URL is empty or unreachable.
 */
async function probeUrlInBrowser(rawUrl: string): Promise<boolean> {
  const isHttpsPage =
    typeof window !== 'undefined' && window.location.protocol === 'https:';
  if (isHttpsPage && rawUrl.startsWith('http://') && !getApiUrl('/api/proxy')) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 3200);
    const res = await fetch(rawUrl, {
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal,
    });
    window.clearTimeout(timer);

    if (!res.ok) {
      await res.body?.cancel().catch(() => {});
      return false;
    }

    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('text/html')) {
      await res.body?.cancel().catch(() => {});
      return false;
    }

    if (isMpegTsStreamUrl(rawUrl) || ct.startsWith('video/') || ct.startsWith('audio/')) {
      await res.body?.cancel().catch(() => {});
      return true;
    }

    if (res.body && typeof res.body.getReader === 'function') {
      const reader = res.body.getReader();
      const { value } = await reader.read();
      await reader.cancel().catch(() => {});
      const head = value ? new TextDecoder().decode(value.slice(0, 256)) : '';
      return head.trimStart().startsWith('#EXTM3U');
    }

    const text = await res.text();
    return text.trimStart().startsWith('#EXTM3U');
  } catch {
    return false;
  }
}

async function verifyUrlsInBrowser(urls: string[]): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  await Promise.all(
    urls.map(async (u) => {
      results[u] = await probeUrlInBrowser(u);
    }),
  );
  return results;
}

/**
 * Verify stream URLs via optional API_BASE_URL/api/verify-streams,
 * falling back to direct browser/Tizen live probing when no server is configured.
 */
async function verifyAndFilterLiveChannels(channels: TvChannel[]): Promise<TvChannel[]> {
  const urlsSet = new Set<string>();
  for (const ch of channels) {
    for (const src of ch.sources) {
      if ((src.type === 'hls' || src.type === 'mpegts') && src.url.startsWith('http')) {
        urlsSet.add(src.url);
      }
    }
  }

  const urlsToCheck = Array.from(urlsSet);
  if (urlsToCheck.length === 0) return channels;

  let results: Record<string, boolean> | null = null;
  const verifyEndpoint = getApiUrl('/api/verify-streams');

  if (verifyEndpoint) {
    try {
      const res = await fetch(verifyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlsToCheck }),
      });
      if (res.ok) {
        const data = (await res.json()) as { results?: Record<string, boolean> };
        if (data.results) {
          results = data.results;
        }
      }
    } catch {
      results = null;
    }
  }

  if (!results) {
    results = await verifyUrlsInBrowser(urlsToCheck);
  }

  const aliveChannels: TvChannel[] = [];
  for (const ch of channels) {
    const liveSources = ch.sources.filter((src) => {
      if (src.type === 'youtube' || src.type === 'token') return true;
      return results?.[src.url] === true;
    });
    if (liveSources.length === 0) continue;
    aliveChannels.push({
      ...ch,
      number: aliveChannels.length + 1,
      sources: liveSources,
    });
  }

  return aliveChannels.length > 0 ? aliveChannels : channels;
}

export function saveCachedChannels(channels: TvChannel[]): void {
  try {
    if (channels.length > 0) {
      localStorage.setItem(CHANNELS_CACHE_KEY, JSON.stringify(channels));
    }
  } catch {
    // Ignore storage quota errors
  }
}

function loadCachedChannels(): TvChannel[] {
  try {
    const raw = localStorage.getItem(CHANNELS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TvChannel[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function fetchAllSourcesLineup(): Promise<TvChannel[]> {
  const [primaryList, chitrabaniList, rangdhonuList] = await Promise.all([
    fetchPrimaryChannelsFromUrl(),
    fetchChitrabaniChannels(),
    fetchRangdhonuChannels(),
  ]);

  const combined = mergeAndOrderChannels([chitrabaniList, primaryList, rangdhonuList]);
  if (combined.length > 0) {
    const finalLineup = await verifyAndFilterLiveChannels(combined);
    saveCachedChannels(finalLineup);
    return finalLineup;
  }

  const cached = loadCachedChannels();
  if (cached.length > 0) {
    return cached;
  }

  throw new Error('Unable to load live channels. Check your internet connection and retry.');
}
