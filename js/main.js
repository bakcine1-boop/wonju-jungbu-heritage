(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection && navigator.connection.saveData;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ST = { prep: '', shot: '', open: '인터뷰 영상 보기' };

  /* ---------- 햇수·70주년 자동 계산 (매년 6월 12일 기준) ---------- */
  (() => {
    const now = new Date(), f = new Date(1960, 5, 12);
    let y = now.getFullYear() - 1960; if (now < new Date(now.getFullYear(), 5, 12)) y -= 1;
    /* 교회 기념 햇수 기준: 2026.6.12~2027.6.11 = 66, 2027.6.12부터 67 */
    $$('.yrs').forEach(el => el.textContent = y);
    const d70 = Math.ceil((new Date(2030, 5, 12) - now) / 864e5);
    $$('.dd').forEach(el => el.textContent = d70 > 0 ? d70.toLocaleString('ko-KR') : '0');
  })();

  /* ---------- people grid + tabs ---------- */
  const grid = $('#pgrid'), P = window.PEOPLE || [];
  function card(p) {
    const ph = p.photo
      ? `<img src="img/people/${p.photo}.webp?v=1" alt="${esc(p.name)} ${esc(p.role)}" loading="lazy" width="360" height="480">`
      : `<span class="mono" aria-hidden="true">${esc(p.name[0])}</span>`;
    return `<button class="pc" data-id="${p.id}" aria-haspopup="dialog" aria-label="${esc(p.name)} ${esc(p.role)} 자세히 보기">
      <span class="ph">${ph}</span>
      <span class="who"><b>${esc(p.name)}</b><small>${esc(p.role)}</small></span>
      ${ST[p.status] ? `<span class="st ${p.status}">${ST[p.status]}</span>` : ''}</button>`;
  }
  function showGroup(g) {
    if (!grid) return;
    grid.innerHTML = P.filter(p => p.g === g).map(card).join('');
    grid.setAttribute('aria-labelledby', 'tab-' + g);
    $$('.tabs [role=tab]').forEach(t => t.setAttribute('aria-selected', t.dataset.g === g));
  }
  $$('.tabs [role=tab]').forEach((t, i, all) => {
    t.addEventListener('click', () => showGroup(t.dataset.g));
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = all[(i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length];
      n.focus(); n.click();
    });
  });
  showGroup('s');

  /* ---------- voices strip ---------- */
  const vstrip = $('#vstrip');
  if (vstrip && window.VOICES) {
    vstrip.innerHTML = VOICES.map((v, i) => `<button class="vc2" data-t="${v.t}" data-cap="${esc(v.who + ' · ' + v.role)}" aria-label="${esc(v.who)} ${esc(v.role)}의 대답 듣기">
      <span class="ph"><img src="img/voices/${v.img}.webp?v=1" alt="" loading="lazy" width="800" height="494"><span class="gen">${esc(v.role)}</span><span class="pl" aria-hidden="true"></span></span>
      <q>“${esc(v.q).replace(/^“|”$/g, '')}”</q><span class="by"><b>${esc(v.who)}</b>${esc(v.role)}</span></button>`).join('');
    vstrip.addEventListener('click', e => { const c = e.target.closest('.vc2'); if (c) openVideo(window.VOICE_YT, +c.dataset.t, c.dataset.cap + ' · 중부가족행복축제 홍보영상(2026)'); });
  }
  $$('.strip-ctl button[data-for]').forEach(b => b.addEventListener('click', () => {
    const el = $('#' + b.dataset.for); const w = el.firstElementChild?.getBoundingClientRect().width || 300;
    el.scrollBy({ left: (+b.dataset.dir) * (w + 18) * 2, behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* ---------- CTS strip ---------- */
  const strip = $('#strip');
  if (strip && window.CTS) {
    strip.innerHTML = CTS.map(c => `<button class="clip" data-yt="${c.yt}" data-cap="${esc(c.d + ' · ' + c.t)}" aria-label="${esc(c.t)} 영상 보기">
      <span class="th"><img src="img/cts/${c.yt}.webp?v=1" alt="" loading="lazy" width="640" height="360"></span>
      <span class="d">${esc(c.d)}</span><span class="t">${esc(c.t)}${c.long ? '<span class="len">긴 영상</span>' : ''}</span></button>`).join('');
    $$('.strip-ctl button:not([data-for])').forEach(b => b.addEventListener('click', () => {
      const w = strip.querySelector('.clip')?.getBoundingClientRect().width || 300;
      strip.scrollBy({ left: (+b.dataset.dir) * (w + 22) * 2, behavior: reduce ? 'auto' : 'smooth' });
    }));
  }

  /* ---------- nav / progress / active ---------- */
  const nav = $('#nav'), bar = $('.progress');
  const darkSecs = $$('.hero, .dark, .story, .voices, .epi, .foot');
  const links = $$('.nav ul a');
  const secs = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const scenes = $$('.scene'), rail = $('.rail'), railLinks = rail ? $$('a', rail) : [];
  let ticking = false;
  function onScroll() {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    const probe = 70;
    const overDark = darkSecs.some(s => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; });
    const inHero = $('.hero').getBoundingClientRect().bottom > probe;
    nav.classList.toggle('solid', !overDark);
    nav.classList.toggle('dark', overDark && !inHero);
    let cur = null;
    secs.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * 0.35) cur = s; });
    links.forEach(a => a.classList.toggle('on', cur && a.getAttribute('href') === '#' + cur.id));
    if (rail) {
      const mid = innerHeight * .5;
      let on = null;
      scenes.forEach(s => { const r = s.getBoundingClientRect(); if (r.top < mid && r.bottom > mid) on = s; });
      rail.classList.toggle('show', !!on);
      railLinks.forEach(a => a.classList.toggle('on', on && a.dataset.r === on.id));
    }
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* mobile menu */
  const btn = $('.menu-btn'), sheet = $('#sheet');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    sheet.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  btn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('a', sheet).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false); });

  /* ---------- reveal ---------- */
  const rvs = $$('.rv');
  if (reduce || !('IntersectionObserver' in window)) rvs.forEach(el => el.classList.add('in'));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    rvs.forEach(el => io.observe(el));
  }
  requestAnimationFrame(() => $$('.hero .rv').forEach(el => el.classList.add('in')));

  /* ---------- hero video (드론 영상이 준비되면 data-src만 채우면 됨) ---------- */
  const hv = $('#heroVideo');
  if (hv && !reduce && !saveData) {
    const src = innerWidth < 760 ? (hv.dataset.srcM || hv.dataset.src) : hv.dataset.src;
    if (src) {
      hv.src = src;
      hv.addEventListener('playing', () => $('.hero').classList.add('vid-on'), { once: true });
      const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? hv.play().catch(() => {}) : hv.pause()), { threshold: .05 });
      io.observe(hv);
    }
  }

  /* ---------- 장면 배경 반복 영상: 보일 때만 불러오고 재생 ---------- */
  const lvs = $$('video.lv');
  if (lvs.length && 'IntersectionObserver' in window && !reduce && !saveData) {
    const lio = new IntersectionObserver(es => es.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) { if (!v.src) { v.src = v.dataset.src; v.load(); } v.play().catch(() => {}); }
      else if (v.src) v.pause();
    }), { rootMargin: '200px 0px', threshold: 0.01 });
    lvs.forEach(v => lio.observe(v));
  }

  /* ---------- youtube (자막 끄기, 한 번에 하나만 재생) ---------- */
  let ytReady = null;
  const players = [];
  function loadYT() {
    if (ytReady) return ytReady;
    ytReady = new Promise((res, rej) => {
      if (window.YT && window.YT.Player) return res();
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev && prev(); res(); };
      const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.onerror = rej; document.head.appendChild(s);
      setTimeout(() => rej(new Error('yt timeout')), 8000);
    });
    return ytReady;
  }
  const noCC = p => { try { p.setOption('captions', 'track', {}); } catch (_) {} try { p.unloadModule('captions'); } catch (_) {} try { p.unloadModule('cc'); } catch (_) {} };
  async function mount(box, id, start) {
    box.classList.add('on'); box.removeAttribute('role'); box.removeAttribute('tabindex');
    const holder = document.createElement('div'); box.innerHTML = ''; box.appendChild(holder);
    try {
      await loadYT();
      box._player = new YT.Player(holder, {
        host: 'https://www.youtube-nocookie.com', videoId: id, width: '100%', height: '100%',
        playerVars: { autoplay: 1, rel: 0, playsinline: 1, modestbranding: 1, cc_load_policy: 0, iv_load_policy: 3, hl: 'ko', start: start ? Math.floor(+start) : 0 },
        events: {
          onReady: e => { noCC(e.target); if (start) e.target.seekTo(+start, true); e.target.playVideo(); },
          onApiChange: e => noCC(e.target),
          onStateChange: e => { if (e.data === 1) { noCC(e.target); players.forEach(p => { if (p !== e.target && p.pauseVideo) p.pauseVideo(); }); } }
        }
      });
      players.push(box._player);
    } catch (err) {
      const f = document.createElement('iframe');
      f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen'; f.allowFullscreen = true;
      f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&cc_load_policy=0&iv_load_policy=3${start ? '&start=' + Math.floor(+start) : ''}`;
      box.innerHTML = ''; box.appendChild(f);
    }
  }
  function playIn(box, start) {
    if (box._player && box._player.seekTo) { if (start != null) box._player.seekTo(+start, true); box._player.playVideo(); return; }
    mount(box, box.dataset.yt, start);
  }
  $$('.yt[data-yt]').forEach(b => {
    const go = () => { if (!b.classList.contains('on')) playIn(b); };
    b.addEventListener('click', go);
    b.addEventListener('keydown', e => { if (!b.classList.contains('on') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(); } });
  });
  $$('[data-for]').forEach(g => {
    const box = $('#' + g.dataset.for); if (!box) return;
    const btns = $$('button[data-t]', g);
    btns.forEach(c => c.addEventListener('click', () => {
      btns.forEach(x => x.classList.remove('on')); c.classList.add('on');
      playIn(box, c.dataset.t);
      const r = box.getBoundingClientRect(); if (r.top < 60 || r.bottom > innerHeight) box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    }));
  });

  /* ---------- video dialog (CTS 보도, 인물 영상) ---------- */
  const vd = $('#vdlg'), vbox = $('#vbox'), vcap = $('#vcap');
  function openVideo(id, start, cap) {
    if (pd.open) pd.close();
    vbox.innerHTML = ''; delete vbox._player; vcap.textContent = cap || '';
    vd.showModal(); document.body.style.overflow = 'hidden';
    mount(vbox, id, start);
  }
  vd.addEventListener('close', () => {
    if (vbox._player) { try { vbox._player.destroy(); } catch (_) {} const k = players.indexOf(vbox._player); if (k >= 0) players.splice(k, 1); delete vbox._player; }
    vbox.innerHTML = '';
  });
  document.addEventListener('click', e => { const b = e.target.closest('[data-play]'); if (b) openVideo(b.dataset.play, 0, b.dataset.cap); });
  strip && strip.addEventListener('click', e => { const c = e.target.closest('.clip'); if (c) openVideo(c.dataset.yt, 0, c.dataset.cap); });

  /* ---------- person dialog ---------- */
  const pd = $('#pdlg');
  function openPerson(id) {
    const p = P.find(x => x.id === id); if (!p) return;
    $('#pd-ph').innerHTML = p.photo ? `<img src="img/people/${p.photo}.webp?v=1" alt="${esc(p.name)} ${esc(p.role)}">` : `<span class="mono" aria-hidden="true">${esc(p.name[0])}</span>`;
    $('#pd-role').textContent = p.role;
    $('#pd-name').textContent = p.name + ' ' + p.role;
    $('#pd-notes').innerHTML = (p.notes || []).map(n => `<li>${esc(n)}</li>`).join('');
    const slot = $('#pd-slot');
    if (p.status === 'open' && p.yt) {
      slot.innerHTML = `<b><span class="chip open">인터뷰 영상</span></b>${p.quote ? `<p class="q">“${esc(p.quote)}”</p>` : ''}<div class="yt" data-yt="${p.yt}" role="button" tabindex="0" aria-label="${esc(p.name)} ${esc(p.role)} 인터뷰 재생"><img src="https://i.ytimg.com/vi/${p.yt}/hqdefault.jpg" alt=""><span class="play"><i></i></span></div>`;
      const b = $('.yt', slot); b.addEventListener('click', () => { if (!b.classList.contains('on')) mount(b, p.yt, p.t); });
    } else {
      slot.innerHTML = '';
    }
    $('#pd-alt').innerHTML = p.link ? `<button class="alt" type="button" data-yt="${p.link.yt}" data-t="${p.link.t}">▶ ${esc(p.link.label)}</button>` : '';
    const alt = $('#pd-alt .alt'); alt && alt.addEventListener('click', () => openVideo(alt.dataset.yt, +alt.dataset.t, `${p.name} ${p.role} · CTS 교회행전 167회(2018)`));
    pd.showModal(); document.body.style.overflow = 'hidden';
    pd.querySelector('.dlg').scrollTop = 0;
  }
  grid && grid.addEventListener('click', e => { const b = e.target.closest('.pc'); if (b) openPerson(b.dataset.id); });
  pd.addEventListener('close', () => { const b = $('#pd-slot .yt'); if (b && b._player) { try { b._player.destroy(); } catch (_) {} } $('#pd-slot').innerHTML = ''; });

  /* ---------- lightbox ---------- */
  const lb = $('#lb'), lbImg = $('#lb-img'), lbCap = $('#lb-cap');
  let group = [], idx = 0;
  function show(i) { idx = (i + group.length) % group.length; const el = group[idx]; lbImg.src = el.dataset.lb; lbImg.alt = el.querySelector('img')?.alt || ''; lbCap.textContent = el.dataset.cap || ''; }
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-lb]'); if (!el) return;
    group = $$('[data-lb]', el.closest('.mosaic, .sun-grid, .sun6') || document); show(group.indexOf(el));
    lb.showModal(); document.body.style.overflow = 'hidden';
  });
  $('.prev', lb).addEventListener('click', e => { e.stopPropagation(); show(idx - 1); });
  $('.next', lb).addEventListener('click', e => { e.stopPropagation(); show(idx + 1); });
  lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
  let sx = null;
  lb.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
  lb.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 45) show(idx + (dx < 0 ? 1 : -1)); sx = null; });
  $$('[data-lb]').forEach(el => { el.setAttribute('role', 'button'); el.tabIndex = 0; el.addEventListener('keydown', e => { if (e.key === 'Enter') el.click(); }); });

  /* ---------- dialogs: close on backdrop / × ---------- */
  [pd, vd, lb].forEach(d => {
    d.addEventListener('close', () => { if (![pd, vd, lb].some(x => x.open)) document.body.style.overflow = ''; });
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
  });
})();
