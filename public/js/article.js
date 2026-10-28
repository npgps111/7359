/* Article detail: render story, run the AI Ethics Inspector reveal + comment trap. */
(function () {
  'use strict';

  const C = window.Core;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  let slug = new URLSearchParams(location.search).get('slug');
  let article = null;

  const ICON_WA = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
  const ICON_FB = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>';
  const ICON_TH = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z"/></svg>';
  const ICON_SHARE = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>';
  const ICON_MSG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>';
  const ICON_AT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg>';
  const ICON_COMMENT = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  const ICON_CHEVRON = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
  const ICON_THUMB = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>';

  // ---- (topbar clock/weather removed for the Hong Kong 02 layout) ---------------

  // ---- article rendering --------------------------------------------------
  function renderArticle() {
    const a = article;
    const body = C.getLang() === 'en' ? a.bodyEn : a.bodyZh;

    const html =
      '<div class="article-cat">' + esc(C.pick(a.categoryZh, a.categoryEn)) + '</div>' +
      '<h1 class="article-title">' + esc(C.pick(a.titleZh, a.titleEn)) + '</h1>' +
      '<div class="article-meta">' +
        '<span class="byline">' + esc(C.pick(a.bylineZh, a.bylineEn)) + '</span>' +
        '<span class="sep">|</span>' +
        '<span>' + esc(C.pick(a.timeLabelZh, a.timeLabelEn)) + '</span>' +
        '<span class="sep">|</span>' +
        '<span>' + C.fmt(a.viewCount) + ' ' + C.t('article.views') + '</span>' +
      '</div>' +
      '<figure class="hero-figure" id="hero-figure">' +
        '<img src="' + esc(a.image.src) + '" alt="' + esc(C.pick(a.image.altZh, a.image.altEn)) + '" />' +
      '</figure>' +
      '<div class="share-block">' +
        '<div class="share-intro">' +
          '<div class="share-title">' + ICON_SHARE + 'Share this article</div>' +
          '<p class="share-sub">Choose a platform to continue.</p>' +
        '</div>' +
        '<div class="share-actions">' +
          '<button class="share-outline" data-action="share_click">' + ICON_MSG + 'WhatsApp</button>' +
          '<button class="share-outline" data-action="share_click">' + ICON_AT + 'Threads</button>' +
          '<button class="share-outline" data-action="share_click">' + ICON_FB + 'Facebook</button>' +
        '</div>' +
      '</div>' +
      '<div class="article-body">' + body.map((p) => '<p>' + esc(p) + '</p>').join('') + '</div>';

    const commentsCount = (a.engagement && a.engagement.comments) || 0;
    $('article-container').innerHTML = html +
      '<section class="comments">' +
        '<button type="button" class="comments-toggle" id="comments-toggle" aria-expanded="false" aria-controls="comments-body">' +
          '<span class="comments-toggle-left">' +
            '<span class="comments-icon">' + ICON_COMMENT + '</span>' +
            '<span>' +
              '<span class="comments-title">' + C.t('article.comments') + ' (' + commentsCount + ')</span>' +
              '<span class="comments-hint" id="comments-hint">Click to see all comments</span>' +
            '</span>' +
          '</span>' +
          '<span class="comments-chevron" id="comments-chevron">' + ICON_CHEVRON + '</span>' +
        '</button>' +
        '<div class="comments-body" id="comments-body" hidden>' +
          '<div class="comment-list" id="comment-list"></div>' +
          '<div class="comment-form">' +
            '<input id="comment-input" placeholder="Write a comment…" maxlength="500" />' +
            '<button id="comment-post">' + C.t('article.commentPost') + '</button>' +
          '</div>' +
        '</div>' +
      '</section>';

    const commentsToggle = $('comments-toggle');
    if (commentsToggle) {
      commentsToggle.addEventListener('click', () => {
        const body = $('comments-body');
        const opening = body.hasAttribute('hidden');
        if (opening) body.removeAttribute('hidden'); else body.setAttribute('hidden', '');
        commentsToggle.setAttribute('aria-expanded', opening ? 'true' : 'false');
        $('comments-hint').textContent = opening ? 'Click to hide the comments' : 'Click to see all comments';
        $('comments-chevron').classList.toggle('open', opening);
      });
    }

    document.title = C.pick(a.titleZh, a.titleEn) + ' — Hong Kong 02';
    bindArticleActions();
    C.localizeDom();
  }

  function commentHTML(c) {
    const author = C.getLang() === 'en' && c.authorEn ? c.authorEn : c.author;
    const time = C.pick(c.timeLabelZh, c.timeLabelEn);
    const cls = c.isUser ? 'user' : '';
    const initial = esc((author || '?').trim().charAt(0).toUpperCase());
    const likes = typeof c.likes === 'number' ? c.likes : 0;
    return (
      '<div class="comment ' + cls + '">' +
        '<div class="avatar">' + initial + '</div>' +
        '<div class="c-body">' +
          '<div class="c-head"><span class="c-author">' + esc(author) + '</span><span class="c-time">' + esc(time) + '</span></div>' +
          '<div class="c-text">' + esc(c.text) + '</div>' +
          '<div class="c-likes">' + ICON_THUMB + ' ' + likes + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // A random number of extra reader comments appear each time the article is
  // opened again, simulating a live, growing thread.
  const EXTRA_POOL = [
    { author: 'AnnaW', text: 'Anyone got a link to the original source? I can\u2019t find it anywhere.' },
    { author: 'hk_student', text: 'My group chat is going crazy over this. Is there any official confirmation?' },
    { author: 'factchecker', text: 'Please verify before sharing \u2014 there\u2019s already too much misinformation around.' },
    { author: 'lensguy', text: 'The photo looks off to me. Zoom in on the edges and you\u2019ll see it.' },
    { author: 'CyrusL', text: 'I\u2019m not convinced. The details don\u2019t add up at all.' },
    { author: 'pixelpanda', text: 'This is wild. Where did the screenshots actually come from?' },
    { author: 'thomas_hk', text: 'Finally someone is talking about this. Been waiting all day.' },
    { author: 'qwerty', text: 'Can a mod pin the facts here? The comments are all over the place.' },
  ];
  function randomExtras() {
    const n = Math.floor(Math.random() * 4); // 0-3 extra comments
    const shuffled = EXTRA_POOL.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n).map((c) => ({
      author: c.author,
      text: c.text,
      timeLabelZh: '數分鐘前',
      timeLabelEn: 'A few minutes ago',
    }));
  }

  async function renderComments() {
    try {
      const data = await C.fetchJSON('/api/comments/' + slug);
      $('comment-list').innerHTML = data.comments.map(commentHTML).join('');
    } catch (e) {
      $('comment-list').innerHTML = '';
    }
  }

  // ---- Educational popup (triggered by Share) -----------------------------
  function renderPopup() {
    $('popup-title').textContent = C.pick(article.popupTitleZh, article.popupTitleEn);
    $('popup-why').textContent = C.pick(article.popupWhyZh, article.popupWhyEn);
    $('popup-body').textContent = C.pick(article.popupBodyZh, article.popupBodyEn);
  }

  function openInspector() {
    renderPopup();
    $('inspector-backdrop').classList.add('open');
    $('inspector').classList.add('open');
    C.track('reveal', { slug });
  }
  function closeInspector() {
    $('inspector-backdrop').classList.remove('open');
    $('inspector').classList.remove('open');
  }

  function bindArticleActions() {
    document.querySelectorAll('.share-btn').forEach((b) => {
      b.addEventListener('click', () => {
        C.track(b.getAttribute('data-action'), { slug });
        openInspector();
      });
    });
    $('comment-post').addEventListener('click', postComment);
    $('comment-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') postComment(); });
  }

  async function postComment() {
    const input = $('comment-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    try {
      const res = await C.fetchJSON('/api/comments/' + slug, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, author: C.getLang() === 'en' ? 'You' : '你', session: C.SID, lang: C.getLang() }),
      });
      const list = $('comment-list');
      list.insertAdjacentHTML('beforeend', commentHTML(res.userComment));
    } catch (e) { /* ignore */ }
  }

  async function init() {
    $('inspector-close').addEventListener('click', closeInspector);
    $('inspector-backdrop').addEventListener('click', closeInspector);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeInspector(); });

    if (!slug) {
      $('article-container').innerHTML = '<div class="empty">404 — article not found</div>';
      return;
    }
    try {
      const data = await C.fetchJSON('/api/articles/' + slug);
      article = data.article;
      renderArticle();
      renderComments();
      C.track('article_view', { slug });
      // Preview helper: /article.html?slug=…&popup=1 opens the popup immediately.
      if (new URLSearchParams(location.search).get('popup') === '1') openInspector();
    } catch (e) {
      $('article-container').innerHTML = '<div class="empty">' + esc(String(e)) + '</div>';
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
