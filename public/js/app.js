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

  // ---- live global market indices (slow floating marquee) ------------------
  function fmtIdx(price) {
    return Number(price).toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  let marketIndices = [];
  function marketItemHTML(i) {
    return '<span class="market-item">' +
      '<span class="market-name">' + esc(i.name) + '</span>' +
      '<span class="market-value">' + fmtIdx(i.price) + '</span>' +
      '<span class="market-change ' + (i.dir === 'up' ? 'up' : 'down') + '">' +
        (i.changePct >= 0 ? '+' : '') + i.changePct + '%</span>' +
    '</span>';
  }
  async function renderMarket() {
    const track = $('market-track');
    if (!track) return;
    try {
      const m = await C.fetchJSON('/api/ticker');
      marketIndices = m.indices || [];
      if (!marketIndices.length) {
        track.innerHTML = '<span class="market-item"><span class="market-name">Markets unavailable</span></span>';
        return;
      }
      const items = marketIndices.map(marketItemHTML).join('');
      track.innerHTML = items + items; // duplicated for a seamless -50% loop
    } catch (e) {
      track.innerHTML = '<span class="market-item"><span class="market-name">Market data unavailable</span></span>';
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
    const topCta = $('top-cta');
    if (topCta) topCta.href = href;
    const topNew = $('top-new');
    if (topNew) {
      if (!readSet().has(a.slug)) {
        topNew.innerHTML = 'New !'.split('').map((ch, i) => '<span class="wave-letter" style="animation-delay:' + (i * 0.09) + 's">' + (ch === ' ' ? '&nbsp;' : ch) + '</span>').join('');
        topNew.style.display = '';
      } else {
        topNew.style.display = 'none';
      }
    }
    const topShare = $('top-share');
    if (topShare) {
      topShare.setAttribute('data-slug', a.slug);
      topShare.onclick = () => openShare(a.slug);
    }
  }

  function renderLatest(list) {
    $('latest-grid').innerHTML = list.map((a, i) =>
      '<a href="article.html?slug=' + encodeURIComponent(a.slug) + '" class="group flex min-h-0 flex-col justify-between border-b border-gray-200 p-5 transition-colors hover:bg-gray-50 sm:min-h-44 md:border-r lg:border-b-0">' +
        '<span class="text-3xl font-black text-gray-200 transition-colors group-hover:text-brand">0' + (i + 1) + '</span>' +
        '<h3 class="mt-5 text-sm font-extrabold leading-snug text-gray-950 group-hover:text-brand">' + esc(a.titleEn || a.titleZh) + '</h3>' +
      '</a>'
    ).join('');
  }

  function readSet() {
    try { return new Set(JSON.parse(localStorage.getItem('hk02-read') || '[]')); } catch (e) { return new Set(); }
  }
  const SHARE_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>';
  const CTA_ARROW = '<svg class="story-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>';

  function renderStories(list) {
    const read = readSet();
    $('stories-grid').innerHTML = list.map((a) => {
      const isNew = !read.has(a.slug);
      return '<article class="story-card" data-slug="' + esc(a.slug) + '">' +
        '<a href="article.html?slug=' + encodeURIComponent(a.slug) + '" class="story-link">' +
          '<div class="story-img"><img src="' + esc(a.image.src) + '" alt="' + esc(a.image.altEn || '') + '" loading="lazy" /></div>' +
          '<div class="p-5 story-body">' +
            '<div class="mb-3 flex items-center justify-between gap-3">' +
              '<span class="flex items-center gap-2"><span class="cat-badge">' + esc(a.stem || '') + '</span><span class="story-tag">' + esc(a.tagEn || a.tagZh) + '</span></span>' +
              '<span class="story-time">' + esc(a.timeLabelEn || a.timeLabelZh) + '</span>' +
            '</div>' +
            '<h3 class="story-title">' + esc(a.titleEn || a.titleZh) + '</h3>' +
            '<p class="story-hook">' + esc(a.ledeEn || a.ledeZh || '') + '</p>' +
            engagementHTML(a.engagement) +
            '<div class="story-foot">' +
              (isNew ? '<span class="story-new">' + 'New !'.split('').map((ch, i) => '<span class="wave-letter" style="animation-delay:' + (i * 0.09) + 's">' + (ch === ' ' ? '&nbsp;' : ch) + '</span>').join('') + '</span>' : '<span></span>') +
              '<span class="story-cta">Click to read the full article ' + CTA_ARROW + '</span>' +
            '</div>' +
          '</div>' +
        '</a>' +
        '<button type="button" class="story-share" data-slug="' + esc(a.slug) + '" aria-label="Share this article">' + SHARE_ICON + 'Share</button>' +
      '</article>';
    }).join('');
    bindStoryShares();
  }

  function bindStoryShares() {
    document.querySelectorAll('.story-share').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openShare(btn.getAttribute('data-slug'));
      });
    });
  }

  // ---- share dialog (confirm, then warning) ------------------------------
  let shareSlug = null;
  function fillShareWarning(a) {
    const real = !!a.real;
    $('share-warning-title').textContent = real
      ? 'Yes this is a real new article from a local report !'
      : 'Be careful !';
    $('share-ai-intro').style.display = '';
    $('share-tips').style.display = 'none';
    $('share-warn-5-item').style.display = real ? 'none' : '';
    $('share-back-tips').style.display = '';
    $('share-ai-title').textContent = real
      ? 'Even real news can be twisted by AI.'
      : 'You were about to share a simulated news story.';
    $('share-ai-text').textContent = real
      ? 'This article is a real report, but AI can create convincing fake versions of real events — altered photos, invented quotes, cloned voices and video. Check the source and the details before you share.'
      : 'This article was created for media-literacy education by using AI. AI is an effective tool for creating fake news — it can generate realistic text, images, audio and video at scale, and it can imitate real outlets, people and events.';
    if (real) {
      $('share-warn-1-title').textContent = 'Source and author';
      $('share-warn-1-text').textContent = a.warningSource || '';
      $('share-warn-2-title').textContent = 'What the report says';
      $('share-warn-2-text').textContent = a.warningReport || '';
      $('share-warn-3-title').textContent = 'Why it checks out';
      $('share-warn-3-text').textContent = a.warningWhy || '';
      $('share-warn-4-title').textContent = 'Before you share';
      $('share-warn-4-text').textContent = a.warningPause || '';
    } else {
      $('share-warn-1-title').textContent = 'Image and context';
      $('share-warn-1-text').textContent = a.warningImage || '';
      $('share-warn-2-title').textContent = 'Source and author';
      $('share-warn-2-text').textContent = a.warningSource || '';
      $('share-warn-3-title').textContent = 'Manipulation tactics';
      $('share-warn-3-text').textContent = a.warningAi || '';
      $('share-warn-4-title').textContent = 'Emotional triggers';
      $('share-warn-4-text').textContent = a.warningEmotion || '';
      $('share-warn-5-title').textContent = 'Before you share';
      $('share-warn-5-text').textContent = a.warningPause || '';
    }
    $('share-warn-stop').textContent = a.warningStop || '';
    $('share-warn-verify').textContent = a.warningVerify || '';
    $('share-warn-think').textContent = a.warningThink || '';
  }
  async function openShare(slug) {
    if (!slug) return;
    shareSlug = slug;
    try {
      const data = await C.fetchJSON('/api/articles/' + encodeURIComponent(slug));
      fillShareWarning(data.article || {});
    } catch (e) { /* ignore */ }
    $('share-backdrop').classList.add('open');
    $('share-confirm').classList.add('open');
    C.track('share_click', { slug: shareSlug });
  }
  function showShareWarning() {
    $('share-confirm').classList.remove('open');
    $('share-warning').classList.add('open');
    C.track('reveal', { slug: shareSlug });
  }
  function closeShare() {
    $('share-backdrop').classList.remove('open');
    $('share-confirm').classList.remove('open');
    $('share-warning').classList.remove('open');
  }
  function bindShareDialog() {
    $('share-confirm-continue').addEventListener('click', showShareWarning);
    $('share-confirm-cancel').addEventListener('click', closeShare);
    $('share-confirm-x').addEventListener('click', closeShare);
    $('share-warning-x').addEventListener('click', closeShare);
    $('share-backdrop').addEventListener('click', closeShare);
    $('share-extra-tips').addEventListener('click', () => {
      $('share-ai-intro').style.display = 'none';
      $('share-tips').style.display = '';
      const sc = $('share-warning').querySelector('.popup-scroll');
      if (sc) sc.scrollTop = 0;
    });
    $('share-back-tips').addEventListener('click', () => {
      $('share-tips').style.display = 'none';
      $('share-ai-intro').style.display = '';
      const sc = $('share-warning').querySelector('.popup-scroll');
      if (sc) sc.scrollTop = 0;
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeShare(); });
  }

  // ---- live preview: auto-reload when files change (?preview=1) -----------
  async function startPreviewWatch() {
    let current = null;
    try {
      const v = await C.fetchJSON('/api/version');
      current = v.version;
    } catch (e) { return; }
    window.setInterval(async () => {
      try {
        const v = await C.fetchJSON('/api/version');
        if (v.version && v.version !== current) window.location.reload();
      } catch (e) { /* ignore */ }
    }, 2000);
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

  // ---- idle reminder + leave prompt ---------------------------------------
  let idleTimer = null;
  let leavingToArticle = false;
  function showIdleReminder() {
    if (readSet().size > 0) return;
    try {
      if (sessionStorage.getItem('hk02-idle') === '1') return;
      sessionStorage.setItem('hk02-idle', '1');
    } catch (e) { /* storage blocked: still show once */ }
    $('idle-backdrop').classList.add('open');
    $('idle-reminder').classList.add('open');
    C.track('idle_reminder');
  }
  function closeIdle() {
    $('idle-backdrop').classList.remove('open');
    $('idle-reminder').classList.remove('open');
  }
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = window.setTimeout(showIdleReminder, 60000);
  }
  function bindIdle() {
    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach((ev) => {
      window.addEventListener(ev, resetIdle, { passive: true });
    });
    $('idle-x').addEventListener('click', closeIdle);
    $('idle-backdrop').addEventListener('click', closeIdle);
    $('idle-later').addEventListener('click', closeIdle);
    $('idle-browse').addEventListener('click', () => {
      closeIdle();
      const grid = $('stories-grid');
      if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    resetIdle();
  }
  let pendingLeaveUrl = null;
  function closeLeave() {
    $('leave-backdrop').classList.remove('open');
    $('leave-modal').classList.remove('open');
  }
  function bindLeavePrompt() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (href.indexOf('article.html') !== -1) { leavingToArticle = true; return; }
      if (!href || href.charAt(0) === '#' || href === '/' || href === 'index.html' || a.target === '_blank') return;
      if (readSet().size > 0) return;
      e.preventDefault();
      pendingLeaveUrl = a.href;
      $('leave-backdrop').classList.add('open');
      $('leave-modal').classList.add('open');
    }, true);
    $('leave-x').addEventListener('click', closeLeave);
    $('leave-backdrop').addEventListener('click', closeLeave);
    $('leave-stay').addEventListener('click', () => {
      closeLeave();
      const grid = $('stories-grid');
      if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('leave-go').addEventListener('click', () => {
      leavingToArticle = true;
      window.location.href = pendingLeaveUrl || '/';
    });
    // Exit intent: pointer leaves through the top of the window (towards the
    // tab bar / close button). Show the branded prompt while we still can.
    let exitShown = false;
    document.addEventListener('mouseout', (e) => {
      if (e.relatedTarget) return;
      if (e.clientY > 0) return;
      if (leavingToArticle || exitShown) return;
      if (readSet().size > 0) return;
      exitShown = true;
      $('leave-backdrop').classList.add('open');
      $('leave-modal').classList.add('open');
    });
    // Chrome, Firefox and Safari only show the "Leave site?" dialog after the
    // visitor has interacted with the page, so arm the handler on the first
    // gesture (pointer, key, touch or click).
    let leaveArmed = false;
    function onBeforeUnload(e) {
      if (leavingToArticle) return;
      if (readSet().size > 0) return;
      e.preventDefault();
      e.returnValue = 'Read at least one article before you leave!';
      return e.returnValue;
    }
    function armLeavePrompt() {
      if (leaveArmed) return;
      leaveArmed = true;
      window.addEventListener('beforeunload', onBeforeUnload);
    }
    ['pointerdown', 'keydown', 'touchstart', 'click'].forEach((ev) => {
      window.addEventListener(ev, armLeavePrompt, { once: true, passive: true });
    });
  }

  async function init() {
    bindIdle();
    bindLeavePrompt();
    renderMarket();
    bindWorldMarkets();
    bindShareDialog();
    if (new URLSearchParams(location.search).get('markets') === '1') openWorldPanel();
    const shareParam = new URLSearchParams(location.search).get('share');
    if (shareParam) {
      openShare(shareParam).then(() => {
        const q = new URLSearchParams(location.search);
        if (q.get('warn') === '1') showShareWarning();
        if (q.get('extratips') === '1' && q.get('warn') === '1') {
          $('share-ai-intro').style.display = 'none';
          $('share-tips').style.display = '';
        }
      });
    }
    if (new URLSearchParams(location.search).get('leave') === '1') {
      $('leave-backdrop').classList.add('open');
      $('leave-modal').classList.add('open');
    }
    if (new URLSearchParams(location.search).get('preview') === '1') startPreviewWatch();
    setInterval(renderMarket, 60000);

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
