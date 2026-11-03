/* Hong Kong 02 homepage: HKT clock, real market indices, breaking ticker, stories. */
(function () {
  'use strict';

  const C = window.Core;
  let articles = [];

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  // ---- HKT clock ----------------------------------------------------------
  (function startClock() {
    function fmt() {
      const d = new Date();
      const date = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Hong_Kong', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      }).format(d);
      const time = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Hong_Kong', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      }).format(d);
      return date + ' · ' + time + ' HKT';
    }
    const tick = () => { const el = $('clock'); if (el) el.textContent = fmt(); };
    tick();
    setInterval(tick, 1000);
  })();

  // ---- live global market indices (rotating grid) -------------------------
  function fmtIdx(price) {
    return Number(price).toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  let marketIndices = [];
  let marketSet = 0;
  function renderMarketSet() {
    const grid = $('market-grid');
    if (!grid) return;
    const set = marketIndices.slice(marketSet * 4, marketSet * 4 + 4);
    grid.innerHTML = set.map((i) =>
      '<div class="market-item">' +
        '<span class="market-name">' + esc(i.name) + '</span>' +
        '<span class="market-value">' + fmtIdx(i.price) + '</span>' +
        '<span class="market-change ' + (i.dir === 'up' ? 'up' : 'down') + '">' +
          (i.changePct >= 0 ? '+' : '') + i.changePct + '%</span>' +
      '</div>'
    ).join('');
    grid.classList.remove('swap');
    void grid.offsetWidth; // restart the float animation
    grid.classList.add('swap');
  }
  function rotateMarket() {
    if (!marketIndices.length) return;
    const sets = Math.ceil(marketIndices.length / 4);
    marketSet = (marketSet + 1) % sets;
    renderMarketSet();
  }
  async function renderMarket() {
    try {
      const m = await C.fetchJSON('/api/ticker');
      marketIndices = m.indices || [];
      if (!marketIndices.length) {
        const grid = $('market-grid');
        if (grid) grid.innerHTML = '<span class="text-xs text-gray-400">Markets unavailable</span>';
        return;
      }
      renderMarketSet();
    } catch (e) {
      const grid = $('market-grid');
      if (grid) grid.innerHTML = '<span class="text-xs text-gray-400">Market data unavailable</span>';
    }
  }

  // ---- breaking ticker ----------------------------------------------------
  function renderBreaking(text) {
    const el = $('breaking-text');
    if (!el) return;
    el.textContent = text;
    const track = $('breaking-ticker');
    // duplicate the inner block so the -50% loop is seamless
    const block = track.querySelector('div');
    if (block && track.querySelectorAll('div').length < 2) {
      track.appendChild(block.cloneNode(true));
    }
  }

  // ---- stories ------------------------------------------------------------
  const COMMENT_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  function engagementHTML(e) {
    if (!e) return '';
    return '<div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-bold text-gray-500">' +
      '<span class="flex items-center gap-1.5">' + COMMENT_ICON + e.comments + ' comments</span>' +
      '<span>👍 ' + e.likes + '</span>' +
      '<span>❤️ ' + e.hearts + '</span>' +
      '<span>😠 ' + e.unhappy + '</span>' +
      '</div>';
  }

  function renderTopStory(a) {
    if (!a) return;
    const href = 'article.html?slug=' + encodeURIComponent(a.slug);
    $('top-img').src = a.image.src;
    $('top-img').alt = a.image.altEn || a.image.altZh || '';
    $('top-img-link').href = href;
    const link = $('top-link');
    link.textContent = a.titleEn || a.titleZh;
    link.href = href;
    $('top-tag').textContent = a.tagEn || a.tagZh || a.categoryEn || '';
    $('top-lede').textContent = a.ledeEn || a.ledeZh || '';
    $('top-engagement').innerHTML = engagementHTML(a.engagement);
    $('top-meta').textContent = (a.bylineEn || '') + ' · ' + (a.timeLabelEn || '');
  }

  function renderLatest(list) {
    $('latest-grid').innerHTML = list.map((a, i) =>
      '<a href="article.html?slug=' + encodeURIComponent(a.slug) + '" class="group flex min-h-0 flex-col justify-between border-b border-gray-200 p-5 transition-colors hover:bg-gray-50 sm:min-h-44 md:border-r lg:border-b-0">' +
        '<span class="text-3xl font-black text-gray-200 transition-colors group-hover:text-brand">0' + (i + 1) + '</span>' +
        '<h3 class="mt-5 text-sm font-extrabold leading-snug text-gray-950 group-hover:text-brand">' + esc(a.titleEn || a.titleZh) + '</h3>' +
      '</a>'
    ).join('');
  }

  function renderStories(list) {
    $('stories-grid').innerHTML = list.map((a) =>
      '<article class="group overflow-hidden border border-gray-200 bg-white">' +
        '<a href="article.html?slug=' + encodeURIComponent(a.slug) + '" class="block">' +
          '<div class="aspect-[16/10] overflow-hidden bg-gray-100">' +
            '<img src="' + esc(a.image.src) + '" alt="" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />' +
          '</div>' +
          '<div class="p-5">' +
            '<div class="mb-3 flex items-center justify-between gap-3">' +
              '<span class="flex items-center gap-2"><span class="cat-badge">' + esc(a.stem || '') + '</span><span class="text-xs font-black uppercase tracking-widest text-brand">' + esc(a.tagEn || a.tagZh) + '</span></span>' +
              '<span class="text-xs font-semibold text-gray-400">' + esc(a.timeLabelEn || a.timeLabelZh) + '</span>' +
            '</div>' +
            '<h3 class="text-xl font-black leading-snug text-gray-950 transition-colors group-hover:text-brand">' + esc(a.titleEn || a.titleZh) + '</h3>' +
            '<p class="mt-3 text-sm font-medium leading-6 text-gray-600">' + esc(a.ledeEn || a.ledeZh || '') + '</p>' +
            engagementHTML(a.engagement) +
          '</div>' +
        '</a>' +
      '</article>'
    ).join('');
  }

  // ---- world markets hover panel -----------------------------------------
  let worldData = null;
  let worldMapLoaded = false;
  let wmRegion = 'Asia-Pacific';
  let wmHideTimer = null;
  const C3_TO_C2 = {
    USA: 'us', DEU: 'de', ITA: 'it', HKG: 'hk', BRA: 'br', MEX: 'mx', KOR: 'kr',
    GBR: 'gb', JPN: 'jp', FRA: 'fr', IND: 'in', CHN: 'cn', CHE: 'ch', CAN: 'ca',
    TWN: 'tw', AUS: 'au', ESP: 'es', NLD: 'nl', BEL: 'be', SWE: 'se', NOR: 'no',
    DNK: 'dk', FIN: 'fi', AUT: 'at', IRL: 'ie', PRT: 'pt', GRC: 'gr', POL: 'pl',
    CZE: 'cz', HUN: 'hu', RUS: 'ru', TUR: 'tr', ZAF: 'za', SAU: 'sa', ARE: 'ae',
    ISR: 'il', EGY: 'eg', NGA: 'ng', ARG: 'ar', CHL: 'cl', COL: 'co', PER: 'pe',
    NZL: 'nz', SGP: 'sg', MYS: 'my', THA: 'th', IDN: 'id', PHL: 'ph', VNM: 'vn',
    PAK: 'pk', BGD: 'bd', LKA: 'lk',
  };
  function wmMoney(n) { return Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }); }
  function wmPct(n) { return (n >= 0 ? '+' : '') + Number(n).toFixed(2) + '%'; }

  async function loadWorldMarkets() {
    if (worldData) return worldData;
    try {
      worldData = await C.fetchJSON('/api/world-markets');
    } catch (e) {
      worldData = { indices: [], error: String(e) };
    }
    return worldData;
  }

  function renderWorldTable(region) {
    const body = $('wm-body');
    if (!body) return;
    const rows = ((worldData && worldData.indices) || []).filter((i) => i.region === region);
    body.innerHTML = rows.length ? rows.map((i) =>
      '<tr class="' + (i.dir === 'up' ? 'up' : 'down') + '">' +
        '<td class="wm-name">' + esc(i.name) + '</td>' +
        '<td class="wm-country">' + esc(i.country) + '</td>' +
        '<td class="num wm-price">' + wmMoney(i.price) + '</td>' +
        '<td class="num wm-change">' + (i.change >= 0 ? '+' : '') + wmMoney(i.change) + '</td>' +
        '<td class="num wm-pct">' + wmPct(i.changePct) + ' <span class="wm-arrow">' + (i.dir === 'up' ? '▲' : '▼') + '</span></td>' +
      '</tr>'
    ).join('') : '<tr><td colspan="5" class="wm-empty">No data available</td></tr>';
    const updated = $('wm-updated');
    const stamp = worldData && (worldData.lastUpdated || worldData.updatedAt);
    if (updated && stamp) {
      updated.textContent = 'Last quote ' + new Date(stamp).toLocaleString('en-GB', { timeZone: 'Asia/Hong_Kong', hour12: false }) + ' HKT · CNN Markets';
    }
  }

  async function loadWorldMap() {
    if (worldMapLoaded) return;
    worldMapLoaded = true;
    try {
      const res = await fetch('/images/world-map.svg');
      $('wm-map').innerHTML = await res.text();
      colorWorldMap();
    } catch (e) { /* ignore */ }
  }

  function colorWorldMap() {
    const map = $('wm-map');
    if (!map) return;
    const byCountry = {};
    ((worldData && worldData.indices) || []).forEach((i) => {
      const cc = i.countryCode;
      if (!cc) return;
      (byCountry[cc] = byCountry[cc] || []).push(i.changePct);
    });
    map.querySelectorAll('path[id]').forEach((p) => {
      const id = p.getAttribute('id');
      const cc = Object.keys(C3_TO_C2).find((k) => C3_TO_C2[k] === id);
      const vals = cc ? byCountry[cc] : null;
      if (!vals || !vals.length) { p.style.fill = '#d7d9dd'; return; }
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      p.style.fill = avg > 0.05 ? '#0f7a52' : avg < -0.05 ? '#c8202c' : '#b9bdc4';
    });
  }

  async function openWorldPanel() {
    const panel = $('wm-panel');
    if (!panel) return;
    clearTimeout(wmHideTimer);
    panel.hidden = false;
    await loadWorldMarkets();
    renderWorldTable(wmRegion);
    loadWorldMap().then(() => colorWorldMap());
  }
  function closeWorldPanelSoon() {
    clearTimeout(wmHideTimer);
    wmHideTimer = setTimeout(() => {
      const p = $('wm-panel');
      if (p) p.hidden = true;
    }, 200);
  }

  function bindWorldMarkets() {
    const strip = $('market-strip');
    if (strip) {
      strip.addEventListener('mouseenter', openWorldPanel);
      strip.addEventListener('mouseleave', closeWorldPanelSoon);
    }
    const panel = $('wm-panel');
    if (panel) {
      panel.addEventListener('mouseenter', () => clearTimeout(wmHideTimer));
      panel.addEventListener('mouseleave', closeWorldPanelSoon);
    }
    const close = $('wm-close');
    if (close) close.addEventListener('click', () => { const p = $('wm-panel'); if (p) p.hidden = true; });
    const tabs = $('wm-tabs');
    if (tabs) {
      tabs.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-region]');
        if (!btn) return;
        wmRegion = btn.getAttribute('data-region');
        tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
        if (worldData) renderWorldTable(wmRegion);
      });
    }
    window.setInterval(async () => {
      if (!panel || panel.hidden) return;
      worldData = null;
      await loadWorldMarkets();
      renderWorldTable(wmRegion);
      colorWorldMap();
    }, 60000);
  }

  async function init() {
    renderMarket();
    bindWorldMarkets();
    if (new URLSearchParams(location.search).get('markets') === '1') openWorldPanel();
    setInterval(renderMarket, 60000);
    setInterval(rotateMarket, 5000);

    try {
      const data = await C.fetchJSON('/api/articles');
      articles = data.articles || [];
      const top = articles.find((a) => a.breaking) || articles[0];
      const rest = articles.filter((a) => a.slug !== top.slug);
      renderTopStory(top);
      renderStories(rest);
    } catch (e) {
      const grid = $('stories-grid');
      if (grid) grid.innerHTML = '<p class="p-5 text-sm text-gray-500">' + esc(String(e)) + '</p>';
    }

    C.track('view');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
