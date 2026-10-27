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
      return 'Hong Kong · ' + date + ' · ' + time + ' HKT';
    }
    const tick = () => { const el = $('clock'); if (el) el.textContent = fmt(); };
    tick();
    setInterval(tick, 1000);
  })();

  // ---- real market indices (slow marquee) ---------------------------------
  function fmtIdx(price) {
    return Number(price).toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  async function renderMarket() {
    const hsiEl = $('mkt-hsi');
    const chgEl = $('mkt-chg');
    const scroll = $('market-scroll');
    try {
      const m = await C.fetchJSON('/api/ticker');
      if (!m.indices || !m.indices.length) {
        hsiEl.textContent = '—'; chgEl.textContent = ''; scroll.innerHTML = '';
        return;
      }
      const hsi = m.indices.find((i) => i.symbol === 'HSI-HKX:D') || m.indices[0];
      hsiEl.textContent = fmtIdx(hsi.price);
      chgEl.textContent = (hsi.changePct >= 0 ? '+' : '') + hsi.changePct + '%';
      chgEl.className = 'tabular-nums ' + (hsi.dir === 'up' ? 'text-red-600' : 'text-green-700');
      const items = m.indices.map((i) =>
        '<span class="mr-9 whitespace-nowrap text-[13px] text-gray-700"><b class="text-gray-950">' +
          esc(i.name) + '</b> ' + fmtIdx(i.price) +
          ' <i class="not-italic ' + (i.dir === 'up' ? 'text-red-600' : 'text-green-700') + '">' +
          (i.changePct >= 0 ? '+' : '') + i.changePct + '%</i></span>'
      ).join('');
      scroll.innerHTML = items + items; // duplicated for a seamless -50% loop
    } catch (e) {
      hsiEl.textContent = '—'; chgEl.textContent = '';
      scroll.innerHTML = '<span class="text-[13px] text-gray-400">Market data unavailable</span>';
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
              '<span class="text-xs font-black uppercase tracking-widest text-brand">' + esc(a.tagEn || a.tagZh) + '</span>' +
              '<span class="text-xs font-semibold text-gray-400">' + esc(a.timeLabelEn || a.timeLabelZh) + '</span>' +
            '</div>' +
            '<h3 class="text-xl font-black leading-snug text-gray-950 transition-colors group-hover:text-brand">' + esc(a.titleEn || a.titleZh) + '</h3>' +
          '</div>' +
        '</a>' +
      '</article>'
    ).join('');
  }

  async function init() {
    renderMarket();
    setInterval(renderMarket, 60000);

    try {
      const data = await C.fetchJSON('/api/articles');
      articles = data.articles || [];
      const top = articles.find((a) => a.breaking) || articles[0];
      const rest = articles.filter((a) => a.slug !== top.slug);
      renderTopStory(top);
      renderStories(rest);
      $('view-all').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    } catch (e) {
      const grid = $('stories-grid');
      if (grid) grid.innerHTML = '<p class="p-5 text-sm text-gray-500">' + esc(String(e)) + '</p>';
    }

    C.track('view');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
