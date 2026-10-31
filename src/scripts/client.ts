import { marked } from 'marked';

/* ========== 工具 ========== */
function $(sel: string, root: ParentNode = document): HTMLElement | null {
  return root.querySelector(sel);
}
function $$(sel: string, root: ParentNode = document): HTMLElement[] {
  return Array.from(root.querySelectorAll(sel));
}
function store(key: string, value: string | null) {
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, value);
}
function fmtTime(sec: number): string {
  if (!Number.isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* ========== 主题 ========== */
const THEMES = ['light', 'dark', 'system'] as const;
type Theme = (typeof THEMES)[number];
function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}
function applyTheme(theme: Theme) {
  store('theme', theme);
  document.documentElement.classList.toggle('dark', resolveTheme(theme) === 'dark');
  syncThemeButtons(theme);
  syncThemeIcon(theme);
}
function currentTheme(): Theme {
  return (localStorage.getItem('theme') as Theme) || 'system';
}
function syncThemeButtons(theme: Theme) {
  $$('[data-theme-btn]').forEach((btn) => {
    btn.classList.toggle('btn-theme-active', btn.dataset.themeBtn === theme);
  });
}
function syncThemeIcon(theme: Theme) {
  const icon = $('[data-action="theme"] svg');
  if (!icon) return;
  const dark = resolveTheme(theme) === 'dark';
  icon.innerHTML = dark
    ? '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>'
    : '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
}

/* ========== 面板：按需水合 ========== */
let searchBooted = false;
let settingsBooted = false;
function openPanelBox(panelId: string, backdropId: string) {
  const panel = $(panelId);
  const backdrop = $(backdropId);
  if (!panel) return;
  panel.classList.add('open');
  backdrop?.classList.add('open');
}
function closePanels() {
  $$('#search-panel.open, #settings-panel.open').forEach((p) => p.classList.remove('open'));
  $$('#search-backdrop.open, #settings-backdrop.open').forEach((b) => b.classList.remove('open'));
}
// 搜索：首次打开搜索浮层时才绑定输入并加载索引
function bootSearch() {
  if (searchBooted) return;
  searchBooted = true;
  bindSearch('#search-input', '#search-results', '#search-empty');
  bindSearch('#page-search-input', '#page-search-results', '#page-search-empty');
  loadIndex();
  setTimeout(() => ($('#search-input') as HTMLInputElement)?.focus(), 60);
}
// 设置：首次打开设置面板时才绑定面板内控件
function bootSettings() {
  if (settingsBooted) return;
  settingsBooted = true;
  initSettingsControls();
  syncThemeButtons(currentTheme());
}
document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t.closest('[data-action="search"]')) { openPanelBox('#search-panel', '#search-backdrop'); bootSearch(); return; }
  if (t.closest('[data-action="settings"]')) { openPanelBox('#settings-panel', '#settings-backdrop'); bootSettings(); return; }
  if (t.closest('[data-search-close], [data-settings-close]') || t.closest('#search-backdrop') || t.closest('#settings-backdrop')) closePanels();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanels(); });
// 独立搜索页：空闲时直接初始化
(function lazyBootSearchPage() {
  if (!$('#page-search-input')) return;
  const boot = () => bootSearch();
  if ('requestIdleCallback' in window) window.requestIdleCallback(boot, { timeout: 2500 });
  else setTimeout(boot, 1500);
})();

