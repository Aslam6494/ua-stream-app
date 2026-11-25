import dns from 'node:dns/promises';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const RANGDHONU_WORKERS: Record<string, string> = {
  w1: 'https://live.rangdhonu.live',
  w2: 'https://live.indiansserials.com',
};

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.goog',
]);

function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 0 && parts[2] === 0) return true; // 192.0.0.0/24
  if (a === 192 && b === 0 && parts[2] === 2) return true; // TEST-NET-1
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isPrivateOrReservedIp(ip: string): boolean {
  const cleaned = ip.replace(/^\[|\]$/g, '').split('%')[0].toLowerCase();
  const family = net.isIP(cleaned);
  if (family === 4) {
    return isPrivateOrReservedIpv4(cleaned);
  }
  if (family === 6) {
    if (cleaned === '::' || cleaned === '::1') return true;
    if (cleaned.startsWith('::ffff:')) {
      const mapped = cleaned.slice('::ffff:'.length);
      if (net.isIP(mapped) === 4) return isPrivateOrReservedIpv4(mapped);
    }
    if (cleaned.startsWith('fc') || cleaned.startsWith('fd')) return true; // fc00::/7 ULA
    if (
      cleaned.startsWith('fe8') ||
      cleaned.startsWith('fe9') ||
      cleaned.startsWith('fea') ||
      cleaned.startsWith('feb')
    ) {
      return true; // fe80::/10 link-local
    }
    if (cleaned.startsWith('ff')) return true; // multicast
    return false;
  }
  return true;
}

async function assertSafeExternalUrl(rawUrl: string): Promise<URL> {
  if (!rawUrl || rawUrl.length > 4096) {
    throw new Error('Invalid stream URL');
  }
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Unsupported URL protocol');
  }
  if (parsed.username || parsed.password) {
    throw new Error('URL credentials are not allowed');
  }

  const host = parsed.hostname.toLowerCase();
  if (
    !host ||
    BLOCKED_HOSTNAMES.has(host) ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    throw new Error('Blocked destination host');
  }

  const strippedHost = host.replace(/^\[|\]$/g, '');
  if (net.isIP(strippedHost)) {
    if (isPrivateOrReservedIp(strippedHost)) {
      throw new Error('Blocked private IP address');
    }
    return parsed;
  }

  const resolved = await dns.lookup(strippedHost, { all: true });
  if (!resolved.length || resolved.some((entry) => isPrivateOrReservedIp(entry.address))) {
    throw new Error('Destination resolved to a restricted network address');
  }

  return parsed;
}

async function fetchExternalWithSafeRedirects(
  initialUrl: string,
  baseHeaders: Record<string, string>,
  signal: AbortSignal,
): Promise<{ response: globalThis.Response; finalUrl: string }> {
  let currentUrl = initialUrl;

  for (let hop = 0; hop < 6; hop += 1) {
    const safeUrl = await assertSafeExternalUrl(currentUrl);
    const headers: Record<string, string> = {
      ...baseHeaders,
      Referer: `${safeUrl.origin}/`,
    };

    const response = await fetch(safeUrl.toString(), {
      method: 'GET',
      headers,
      redirect: 'manual',
      signal,
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        return { response, finalUrl: safeUrl.toString() };
      }
      await response.body?.cancel().catch(() => {});
      currentUrl = new URL(location, safeUrl).toString();
      continue;
    }

    return { response, finalUrl: safeUrl.toString() };
  }

  throw new Error('Too many redirects from upstream broadcast server');
}

function toProxyUrl(rawUri: string, baseUrl: string): string {
  try {
    const resolved = new URL(rawUri.trim(), baseUrl);
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
      return rawUri;
    }
    return `/api/proxy?url=${encodeURIComponent(resolved.toString())}`;
  } catch {
    return rawUri;
  }
}

function rewriteM3u8Playlist(playlistText: string, baseUrl: string): string {
  const lines = playlistText.split(/\r?\n/);
  const rewritten = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    if (trimmed.startsWith('#')) {
      return line.replace(/URI="([^"]+)"/gi, (_match, uriValue: string) => {
        return `URI="${toProxyUrl(uriValue, baseUrl)}"`;
      });
    }

    return toProxyUrl(trimmed, baseUrl);
  });

  return rewritten.join('\n');
}

const STREAM_HEALTH_TTL_MS = 5 * 60 * 1000;
const streamHealthCache = new Map<string, { alive: boolean; expiresAt: number }>();

