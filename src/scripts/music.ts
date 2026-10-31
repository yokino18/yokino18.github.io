// 音乐播放器（独立懒加载模块）：由 MusicPlayer.astro 在空闲/滚动进入视口后动态引入
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

export function initMusicPlayer() {
  const wrap = $('[data-player]');
  if (!wrap) return;
  // 音频/进度/控制/歌词位于 [data-player] 外层，统一按 data-pl-* 全局查找
  const audio = $('[data-pl-audio]') as HTMLAudioElement | null;
  const playlist: { title: string; artist: string; cover: string; src: string; lyrics: { time: number; text: string }[] }[] =
    JSON.parse($('[data-playlist]')?.textContent || '[]');
  const cover = $('[data-pl-cover]') as HTMLImageElement;
  const titleEl = $('[data-pl-title]');
  const artistEl = $('[data-pl-artist]');
  const bar = $('[data-pl-bar]');
  const progress = $('[data-pl-progress]');
  const lyricsBox = $('[data-pl-lyrics]');
  const toggleBtn = $('[data-pl-toggle]');
  const card = $('[data-player-card]') as HTMLElement | null;
  const miniBtn = $('[data-pl-mini]');
  const ball = $('[data-pl-ball]');
  if (card && miniBtn && ball) {
    const applyMini = (mini: boolean) => {
      card.classList.toggle('hidden', mini);
      ball.classList.toggle('hidden', !mini);
      ball.classList.toggle('flex', mini);
      store('playerMini', mini ? '1' : '0');
    };
    miniBtn.addEventListener('click', () => applyMini(!card.classList.contains('hidden')));
    ball.addEventListener('click', () => applyMini(false));
    if (localStorage.getItem('playerMini') === '1') applyMini(true);
  }
  let index = 0;
  let lastLyric = -1;
  // 随机播放：维护洗牌队列，播完一轮重新洗牌
  let order: number[] = [];
  let orderPos = 0;
  function buildOrder() {
    order = playlist.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    orderPos = 0;
  }
  function step(delta: number) {
    if (!order.length) return;
    orderPos = (orderPos + delta + order.length) % order.length;
    if (delta > 0 && orderPos === 0) buildOrder();
    playTrack(order[orderPos]);
  }

  // 自动播放被浏览器拦截时，等用户首次交互（点击/按键/触摸）再开播
  let waitingGesture = false;
  function startOnFirstGesture() {
    if (waitingGesture) return;
    waitingGesture = true;
    const start = () => {
      document.removeEventListener('click', start);
      document.removeEventListener('keydown', start);
      document.removeEventListener('touchstart', start);
      if (audio && audio.paused) {
        audio.play().catch(() => undefined);
        toggleBtn!.textContent = '⏸';
      }
    };
    document.addEventListener('click', start);
    document.addEventListener('keydown', start);
    document.addEventListener('touchstart', start);
  }

  function renderLyrics() {
    const track = playlist[index];
    if (!track) return;
    lyricsBox!.innerHTML = track.lyrics.length
      ? track.lyrics.map((l, i) => `<p class="lyric-line" data-lyric="${i}">${l.text}</p>`).join('')
      : '<p class="lyric-line">暂无歌词</p>';
  }
  function renderMeta() {
    const track = playlist[index];
    if (!track) { titleEl!.textContent = '暂未播放'; artistEl!.textContent = '0:00 / 0:00'; return; }
    cover.src = track.cover || '/gallery/cover-music.svg';
    const ballImg = $('[data-pl-ball-cover]');
    if (ballImg) (ballImg as HTMLImageElement).src = cover.src;
    titleEl!.textContent = track.title;
    artistEl!.textContent = track.src ? `${track.artist} · 0:00 / 0:00` : `${track.artist} · 未配置音频`;
    toggleBtn!.textContent = '▶';
  }
  function playTrack(i: number) {
    if (!audio || !playlist.length) return;
    index = ((i % playlist.length) + playlist.length) % playlist.length;
    const track = playlist[index];
    if (!track || !track.src) { renderMeta(); renderLyrics(); return; }
    audio.src = track.src;
    audio.play().catch(() => undefined);
    toggleBtn!.textContent = '⏸';
    renderMeta();
    renderLyrics();
    lastLyric = -1;
  }
  if (toggleBtn) toggleBtn.addEventListener('click', () => {
    const track = playlist[index];
    if (!track?.src) { playTrack(index); return; }
    if (audio!.paused) { audio!.play().catch(() => undefined); toggleBtn.textContent = '⏸'; }
    else { audio!.pause(); toggleBtn.textContent = '▶'; }
  });
  $('[data-pl-prev]')?.addEventListener('click', () => { if (playlist.length) step(-1); });
  $('[data-pl-next]')?.addEventListener('click', () => { if (playlist.length) step(1); });
  progress?.addEventListener('click', (e) => {
    if (!audio || !audio.duration) return;
    const rect = progress.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  });
  if (audio) {
    audio.addEventListener('timeupdate', () => {
      if (!audio.duration) return;
      bar!.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
      artistEl!.textContent = `${playlist[index]?.artist || ''} · ${fmtTime(audio.currentTime)} / ${fmtTime(audio.duration)}`;
      const track = playlist[index];
      if (!track) return;
      const lyr = [...track.lyrics].reverse().find((l) => l.time <= audio.currentTime);
      const li = lyr ? track.lyrics.indexOf(lyr) : -1;
      if (li !== lastLyric && lyricsBox) {
        $$('.lyric-line', lyricsBox).forEach((el) => el.classList.remove('active'));
        if (li >= 0) {
          const el = $(`[data-lyric="${li}"]`, lyricsBox);
          el?.classList.add('active');
          el?.scrollIntoView({ block: 'nearest' });
        }
        lastLyric = li;
      }
    });
    audio.addEventListener('ended', () => { if (playlist.length > 1) step(1); });
  }
  // 初始随机选一首并尝试自动播放；被拦截则等首次交互再开播
  if (playlist.length) {
    buildOrder();
    index = order[0];
    renderMeta();
    renderLyrics();
    const track = playlist[index];
    if (track?.src && audio) {
      audio.src = track.src;
      try {
        const p = audio.play();
        if (p && typeof p.then === 'function') {
          p.then(() => { toggleBtn!.textContent = '⏸'; }).catch(() => {
            toggleBtn!.textContent = '▶';
            startOnFirstGesture();
          });
        }
      } catch {
        startOnFirstGesture();
      }
    }
  }
}