// 设置面板内控件：仅当面板首次打开时绑定
function initSettingsControls() {
  const hueSlider = $('#hue-slider') as HTMLInputElement | null;
  const hueValue = $('#hue-value');
  if (hueSlider && hueValue) {
    const sync = () => {
      hueValue.textContent = hueSlider.value;
      document.documentElement.style.setProperty('--hue', hueSlider.value);
      store('hue', hueSlider.value);
    };
    hueSlider.addEventListener('input', sync);
    const saved = localStorage.getItem('hue');
    if (saved) { hueSlider.value = saved; sync(); } else sync();
  }
  const opacitySlider = $('#card-opacity-slider') as HTMLInputElement | null;
  if (opacitySlider) {
    const sync = () => {
      document.documentElement.style.setProperty('--card-transparent-opacity', opacitySlider.value);
      store('overlayCardOpacity', opacitySlider.value);
    };
    opacitySlider.addEventListener('input', sync);
    const saved = localStorage.getItem('overlayCardOpacity');
    if (saved) { opacitySlider.value = saved; sync(); }
  }
  const fxSakura = $('[data-fx-sakura]') as HTMLInputElement | null;
  const fxRipple = $('[data-fx-ripple]') as HTMLInputElement | null;
  const fxGradient = $('[data-fx-gradient]') as HTMLInputElement | null;
  if (fxSakura) fxSakura.addEventListener('change', () => { const s = readEffects(); s.has('sakura') ? s.delete('sakura') : s.add('sakura'); writeEffects(s); });
  if (fxRipple) fxRipple.addEventListener('change', () => { const s = readEffects(); s.has('ripple') ? s.delete('ripple') : s.add('ripple'); writeEffects(s); });
  if (fxGradient) fxGradient.addEventListener('change', () => { const s = readEffects(); s.has('gradient') ? s.delete('gradient') : s.add('gradient'); writeEffects(s); });
  document.addEventListener('change', (e) => {
    const cb = (e.target as HTMLElement).closest<HTMLInputElement>('[data-widget-toggle]');
    if (!cb?.dataset.widgetToggle) return;
    const set = readHiddenWidgets();
    if (cb.checked) set.delete(cb.dataset.widgetToggle);
    else set.add(cb.dataset.widgetToggle);
    writeHiddenWidgets(set);
    syncWidgetToggles(set);
  });
}

/* ========== 移动端菜单 ========== */
const menuBtn = $('[data-action="menu"]');
const menu = $('#mobile-menu');
if (menuBtn && menu) {
  menuBtn.addEventListener('click', () => menu.classList.toggle('hidden'));
}

/* ========== 主题按钮 ========== */
document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const themeBtn = t.closest<HTMLElement>('[data-theme-btn]');
  if (themeBtn?.dataset.themeBtn) applyTheme(themeBtn.dataset.themeBtn as Theme);
  const cycle = t.closest<HTMLElement>('[data-action="theme"]');
  if (cycle) {
    const next = { light: 'dark', dark: 'system', system: 'light' } as Record<Theme, Theme>;
    applyTheme(next[currentTheme()]);
  }
});
syncThemeButtons(currentTheme());
syncThemeIcon(currentTheme());





/* ========== 壁纸模式 ========== */
function syncWpButtons(mode: string) {
  $$('[data-wp-mode]').forEach((b) => b.classList.toggle('btn-theme-active', b.dataset.wpMode === mode));
}
document.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>('[data-wp-mode]');
  if (!t?.dataset.wpMode) return;
  document.documentElement.setAttribute('data-wallpaper-mode', t.dataset.wpMode);
  store('wallpaperMode', t.dataset.wpMode);
  syncWpButtons(t.dataset.wpMode);
});
syncWpButtons(localStorage.getItem('wallpaperMode') || 'banner');

/* ========== 首页壁纸标题 ========== */
const bannerTitleToggle = $('[data-banner-title]');
if (bannerTitleToggle) {
  const sync = () => {
    const show = bannerTitleToggle.checked;
    $$('[data-banner-text]').forEach((el) => el.classList.toggle('hidden', !show));
    store('bannerTitleVisible', show ? '1' : '0');
  };
  bannerTitleToggle.addEventListener('change', sync);
  bannerTitleToggle.checked = localStorage.getItem('bannerTitleVisible') !== '0';
  sync();
}

/* ========== 文章布局 ========== */
function syncLayoutButtons(layout: string) {
  $$('[data-layout]').forEach((b) => b.classList.toggle('btn-theme-active', b.dataset.layout === layout));
}
document.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>('[data-layout]');
  if (!t?.dataset.layout) return;
  document.documentElement.setAttribute('data-post-layout', t.dataset.layout);
  store('postLayout', t.dataset.layout);
  syncLayoutButtons(t.dataset.layout);
});
syncLayoutButtons(localStorage.getItem('postLayout') || 'list');