async function probeStreamUrl(rawUrl: string): Promise<boolean> {
  const now = Date.now();
  const cached = streamHealthCache.get(rawUrl);
  if (cached && cached.expiresAt > now) {
    return cached.alive;
  }

  let alive = false;
  try {
    const { response, finalUrl } = await fetchExternalWithSafeRedirects(
      rawUrl,
      {
        'User-Agent': BROWSER_UA,
        Accept: '*/*',
      },
      AbortSignal.timeout(3800),
    );

    const ct = (response.headers.get('content-type') || '').toLowerCase();
    const urlPath = new URL(finalUrl).pathname.toLowerCase();
    const isBinaryMedia =
      urlPath.endsWith('.ts') ||
      urlPath.endsWith('.mpegts') ||
      ct.startsWith('video/') ||
      ct.startsWith('audio/');

    if (!response.ok || ct.includes('text/html')) {
      await response.body?.cancel().catch(() => {});
      alive = false;
    } else if (isBinaryMedia) {
      await response.body?.cancel().catch(() => {});
      alive = true;
    } else if (response.body) {
      const reader = response.body.getReader();
      const { value } = await reader.read();
      await reader.cancel().catch(() => {});
      const head = value ? Buffer.from(value).toString('utf8', 0, Math.min(value.length, 512)) : '';
      alive = head.trimStart().startsWith('#EXTM3U');
    }
  } catch {
    alive = false;
  }

  if (streamHealthCache.size > 1000) {
    streamHealthCache.clear();
  }
  streamHealthCache.set(rawUrl, { alive, expiresAt: now + STREAM_HEALTH_TTL_MS });
  return alive;
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  // CORS preflight for local/player requests
  app.options('/api/{*splat}', (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
    res.status(204).end();
  });

  // Direct download for the pre-built Samsung Tizen TV static package
  app.get('/ua-stream-tizen.zip', (_req: Request, res: Response) => {
    const zipPath = path.resolve(__dirname, 'ua-stream-tizen.zip');
    if (!fs.existsSync(zipPath)) {
      res.status(404).json({ error: 'Tizen package archive not found' });
      return;
    }
    res.download(zipPath, 'ua-stream-tizen.zip');
  });

  // Verify which broadcast URLs are currently live so offline channels can be excluded
  app.post('/api/verify-streams', async (req: Request, res: Response) => {
    const rawList: unknown = req.body?.urls;
    if (!Array.isArray(rawList)) {
      res.status(400).json({ error: 'urls array is required' });
      return;
    }

    const uniqueUrls = Array.from(
      new Set(
        rawList
          .filter((u): u is string => typeof u === 'string' && u.length > 0 && u.length <= 2048)
          .slice(0, 200),
      ),
    );

    const results: Record<string, boolean> = {};
    await Promise.all(
      uniqueUrls.map(async (u) => {
        results[u] = await probeStreamUrl(u);
      }),
    );

    res.setHeader('Cache-Control', 'no-store');
    res.json({ results });
  });

  // Stream & Playlist Proxy (solves CORS, HTTP mixed-content, and content-type quirks)
  app.get('/api/proxy', async (req: Request, res: Response) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url : '';
    if (!rawUrl) {
      res.status(400).json({ error: 'Missing url parameter' });
      return;
    }

    const controller = new AbortController();
    const connectTimer = setTimeout(() => controller.abort(), 14000);
    let clientClosed = false;

    req.on('close', () => {
      clientClosed = true;
      clearTimeout(connectTimer);
      controller.abort();
    });

    try {
      const headers: Record<string, string> = {
        'User-Agent': BROWSER_UA,
        Accept: '*/*',
      };
      if (typeof req.headers.range === 'string') {
        headers.Range = req.headers.range;
      }

      const { response: upstream, finalUrl } = await fetchExternalWithSafeRedirects(
        rawUrl,
        headers,
        controller.signal,
      );
      clearTimeout(connectTimer);

      if (clientClosed) {
        await upstream.body?.cancel().catch(() => {});
        return;
      }

      const contentType = (upstream.headers.get('content-type') || '').toLowerCase();
      const urlPath = new URL(finalUrl).pathname.toLowerCase();

      const looksLikePlaylist =
        contentType.includes('mpegurl') ||
        contentType.includes('x-mpegurl') ||
        urlPath.endsWith('.m3u8') ||
        urlPath.endsWith('.m3u');

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type');
      res.setHeader('Cache-Control', 'no-store');

      if (!upstream.ok) {
        await upstream.body?.cancel().catch(() => {});
        res.status(upstream.status).json({ error: `Upstream returned ${upstream.status}` });
        return;
      }

      if (looksLikePlaylist) {
        const text = await upstream.text();
        if (text.trimStart().startsWith('#EXTM3U')) {
          const rewritten = rewriteM3u8Playlist(text, finalUrl);
          res.status(200);
          res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
          res.send(rewritten);
          return;
        }
        // Fallback if URL ends with .m3u8 but returned non-playlist payload
        res.status(200);
        res.setHeader('Content-Type', contentType || 'text/plain; charset=utf-8');
        res.send(text);
        return;
      }

      if (!upstream.body) {
        res.status(502).json({ error: 'Empty stream response from upstream' });
        return;
      }

      res.status(upstream.status);
      if (urlPath.endsWith('.ts') && (!contentType || contentType === 'application/octet-stream')) {
        res.setHeader('Content-Type', 'video/mp2t');
      } else if (contentType) {
        res.setHeader('Content-Type', contentType);
      }

      const contentLength = upstream.headers.get('content-length');
      if (contentLength) res.setHeader('Content-Length', contentLength);
      const contentRange = upstream.headers.get('content-range');
      if (contentRange) res.setHeader('Content-Range', contentRange);
      const acceptRanges = upstream.headers.get('accept-ranges');
      if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);

      const nodeStream = Readable.fromWeb(
        upstream.body as unknown as import('node:stream/web').ReadableStream<Uint8Array>,
      );

      nodeStream.on('error', () => {
        if (!res.headersSent) {
          res.status(502).end();
        } else {
          res.end();
        }
      });

      req.on('close', () => {
        nodeStream.destroy();
      });

      nodeStream.pipe(res);
    } catch (err) {
      clearTimeout(connectTimer);
      if (clientClosed || res.headersSent) {
        res.end();
        return;
      }
      const message = err instanceof Error ? err.message : 'Proxy fetch failed';
      const status =
        message.includes('Blocked') ||
        message.includes('Invalid') ||
        message.includes('Unsupported') ||
        message.includes('restricted')
          ? 400
          : 502;
      res.status(status).json({ error: message });
    }
  });

  // Server-side aggregation for Rangdhonu & Chitrabani sources (bypasses browser CORS issues)
  app.get('/api/sources/rangdhonu', async (_req: Request, res: Response) => {
    const safeFetchJson = async <T,>(url: string, headers: Record<string, string> = {}): Promise<T | null> => {
      try {
        const resp = await fetch(url, {
          signal: AbortSignal.timeout(6000),
          headers: {
            'User-Agent': BROWSER_UA,
            Accept: 'application/json,text/plain,*/*',
            ...headers,
          },
        });
        if (!resp.ok) return null;
        return (await resp.json()) as T;
      } catch {
        return null;
      }
    };

    const [catalog, sonyliv, fancode] = await Promise.all([
      safeFetchJson<{ channels?: unknown[] }>('https://live.indiansserials.com/channels', {
        Origin: 'https://www.rangdhonu.live',
        Referer: 'https://www.rangdhonu.live/',
      }),
      safeFetchJson<{ matches?: unknown[] }>(
        'https://raw.githubusercontent.com/sayanpal514-hue/SONYLIV-AUTO-UPDATED-PLAYLIST/main/sonyliv.json',
      ),
      safeFetchJson<{ matches?: unknown[] }>(
        'https://rangdhonutv.tasinazadkafi99.workers.dev/fancode-api',
      ),
    ]);

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      channels: Array.isArray(catalog?.channels) ? catalog.channels : [],
      sonylivMatches: Array.isArray(sonyliv?.matches) ? sonyliv.matches : [],
      fancodeMatches: Array.isArray(fancode?.matches) ? fancode.matches : [],
    });
  });

  // Allowlisted server-side token resolver fallback for Rangdhonu worker tokens
  app.get('/api/rangdhonu-token', async (req: Request, res: Response) => {
    const worker = typeof req.query.worker === 'string' ? req.query.worker : '';
    const key = typeof req.query.key === 'string' ? req.query.key : '';

    const base = RANGDHONU_WORKERS[worker];
    if (!base || !/^[a-zA-Z0-9_-]{1,64}$/.test(key)) {
      res.status(400).json({ error: 'Invalid stream token request' });
      return;
    }

    try {
      const upstream = await fetch(`${base}/api/token/${key}`, {
        signal: AbortSignal.timeout(8000),
        headers: {
          'User-Agent': BROWSER_UA,
          Origin: 'https://www.rangdhonu.live',
          Referer: 'https://www.rangdhonu.live/',
        },
      });
      if (!upstream.ok) {
        res.status(upstream.status).json({ error: 'Token authorization failed' });
        return;
      }
      const data = (await upstream.json()) as { url?: string };
      if (!data.url) {
        res.status(502).json({ error: 'Stream URL unavailable' });
        return;
      }
      res.setHeader('Cache-Control', 'no-store');
      res.json({ url: data.url });
    } catch {
      res.status(502).json({ error: 'Unable to authorize stream token' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UA Stream server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
