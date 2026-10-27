/* Educator dashboard: aggregate interaction analytics. */
(function () {
  'use strict';

  const C = window.Core;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const TYPE_LABELS = {
    view: ['首頁瀏覽', 'Home view'],
    article_view: ['文章瀏覽', 'Article view'],
    share_click: ['分享點擊（陷阱）', 'Share click (trap)'],
    verify_click: ['驗證點擊（陷阱）', 'Verify click (trap)'],
    reveal: ['揭穿 AI', 'AI reveal'],
    comment_post: ['留言（陷阱）', 'Comment (trap)'],
    lang_toggle: ['切換語言', 'Language toggle'],
    back_to_home: ['返回首頁', 'Back to home'],
  };

  function stat(label, value, cls) {
    return '<div class="stat"><div class="label">' + esc(label) + '</div><div class="value ' + (cls || '') + '">' + value + '</div></div>';
  }

  async function render() {
    let data;
    try {
      data = await C.fetchJSON('/api/analytics');
    } catch (e) {
      $('stat-grid').innerHTML = '<div class="empty">' + esc(String(e)) + '</div>';
      return;
    }
    const t = data.totals;
    const L = C.getLang();

    const cards = [
      stat(L === 'en' ? 'Sessions' : '參與人數', t.sessions),
      stat(L === 'en' ? 'Views' : '瀏覽次數', t.views),
      stat(L === 'en' ? 'Fell for it (trap)' : '誤信（陷阱觸發）', t.fellForIt, 'red'),
      stat(L === 'en' ? 'Reveals' : '已揭穿', t.reveals),
      stat(L === 'en' ? 'Comments posted' : '留言數', t.commentPosts),
      stat(L === 'en' ? 'Reveal rate' : '揭穿率', t.revealRate + '%'),
    ];
    $('stat-grid').innerHTML = cards.join('');

    // Per-article table
    $('article-table').innerHTML = data.byArticle.map((a) =>
      '<tr>' +
        '<td>' + esc(L === 'en' ? (a.titleEn || a.titleZh) : a.titleZh) + '</td>' +
        '<td class="num">' + a.views + '</td>' +
        '<td class="num">' + a.trapClicks + '</td>' +
        '<td class="num">' + a.reveals + '</td>' +
        '<td class="num">' + a.comments + '</td>' +
      '</tr>'
    ).join('') || '<tr><td colspan="5" class="empty">—</td></tr>';

    // Recent events
    if (!data.recent.length) {
      $('event-list').innerHTML = '<div class="empty">' + (L === 'en' ? 'No events yet. Open the site in another tab and interact.' : '暫無事件。可在另一分頁開啟網站並互動。') + '</div>';
    } else {
      $('event-list').innerHTML = data.recent.slice(0, 60).map((e) => {
        const lab = TYPE_LABELS[e.type] || [e.type, e.type];
        const when = new Date(e.ts).toLocaleTimeString(L === 'en' ? 'en-HK' : 'zh-Hant-HK', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return '<div class="event-row"><span class="etype">' + esc(L === 'en' ? lab[1] : lab[0]) + '</span> · ' +
          (e.slug ? esc(e.slug) + ' · ' : '') + esc(when) + '</div>';
      }).join('');
    }
  }

  function bindLang() {
    document.querySelectorAll('[data-lang-btn]').forEach((b) => {
      b.addEventListener('click', () => {
        C.setLang(b.getAttribute('data-lang-btn'));
        render();
      });
    });
  }

  function init() {
    C.localizeDom();
    bindLang();
    render();

    $('refresh').addEventListener('click', render);
    $('reset').addEventListener('click', async () => {
      if (!confirm(C.getLang() === 'en' ? 'Clear ALL interaction data? This cannot be undone.' : '確定清除所有互動數據？此操作無法復原。')) return;
      try {
        await C.fetchJSON('/api/reset', { method: 'POST' });
        render();
      } catch (e) { /* ignore */ }
    });

    // Light auto-refresh for a live dashboard.
    setInterval(render, 5000);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