/* ========== 特效 ========== */
function readEffects(): Set<string> {
  const raw = localStorage.getItem('effects') || 'sakura,ripple,gradient';
  return new Set(raw.split(',').filter(Boolean));
}
function writeEffects(s: Set<string>) {
  store('effects', Array.from(s).join(','));
  document.documentElement.classList.toggle('no-sakura', !s.has('sakura'));
  document.documentElement.classList.toggle('no-ripple', !s.has('ripple'));
  const g = $('.wallpaper-gradient');
  if (g) g.style.display = s.has('gradient') ? '' : 'none';
}
const fxSakura = $('[data-fx-sakura]');
const fxRipple = $('[data-fx-ripple]');
const fxGradient = $('[data-fx-gradient]');
(function initFx() {
  const s = readEffects();
  if (fxSakura) fxSakura.checked = s.has('sakura');
  if (fxRipple) fxRipple.checked = s.has('ripple');
  if (fxGradient) fxGradient.checked = s.has('gradient');
  document.documentElement.classList.toggle('no-sakura', !s.has('sakura'));
  document.documentElement.classList.toggle('no-ripple', !s.has('ripple'));
  const g = $('.wallpaper-gradient');
  if (g) g.style.display = s.has('gradient') ? '' : 'none';
})();

/* 樱花 */
function spawnSakura() {
  if (document.documentElement.classList.contains('no-sakura')) return;
  const petal = document.createElement('span');
  petal.className = 'petal';
  const size = 8 + Math.random() * 10;
  petal.style.width = `${size}px`;
  petal.style.height = `${size * 0.85}px`;
  petal.style.left = `${Math.random() * 100}vw`;
  petal.style.animationDuration = `${7 + Math.random() * 6}s`;
  petal.style.animationDelay = `${Math.random() * 2}s`;
  document.body.appendChild(petal);
  setTimeout(() => petal.remove(), 15000);
}
if (!document.documentElement.classList.contains('no-sakura')) {
  for (let i = 0; i < 10; i++) setTimeout(spawnSakura, i * 400);
  setInterval(() => {
    if (document.documentElement.classList.contains('no-sakura')) return;
    if (document.querySelectorAll('.petal').length < 22) spawnSakura();
  }, 1500);
}

/* 水波纹 */
document.addEventListener('click', (e) => {
  if (document.documentElement.classList.contains('no-ripple')) return;
  const card = (e.target as HTMLElement).closest<HTMLElement>('.card-base, .btn-theme, .navbar-link');
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const ink = document.createElement('span');
  ink.className = 'ripple-ink';
  const d = Math.max(rect.width, rect.height);
  ink.style.width = ink.style.height = `${d}px`;
  ink.style.left = `${e.clientX - rect.left - d / 2}px`;
  ink.style.top = `${e.clientY - rect.top - d / 2}px`;
  card.appendChild(ink);
  setTimeout(() => ink.remove(), 700);
});

