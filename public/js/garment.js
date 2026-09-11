/* 服饰详情：展签 + 局部细节（放大镜）+ 服饰志 + 同朝代/相关服饰 */
document.getElementById('nav-slot').innerHTML = navHTML('paper');
document.getElementById('footer-slot').innerHTML = footerHTML();

const id = new URLSearchParams(location.search).get('id');

/* 观察点：图上位置（百分比）对应馆藏记录中的文献字段 */
const FOCUS_POINTS = [
  { key: 'form', no: '壹', title: '领口袖缘 · 观形制', x: 50, y: 15 },
  { key: 'material', no: '贰', title: '衣身肌理 · 观材质', x: 28, y: 45 },
  { key: 'colors', no: '叁', title: '服色 · 观色彩', x: 66, y: 55 },
  { key: 'pattern', no: '肆', title: '衣裙 · 观纹样', x: 50, y: 78 },
];

async function init() {
  const g = await api(`/api/garments/${id}`);

  document.title = `${g.name} · ${g.dynasty_name} · 华服千载`;

  /* 头图 */
  document.getElementById('hero-bg').style.backgroundImage = `url('${g.image}')`;
  const bcD = document.getElementById('bc-dynasty');
  bcD.textContent = g.dynasty_name;
  bcD.href = `dynasty.html?id=${g.dynasty_id}`;
  document.getElementById('bc-name').textContent = g.name;
  document.getElementById('g-name').textContent = g.name;
  document.getElementById('g-en').textContent =
    `${g.dynasty_name_en} Dynasty · ${g.category}`;

  /* 主图 */
  const img = document.getElementById('g-img');
  img.src = g.image;
  img.alt = g.name;
  fadeInImg(img);
  document.getElementById('g-caption').textContent =
    `${g.dynasty_name} · ${g.name} · ${g.category}（${g.gender}）· 点击图片可放大`;

  /* 展签 */
  document.getElementById('l-name').textContent = g.name;
  document.getElementById('l-en').textContent =
    `${g.dynasty_name_en} · ${g.dynasty_years}`;
  document.getElementById('f-dynasty').innerHTML =
    `${esc(g.dynasty_name)} <span style="color:var(--ink-text-3);font-size:14px">（${esc(g.dynasty_years)} · ${esc(g.dynasty_era)}）</span>`;
  document.getElementById('f-category').innerHTML =
    `<span class="tag cinnabar" style="display:inline-block">${esc(g.category)}</span>`;
  document.getElementById('f-identity').textContent = g.identity || '—';
  document.getElementById('f-gender').textContent = g.gender;
  document.getElementById('back-dynasty').href = `dynasty.html?id=${g.dynasty_id}`;

  /* 服饰志 */
  document.getElementById('r-form').textContent = g.form;
  document.getElementById('r-material').textContent = g.material;
  document.getElementById('r-colors').textContent = g.colors;
  document.getElementById('r-pattern').textContent = g.pattern || '—';
  document.getElementById('r-desc').textContent = g.description;

  setupLens(g);
  setupLightbox(g);

  /* 同朝代服饰 + 相关服饰（取自馆藏关联接口） */
  const rel = await api(`/api/garments/${g.id}/related`);

  document.getElementById('same-title').textContent = `${g.dynasty_name} · 同 朝 代 服 饰`;
  const sameGrid = document.getElementById('same-grid');
  sameGrid.innerHTML = rel.same_dynasty.map((x, i) => garmentCard(x, i)).join('');

  const relGrid = document.getElementById('rel-grid');
  relGrid.innerHTML = rel.related
    .map((x, i) => {
      const reason =
        x.category === g.category
          ? `同属${x.category}`
          : `同属${x.gender === '男女通用' ? '通服' : `${x.gender}服`}`;
      return garmentCard(x, i, reason);
    })
    .join('');

  [sameGrid, relGrid].forEach((grid) => {
    grid.querySelectorAll('img').forEach(fadeInImg);
    bindCardClicks(grid);
    initReveal(grid);
  });
}

