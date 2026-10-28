/**
 * HK-Tech Post — zero-dependency Node.js server.
 * Serves the static frontend plus a small JSON API for articles,
 * comments, interaction tracking (analytics) and the educator dashboard.
 *
 * Run:  node server.js [port]
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.argv[2]) || Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

const articles = require(path.join(DATA_DIR, 'articles.js'));

// ---------------------------------------------------------------------------
// Persistent store (interaction events + user comments). Written to JSON so an
// educator can inspect or reset it by deleting data/store.json.
// ---------------------------------------------------------------------------
let store = { events: [], comments: {} };
try {
  if (fs.existsSync(STORE_FILE)) {
    store = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  }
} catch (e) {
  console.error('Failed to load store, starting fresh:', e.message);
}

function persist() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
  } catch (e) {
    console.error('Failed to persist store:', e.message);
  }
}

function now() {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Real market indices, fetched from CNN Markets (production.dataviz.cnn.io).
// Cached for 60s so we don't hammer the upstream API. Falls back to the last
// known-good snapshot if the network request fails.
// ---------------------------------------------------------------------------
const MARKET_SYMBOLS = [
  'HSI-HKX:D', 'DJII-USA', 'SP500-CME', 'COMP-USA', 'NIK-NKX:D', 'SHANG-SHG:D',
  'UKX.GBP-FTX', 'DAX-XEX:D', 'KOSPI-KRX:D', 'XJO-ASX:D', 'TWI-TAI:D', 'SENSEX-BOM:D',
].join(',');
const INDEX_NAMES_ZH = {
  'HSI-HKX:D': '恆生指數',
  'DJII-USA': '道瓊斯指數',
  'SP500-CME': '標普500',
  'COMP-USA': '納斯達克',
  'NIK-NKX:D': '日經225',
  'SHANG-SHG:D': '上證指數',
  'UKX.GBP-FTX': '富時100',
  'DAX-XEX:D': '德國DAX',
  'KOSPI-KRX:D': '韓國KOSPI',
  'XJO-ASX:D': '澳洲ASX200',
  'TWI-TAI:D': '台灣加權',
  'SENSEX-BOM:D': '印度Sensex',
};
const CNN_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
let marketCache = { at: 0, data: null, error: null };

async function fetchMarket() {
  const age = Date.now() - marketCache.at;
  if (marketCache.data && age < 60000) return marketCache.data;

  const date = new Date().toISOString().slice(0, 10);
  const url = `https://production.dataviz.cnn.io/markets/index/${MARKET_SYMBOLS}/${date}`;
  try {
    const res = await fetch(url, {
      headers: {
        Referer: 'https://edition.cnn.com/markets',
        Accept: 'application/json',
        'User-Agent': CNN_UA,
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error('CNN responded ' + res.status);
    const raw = await res.json();
    const indices = raw.map((r) => ({
      symbol: r.symbol,
      name: r.name,
      nameZh: INDEX_NAMES_ZH[r.symbol] || r.name,
      price: r.current_price,
      change: r.price_change_from_prev_close,
      changePct: Number((r.percent_change_from_prev_close * 100).toFixed(2)),
      dir: r.price_change_from_prev_close >= 0 ? 'up' : 'down',
    }));
    const data = {
      indices,
      updatedAt: now(),
      source: 'CNN Markets',
      fetchedAt: now(),
    };
    marketCache = { at: Date.now(), data, error: null };
    return data;
  } catch (e) {
    marketCache.error = e.message;
    // Serve a stale snapshot if we have one, otherwise a clearly-marked failure.
    if (marketCache.data) return marketCache.data;
    return { indices: [], updatedAt: now(), source: 'CNN Markets', error: e.message };
  }
}
function getWeather() {
  const temps = [21, 22, 23, 24, 25, 26];
  const cond = ['多雲', '間中有雨', '天晴', '薄霧'];
  const condEn = ['Cloudy', 'Showers', 'Sunny', 'Misty'];
  const i = Math.floor(Math.random() * cond.length);
  return {
    city: '香港', cityEn: 'Hong Kong',
    temp: temps[Math.floor(Math.random() * temps.length)],
    humidity: 78 + Math.floor(Math.random() * 12),
    condition: cond[i], conditionEn: condEn[i],
    updatedAt: now(),
  };
}

// Comments are plain reader comments; posting does NOT trigger a bot reply.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function record(type, meta) {
  const evt = { id: crypto.randomUUID(), type, ts: now(), ...(meta || {}) };
  store.events.push(evt);
  // Cap history to avoid unbounded growth in long classroom sessions.
  if (store.events.length > 20000) store.events = store.events.slice(-20000);
  persist();
  return evt;
}

const articleList = articles.map((a) => ({
  slug: a.slug,
  pillar: a.pillar,
  categoryZh: a.categoryZh,
  categoryEn: a.categoryEn,
  stem: a.stem,
  tagZh: a.tagZh,
  tagEn: a.tagEn,
  breaking: !!a.breaking,
  titleZh: a.titleZh,
  titleEn: a.titleEn,
  ledeZh: a.ledeZh,
  ledeEn: a.ledeEn,
  bylineZh: a.bylineZh,
  bylineEn: a.bylineEn,
  timeLabelZh: a.timeLabelZh,
  timeLabelEn: a.timeLabelEn,
  viewCount: a.viewCount,
  engagement: a.engagement,
  image: a.image,
  aiFlags: (a.aiProvenance || []).length,
}));

function findArticle(slug) {
  return articles.find((a) => a.slug === slug);
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res, pathname) {
  let p = pathname === '/' ? '/index.html' : pathname;
  // Prevent path traversal.
  const safe = path.normalize(p).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, safe);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // Fallback: SPA-style route for unknown paths -> 404 page or index.
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end('<h1>404 Not Found</h1>');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

async function handleApi(req, res, pathname) {
  // GET /api/ticker  (real market indices from CNN Markets)
  if (pathname === '/api/ticker' && req.method === 'GET') {
    const data = await fetchMarket();
    return sendJSON(res, 200, data);
  }
  // GET /api/weather
  if (pathname === '/api/weather' && req.method === 'GET') {
    return sendJSON(res, 200, getWeather());
  }
  // GET /api/articles
  if (pathname === '/api/articles' && req.method === 'GET') {
    return sendJSON(res, 200, { articles: articleList });
  }
  // GET /api/articles/:slug
  const m = pathname.match(/^\/api\/articles\/([\w-]+)$/);
  if (m && req.method === 'GET') {
    const art = findArticle(m[1]);
    if (!art) return sendJSON(res, 404, { error: 'not found' });
    return sendJSON(res, 200, { article: art });
  }
  // DELETE /api/comments/:slug/:id — remove one of your own comments
  const cdm = pathname.match(/^\/api\/comments\/([\w-]+)\/([\w-]+)$/);
  if (cdm && req.method === 'DELETE') {
    const slug = cdm[1];
    const id = cdm[2];
    const list = store.comments[slug] || [];
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return sendJSON(res, 404, { error: 'not found' });
    list.splice(idx, 1);
    persist();
    record('comment_delete', { slug, id });
    return sendJSON(res, 200, { ok: true });
  }
  // GET /api/comments/:slug  and POST /api/comments/:slug
  const cm = pathname.match(/^\/api\/comments\/([\w-]+)$/);
  if (cm) {
    const slug = cm[1];
    const art = findArticle(slug);
    if (!art) return sendJSON(res, 404, { error: 'not found' });
    const seeded = art.comments || [];
    const stored = store.comments[slug] || [];
    if (req.method === 'GET') {
      return sendJSON(res, 200, { comments: [...seeded, ...stored] });
    }
    if (req.method === 'POST') {
      let body;
      try {
        body = await readBody(req);
      } catch (e) {
        return sendJSON(res, 400, { error: 'invalid json' });
      }
      const text = String(body.text || '').trim().slice(0, 500);
      if (!text) return sendJSON(res, 400, { error: 'empty comment' });
      if (!store.comments[slug]) store.comments[slug] = [];
      const userComment = {
        id: crypto.randomUUID(),
        author: String(body.author || 'Reader').slice(0, 40) || 'Reader',
        text,
        time: now(),
        timeLabelZh: '剛剛',
        timeLabelEn: 'Just now',
        isUser: true,
      };
      store.comments[slug].push(userComment);
      record('comment_post', { slug, session: body.session, lang: body.lang });
      persist();
      return sendJSON(res, 201, { userComment });
    }
    return sendJSON(res, 405, { error: 'method not allowed' });
  }
  // POST /api/events
  if (pathname === '/api/events' && req.method === 'POST') {
    let body;
    try {
      body = await readBody(req);
    } catch (e) {
      return sendJSON(res, 400, { error: 'invalid json' });
    }
    const type = String(body.type || '');
    const allowed = new Set([
      'view', 'article_view', 'share_click', 'verify_click', 'reveal',
      'comment_post', 'lang_toggle', 'back_to_home',
    ]);
    if (!allowed.has(type)) return sendJSON(res, 400, { error: 'bad type' });
    const evt = record(type, {
      slug: body.slug || null,
      session: body.session || null,
      lang: body.lang || 'zh',
      meta: body.meta || null,
    });
    return sendJSON(res, 201, { ok: true, id: evt.id });
  }
  // POST /api/reset — clear interaction data for a fresh class run.
  if (pathname === '/api/reset' && req.method === 'POST') {
    store.events = [];
    store.comments = {};
    persist();
    return sendJSON(res, 200, { ok: true });
  }
  // GET /api/analytics
  if (pathname === '/api/analytics' && req.method === 'GET') {
    const events = store.events;
    const count = (type) => events.filter((e) => e.type === type).length;
    const views = count('view') + count('article_view');
    const trapClicks = count('share_click') + count('verify_click');
    const reveals = count('reveal');
    const commentPosts = count('comment_post');
    const sessions = new Set(events.map((e) => e.session).filter(Boolean)).size;

    const byArticle = articles.map((a) => {
      const es = events.filter((e) => e.slug === a.slug);
      return {
        slug: a.slug,
        titleZh: a.titleZh,
        views: es.filter((e) => e.type === 'article_view' || e.type === 'view').length,
        trapClicks: es.filter((e) => e.type === 'share_click' || e.type === 'verify_click').length,
        reveals: es.filter((e) => e.type === 'reveal').length,
        comments: es.filter((e) => e.type === 'comment_post').length,
      };
    });

    return sendJSON(res, 200, {
      totals: {
        sessions,
        views,
        trapClicks,
        reveals,
        commentPosts,
        fellForIt: trapClicks + commentPosts,
        revealRate: trapClicks ? Math.round((reveals / trapClicks) * 100) : 0,
      },
      byArticle,
      recent: events.slice(-50).reverse(),
    });
  }
  return sendJSON(res, 404, { error: 'unknown api' });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);
  try {
    if (pathname.startsWith('/api/')) {
      await handleApi(req, res, pathname);
    } else {
      serveStatic(req, res, pathname);
    }
  } catch (e) {
    console.error('Request error:', e);
    if (!res.headersSent) sendJSON(res, 500, { error: 'server error' });
    else res.end();
  }
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ┌──────────────────────────────────────────────┐');
  console.log('  │  Hong Kong 02 — Hong Kong 02 (educational demo)     │');
  console.log('  ├──────────────────────────────────────────────┤');
  console.log(`  │  Portal:     http://localhost:${PORT}             │`);
  console.log(`  │  Dashboard:  http://localhost:${PORT}/dashboard.html`);
  console.log('  └──────────────────────────────────────────────┘');
  console.log('');
});