/* ========== 搜索 ========== */
type SearchItem = { slug: string; title: string; description: string; body?: string; tags: string[]; category: string; pubDate: string };
let searchIndex: SearchItem[] = [];
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}
function highlightText(text: string, q: string): string {
  const i = text.toLowerCase().indexOf(q);
  if (!q || i < 0) return escapeHtml(text);
  return (
    escapeHtml(text.slice(0, i)) +
    '<mark style="background:color-mix(in oklab, var(--primary) 30%, transparent);border-radius:2px;padding:0 2px">' +
    escapeHtml(text.slice(i, i + q.length)) +
    '</mark>' +
    escapeHtml(text.slice(i + q.length))
  );
}
async function loadIndex() {
  try {
    const res = await fetch('/search-index.json');
    searchIndex = await res.json();
  } catch { /* ignore */ }
}
function bindSearch(inputId: string, resultsId: string, emptyId: string) {
  const input = $(inputId) as HTMLInputElement | null;
  const results = $(resultsId);
  const empty = $(emptyId);
  if (!input || !results || !empty) return;
  let active = -1;
  function render(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) { results.innerHTML = ''; empty.classList.add('hidden'); active = -1; return; }
    const hits = searchIndex.filter((p) =>
      [p.title, p.description, p.category, p.body || '', ...p.tags].join(' ').toLowerCase().includes(q),
    );
    if (!hits.length) { results.innerHTML = ''; empty.classList.remove('hidden'); active = -1; return; }
    empty.classList.add('hidden');
    results.innerHTML = hits
      .slice(0, 12)
      .map(
        (p, i) => `<a href="/posts/${p.slug}/" data-sr="${i}" class="flex items-center justify-between gap-2 rounded-xl px-3 py-2 transition hover:bg-primary/10">
        <span class="min-w-0"><span class="block truncate text-sm font-semibold">${highlightText(p.title, q)}</span>
        <span class="block truncate text-xs" style="color:var(--muted)">${highlightText(p.description || '', q)} · ${p.pubDate} · ${p.category}</span></span>
        <span class="badge shrink-0">${p.tags.slice(0, 2).map((t) => '#' + t).join(' ')}</span>
      </a>`,
      )
      .join('');
    active = -1;
  }
  function move(step: number) {
    const items = $$('[data-sr]', results);
    if (!items.length) return;
    active = (active + step + items.length) % items.length;
    items.forEach((el, i) => el.classList.toggle('bg-primary/10', i === active));
    items[active].scrollIntoView({ block: 'nearest' });
  }
  input.addEventListener('input', () => render(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') {
      const items = $$('[data-sr]', results);
      const target = active >= 0 ? items[active] : items[0];
      (target as HTMLAnchorElement | undefined)?.click();
    }
  });
}
/* ========== 日历 ========== */
(function initCalendar() {
  const cal = $('[data-calendar]');
  if (!cal) return;
  const datesEl = $('[data-cal-dates]', cal.parentElement!);
  const postDates = new Set<string>(JSON.parse(datesEl?.textContent || '[]'));
  const title = $('[data-cal-title]', cal);
  const grid = $('.cal-grid', cal);
  let viewYear = new Date().getFullYear();
  let viewMonth = new Date().getMonth();
  const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
  function render() {
    const first = new Date(viewYear, viewMonth, 1);
    const days = new Date(viewYear, viewMonth + 1, 0).getDate();
    const offset = first.getDay();
    const today = new Date();
    const cells = WEEK.map((d) => `<span class="cal-cell" style="font-weight:700">${d}</span>`).join('');
    let body = '';
    for (let i = 0; i < offset; i++) body += '<span class="cal-cell empty"></span>';
    for (let d = 1; d <= days; d++) {
      const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const cls = [
        'cal-cell',
        postDates.has(key) ? 'has-post' : '',
        today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d ? 'today' : '',
      ].join(' ');
      body += `<span class="${cls}">${d}</span>`;
    }
    grid!.innerHTML = cells + body;
    title!.textContent = `${viewYear} 年 ${viewMonth + 1} 月`;
  }
  $('[data-cal-prev]', cal)?.addEventListener('click', () => { viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } render(); });
  $('[data-cal-next]', cal)?.addEventListener('click', () => { viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } render(); });
  render();
})();

/* ========== 目录滚动高亮 ========== */
(function initToc() {
  const links = $$('[data-toc-link]');
  const headings = $$('.markdown-body h2, .markdown-body h3, .markdown-body h4');
  if (!links.length || !headings.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        links.forEach((l) => l.classList.toggle('text-primary', l.getAttribute('href') === `#${id}`));
      });
    },
    { rootMargin: '-15% 0px -70% 0px' }
  );
  headings.forEach((h) => observer.observe(h));
})();