/* ── 放大镜：局部细节查看 ─────────────────────────── */
function setupLens(g) {
  const ZOOM = 2.6;
  const box = document.getElementById('lens-box');
  const img = document.getElementById('lens-img');
  const lens = document.getElementById('lens');
  const hint = document.getElementById('lens-hint');

  img.src = g.image;
  img.alt = `${g.name}（局部观察）`;
  fadeInImg(img);
  lens.style.backgroundImage = `url('${g.image}')`;

  const size = () => ({ w: box.clientWidth, h: box.clientHeight, r: lens.offsetWidth / 2 });
  let pinned = false; // 观察点定位后放大镜驻留，自由移动时取消

  function place(px, py) {
    const { w, h, r } = size();
    const x = Math.max(0, Math.min(w, px));
    const y = Math.max(0, Math.min(h, py));
    lens.style.left = `${x}px`;
    lens.style.top = `${y}px`;
    lens.style.backgroundSize = `${w * ZOOM}px ${h * ZOOM}px`;
    lens.style.backgroundPosition = `${-(x * ZOOM - r)}px ${-(y * ZOOM - r)}px`;
    lens.classList.add('on');
  }

  function fromEvent(e) {
    const rect = box.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    place(p.clientX - rect.left, p.clientY - rect.top);
  }

  box.addEventListener('mousemove', (e) => {
    pinned = false;
    lens.classList.remove('anim');
    fromEvent(e);
    hint.classList.add('off');
  });
  box.addEventListener('mouseleave', () => { if (!pinned) lens.classList.remove('on'); });
  box.addEventListener('touchstart', (e) => { pinned = false; fromEvent(e); hint.classList.add('off'); }, { passive: true });
  box.addEventListener('touchmove', (e) => { e.preventDefault(); fromEvent(e); }, { passive: false });
  box.addEventListener('touchend', () => { if (!pinned) lens.classList.remove('on'); });

  /* 观察点 chips：定位放大镜并联动文献说明 */
  const chipsBox = document.getElementById('focus-chips');
  chipsBox.innerHTML = FOCUS_POINTS.map(
    (f, i) =>
      `<button type="button" class="focus-chip ${i === 0 ? 'active' : ''}" data-i="${i}">${f.no} · ${esc(f.title)}</button>`
  ).join('');

  function selectFocus(i, moveLens = true) {
    const f = FOCUS_POINTS[i];
    chipsBox.querySelectorAll('.focus-chip').forEach((c, j) => c.classList.toggle('active', j === i));
    document.getElementById('focus-no').textContent = f.no;
    document.getElementById('focus-title').textContent = f.title;
    document.getElementById('focus-text').textContent = g[f.key] || '—';
    if (!moveLens) return;
    const { w, h } = size();
    if (!w || !h) return;
    pinned = true;
    lens.classList.add('anim');
    place((f.x / 100) * w, (f.y / 100) * h);
    hint.classList.add('off');
  }

  chipsBox.addEventListener('click', (e) => {
    const b = e.target.closest('.focus-chip');
    if (b) selectFocus(Number(b.dataset.i));
  });

  /* 文献说明立即呈现；放大镜待图像就绪后定位 */
  selectFocus(0, false);
  const start = () => selectFocus(0);
  if (img.complete && img.naturalWidth) start();
  else img.addEventListener('load', start, { once: true });
  window.addEventListener('resize', () => {
    const active = chipsBox.querySelector('.focus-chip.active');
    if (active) selectFocus(Number(active.dataset.i));
  });
}

/* ── 灯箱：图片放大 ──────────────────────────────── */
function setupLightbox(g) {
  const lb = document.getElementById('lightbox');
  const stage = document.getElementById('lb-stage');
  const lbImg = document.getElementById('lb-img');
  let scale = 1, tx = 0, ty = 0, dragging = false, sx = 0, sy = 0;

  lbImg.src = g.image;
  lbImg.alt = g.name;
  document.getElementById('lb-caption').textContent =
    `${g.dynasty_name} · ${g.name} —— 滚轮或按钮缩放，拖动平移`;

  const apply = () => {
    lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  };
  const zoom = (dir) => {
    scale = Math.max(1, Math.min(5, scale * (dir > 0 ? 1.3 : 1 / 1.3)));
    if (scale === 1) { tx = 0; ty = 0; }
    apply();
  };
  const reset = () => { scale = 1; tx = 0; ty = 0; apply(); };
  const open = () => {
    reset();
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  document.getElementById('main-frame').addEventListener('click', open);
  document.getElementById('zoom-open').addEventListener('click', (e) => { e.stopPropagation(); open(); });
  document.getElementById('lb-zoom-in').addEventListener('click', () => zoom(1));
  document.getElementById('lb-zoom-out').addEventListener('click', () => zoom(-1));
  document.getElementById('lb-reset').addEventListener('click', reset);
  document.getElementById('lb-close').addEventListener('click', close);
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target === stage) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === '+' || e.key === '=') zoom(1);
    if (e.key === '-') zoom(-1);
  });
  lb.addEventListener('wheel', (e) => { e.preventDefault(); zoom(e.deltaY < 0 ? 1 : -1); }, { passive: false });
  lbImg.addEventListener('dblclick', () => { scale = scale > 1 ? 1 : 2.5; if (scale === 1) { tx = 0; ty = 0; } apply(); });

  stage.addEventListener('mousedown', (e) => {
    if (scale <= 1) return;
    dragging = true; sx = e.clientX - tx; sy = e.clientY - ty;
    stage.classList.add('dragging');
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    tx = e.clientX - sx; ty = e.clientY - sy;
    apply();
  });
  window.addEventListener('mouseup', () => { dragging = false; stage.classList.remove('dragging'); });
}

if (!id) {
  document.querySelector('.section').innerHTML =
    `<div class="empty"><p>未指定展品，请从<a href="collection.html" style="color:var(--cinnabar)">馆藏</a>进入</p></div>`;
} else {
  init().catch((e) => {
    document.querySelector('.detail-layout').innerHTML =
      `<div class="empty" style="grid-column:1/-1"><p>展品数据加载失败</p></div>`;
    console.error(e);
  });
}