/* ========== 灯箱（按需水合） ========== */
let lightbox: { show: (i: number) => void } | null = null;
function createLightbox() {
  const images = $$('.gallery-img');
  if (!images.length) return null;
  let current = 0;
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-backdrop p-4';
  overlay.innerHTML = `
    <button data-lb-prev class="lb-btn left-3 top-1/2 h-10 w-10 -translate-y-1/2" aria-label="上一张">‹</button>
    <button data-lb-close class="lb-btn right-3 top-3 h-9 w-9" aria-label="关闭">✕</button>
    <button data-lb-next class="lb-btn right-3 top-1/2 h-10 w-10 -translate-y-1/2" aria-label="下一张">›</button>
    <a data-lb-download class="lb-btn bottom-3 right-3 h-9 w-9" download title="下载图片" aria-label="下载">⬇</a>
    <img data-lb-img class="lightbox-img" alt="" />`;
  document.body.appendChild(overlay);
  const imgEl = $('[data-lb-img]', overlay) as HTMLImageElement;
  const dlBtn = $('[data-lb-download]', overlay) as HTMLAnchorElement;
  let zoomed = false;
  function resetZoom() { zoomed = false; imgEl.style.transform = ''; imgEl.style.cursor = 'zoom-in'; }
  function show(i: number) {
    current = (i + images.length) % images.length;
    imgEl.src = images[current].src;
    dlBtn.href = images[current].src;
    dlBtn.download = images[current].src.split('/').pop() || 'image';
    resetZoom();
    overlay.classList.add('open');
  }
  imgEl.addEventListener('click', (e) => {
    e.stopPropagation();
    zoomed = !zoomed;
    imgEl.style.transform = zoomed ? 'scale(1.6)' : '';
    imgEl.style.cursor = zoomed ? 'zoom-out' : 'zoom-in';
  });
  function close() { overlay.classList.remove('open'); }
  $('[data-lb-close]', overlay)?.addEventListener('click', close);
  $('[data-lb-prev]', overlay)?.addEventListener('click', () => show(current - 1));
  $('[data-lb-next]', overlay)?.addEventListener('click', () => show(current + 1));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
  return { show };
}
document.addEventListener('click', (e) => {
  const img = (e.target as HTMLElement).closest<HTMLElement>('.gallery-img');
  if (!img) return;
  if (!lightbox) lightbox = createLightbox();
  if (!lightbox) return;
  lightbox.show($$('.gallery-img').indexOf(img as HTMLImageElement));
});


/* ========== 评论（本地演示） ========== */
type Comment = { name: string; content: string; time: string };
function loadComments(key: string): Comment[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function renderComments(key: string, list: HTMLElement) {
  const items = loadComments(key);
  list.innerHTML = items.length
    ? items.map((c) => `<li class="rounded-xl p-3" style="background:var(--page-bg)">
        <p class="text-xs font-semibold">${c.name} <span style="color:var(--muted);font-weight:400">· ${c.time}</span></p>
        <p class="mt-1 leading-relaxed">${c.content}</p>
      </li>`).join('')
    : '<li class="text-sm" style="color:var(--muted)">还没有留言，来抢沙发～</li>';
}
$$('[data-comment-form]').forEach((form) => {
  const list = $('[data-comment-list]', form.parentElement!);
  if (!list) return;
  const key = list.dataset.commentKey || 'comments';
  renderComments(key, list);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = $('[data-c-name]', form) as HTMLInputElement;
    const contentInput = $('[data-c-content]', form) as HTMLTextAreaElement;
    const name = nameInput.value.trim();
    const content = contentInput.value.trim();
    if (!name || !content) return;
    const items = loadComments(key);
    items.unshift({ name, content, time: new Date().toLocaleString('zh-CN') });
    localStorage.setItem(key, JSON.stringify(items));
    renderComments(key, list);
    contentInput.value = '';
  });
});

/* ========== 加密相册 ========== */
$$('[data-album-lock]').forEach((box) => {
  const password = box.dataset.albumPass || '';
  const content = $('[data-album-content]', box.parentElement!);
  if (!content) return;
  const form = $('form', box) as HTMLFormElement;
  const input = $('input', box) as HTMLInputElement;
  const msg = $('[data-album-msg]', box);
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value === password) {
      box.classList.add('hidden');
      content.classList.remove('hidden');
      store(`album-${location.pathname}`, '1');
    } else if (msg) {
      msg.textContent = '密码错误，请重试。';
    }
  });
  if (localStorage.getItem(`album-${location.pathname}`) === '1') {
    box.classList.add('hidden');
    content.classList.remove('hidden');
  }
});

/* ========== 在线写作 ========== */
(function initEditor() {
  const app = $('#write-app');
  if (!app) return;
  const pass = app.dataset.pass || '';
  const passBox = $('#write-login');
  const editorBox = $('#write-editor');
  const loginForm = $('form', passBox!) as HTMLFormElement;
  const passInput = $('#write-pass') as HTMLInputElement;
  const loginMsg = $('#write-login-msg');

  function unlock() { passBox!.classList.add('hidden'); editorBox!.classList.remove('hidden'); }
  if (sessionStorage.getItem('write-auth') === '1') unlock();

  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (passInput.value === pass) { sessionStorage.setItem('write-auth', '1'); unlock(); }
    else if (loginMsg) loginMsg.textContent = '密码错误。';
  });

  const ta = $('#md-input') as HTMLTextAreaElement;
  const preview = $('#md-preview');
  const draftsKey = 'write-drafts';
  const titleInput = $('#md-title') as HTMLInputElement;
  const slugInput = $('#md-slug') as HTMLInputElement;
  const categoryInput = $('#md-category') as HTMLInputElement;
  const tagsInput = $('#md-tags') as HTMLInputElement;

  function renderPreview() {
    if (preview) preview.innerHTML = marked.parse(ta.value, { breaks: true }) as string;
  }
  ta?.addEventListener('input', renderPreview);

  const draftList = $('#draft-list');
  function loadDrafts(): { title: string; slug: string; category: string; tags: string; body: string }[] {
    try { return JSON.parse(localStorage.getItem(draftsKey) || '[]'); } catch { return []; }
  }
  function saveDraft() {
    const drafts = loadDrafts();
    const slug = slugInput.value.trim() || titleInput.value.trim();
    if (!slug) return;
    const existing = drafts.findIndex((d) => d.slug === slug);
    const draft = { title: titleInput.value, slug, category: categoryInput.value, tags: tagsInput.value, body: ta.value };
    if (existing >= 0) drafts[existing] = draft; else drafts.unshift(draft);
    localStorage.setItem(draftsKey, JSON.stringify(drafts));
    renderDrafts();
  }
  function renderDrafts() {
    if (!draftList) return;
    const drafts = loadDrafts();
    draftList.innerHTML = drafts.length
      ? drafts.map((d, i) => `<li class="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5" style="background:var(--page-bg)">
          <button type="button" data-load-draft="${i}" class="min-w-0 truncate text-left text-sm hover:text-primary">${d.title || d.slug}</button>
          <button type="button" data-del-draft="${i}" class="shrink-0 text-xs" style="color:var(--muted)">删除</button>
        </li>`).join('')
      : '<li class="text-sm" style="color:var(--muted)">暂无草稿</li>';
  }
  $('#write-save')?.addEventListener('click', saveDraft);
  draftList?.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const drafts = loadDrafts();
    if (t.dataset.loadDraft) {
      const d = drafts[Number(t.dataset.loadDraft)];
      if (d) { titleInput.value = d.title; slugInput.value = d.slug; categoryInput.value = d.category; tagsInput.value = d.tags; ta.value = d.body; renderPreview(); }
    }
    if (t.dataset.delDraft) {
      drafts.splice(Number(t.dataset.delDraft), 1);
      localStorage.setItem(draftsKey, JSON.stringify(drafts));
      renderDrafts();
    }
  });
  function buildMarkdown(): string {
    const title = titleInput.value.trim();
    const slug = slugInput.value.trim() || title;
    const date = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const tags = tagsInput.value.split(/[,，\s]+/).filter(Boolean).map((t) => `'${t}'`).join(', ');
    return `---\ntitle: '${title.replace(/'/g, "''")}'\ndescription: ''\ndate: ${dateStr}\ncategory: ${categoryInput.value || '日常'}\ntags: [${tags}]\n---\n\n${ta.value}`;
  }
  $('#write-export')?.addEventListener('click', () => {
    const md = buildMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${slugInput.value.trim() || 'post'}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('#write-copy')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(buildMarkdown()); } catch { /* ignore */ }
  });
  renderDrafts();
})();


/* ========== 侧栏组件开关 ========== */
function readHiddenWidgets(): Set<string> {
  const raw = localStorage.getItem('hiddenWidgets');
  if (!raw) return new Set();
  try {
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set(raw.split(',').filter(Boolean));
  }
}
function writeHiddenWidgets(hidden: Set<string>) {
  store('hiddenWidgets', hidden.size ? JSON.stringify(Array.from(hidden)) : null);
  document.documentElement.setAttribute('data-hidden-widgets', Array.from(hidden).join(' '));
}
function syncWidgetToggles(hidden: Set<string>) {
  $$('[data-widget-toggle]').forEach((cb) => {
    const id = cb.dataset.widgetToggle;
    if (id) cb.checked = !hidden.has(id);
  });
}
(function initWidgetToggles() {
  const hidden = readHiddenWidgets();
  writeHiddenWidgets(hidden);
  syncWidgetToggles(hidden);
})();
