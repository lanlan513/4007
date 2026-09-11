/* 朝代展厅：历史背景 · 服饰文化 · 镇厅之宝 · 分类导览 · 朝代切换 */
document.getElementById('nav-slot').innerHTML = navHTML('paper');
document.getElementById('footer-slot').innerHTML = footerHTML();

const params = new URLSearchParams(location.search);
const dynastyId = params.get('id') || 'preqin';

/* 类别与服属的展示顺序（仅展示本朝实际存在的项） */
const CAT_ORDER = ['礼服', '官服', '常服', '戎服'];
const GENDER_ORDER = ['男', '女', '男女通用'];

let d = null; // 当前朝代详情
let allGarments = [];
const state = { gender: '全部', category: '全部' };

/* ── 头图与基本信息 ── */
function renderHero() {
  document.title = `${d.name}展厅 · 华服千载`;
  document.getElementById('hero-bg').style.backgroundImage = `url('${d.hero}')`;
  document.getElementById('bc-name').textContent = d.name;
  document.getElementById('d-name').textContent = d.name;
  document.getElementById('d-en').textContent = d.name_en;
  document.getElementById('d-years').textContent = d.years;
  document.getElementById('d-era').textContent = d.era;
  document.getElementById('d-count').textContent = d.garments.length;
}

/* ── 朝代切换条 ── */
function renderSwitch(dynasties) {
  document.getElementById('hall-switch').innerHTML = dynasties
    .map(
      (x) => `
      <a class="hs-item ${x.id === d.id ? 'active' : ''}" href="dynasty.html?id=${esc(x.id)}"
         ${x.id === d.id ? 'aria-current="page"' : ''}>
        <span class="hs-dot" style="--theme:${esc(x.theme)}"></span>${esc(x.name)}
      </a>`
    )
    .join('');
}

/* ── 历史背景 + 服饰文化 ── */
function renderStory() {
  document.getElementById('d-background').textContent = d.background || d.summary;
  document.getElementById('d-quote').textContent = `「${d.quote}」`;
  document.getElementById('d-quote-src').textContent = d.quote_source;
  document.getElementById('d-culture').textContent = d.culture || '';
  document.getElementById('d-menswear').textContent = d.menswear || '';
  document.getElementById('d-womenswear').textContent = d.womenswear || '';
}

/* ── 镇厅之宝：取本朝第一件藏品作重点展示 ── */
function renderFeature() {
  const f = allGarments[0];
  const el = document.getElementById('feature-card');
  if (!f) {
    document.getElementById('feature-section').style.display = 'none';
    return;
  }
  el.innerHTML = `
    <div class="f-img">
      <img src="${esc(f.image)}" alt="${esc(f.name)}">
      <span class="seal small g-seal">赏</span>
    </div>
    <div class="f-body">
      <div class="g-tags">
        <span class="tag cinnabar">${esc(f.category)}</span>
        <span class="tag">${esc(f.gender)}</span>
      </div>
      <h3 class="f-name">${esc(f.name)}</h3>
      <p class="f-form">${esc(f.form || '')}</p>
      <p class="f-desc">${esc(f.description || '')}</p>
      <span class="btn-ghost f-more">细 览 展 品 →</span>
    </div>`;
  el.querySelectorAll('img').forEach(fadeInImg);
  el.addEventListener('click', () => (location.href = `garment.html?id=${f.id}`));
}

/* ── 筛选 chips ── */
function chip(label, active) {
  return `<button class="chip ${active ? 'active' : ''}" data-v="${esc(label)}">${esc(label)}</button>`;
}

function renderFilters() {
  const present = (arr) => [...new Set(allGarments.map((g) => g.category || g.gender))];
  const cats = CAT_ORDER.filter((c) => allGarments.some((g) => g.category === c)).concat(
    present().filter((c) => !CAT_ORDER.includes(c) && allGarments.some((g) => g.category === c))
  );
  const genders = GENDER_ORDER.filter((x) => allGarments.some((g) => g.gender === x));

  const fc = document.getElementById('f-cat');
  const fg = document.getElementById('f-gender');
  ['全部', ...cats].forEach((c) => fc.insertAdjacentHTML('beforeend', chip(c, c === '全部')));
  ['全部', ...genders].forEach((g) => fg.insertAdjacentHTML('beforeend', chip(g, g === '全部')));

  fc.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    state.category = b.dataset.v;
    fc.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === b));
    renderGrid();
  });
  fg.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    state.gender = b.dataset.v;
    fg.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === b));
    renderGrid();
  });
}

/* ── 藏品网格 ── */
function renderGrid() {
  const list = allGarments.filter(
    (g) =>
      (state.gender === '全部' || g.gender === state.gender) &&
      (state.category === '全部' || g.category === state.category)
  );
  const grid = document.getElementById('garment-grid');
  const empty = document.getElementById('empty');
  document.getElementById('result-count').textContent = `共 ${list.length} 件藏品`;

  if (!list.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = list
    .map((g, i) => garmentCard({ ...g, dynasty_name: d.name, dynasty_years: d.years }, i))
    .join('');
  grid.querySelectorAll('img').forEach(fadeInImg);
  bindCardClicks(grid);
  initReveal(grid);
}

/* ── 上一朝 / 下一朝 ── */
function renderHallNav(dynasties) {
  const idx = dynasties.findIndex((x) => x.id === d.id);
  if (idx === -1) return;
  const prev = dynasties[(idx - 1 + dynasties.length) % dynasties.length];
  const next = dynasties[(idx + 1) % dynasties.length];
  document.getElementById('prev-d').href = `dynasty.html?id=${prev.id}`;
  document.getElementById('next-d').href = `dynasty.html?id=${next.id}`;
  document.getElementById('prev-name').textContent = prev.name;
  document.getElementById('next-name').textContent = next.name;
}

async function init() {
  const [dynasties, detail] = await Promise.all([
    api('/api/dynasties'),
    api(`/api/dynasties/${encodeURIComponent(dynastyId)}`),
  ]);
  d = detail;
  allGarments = d.garments;

  /* 以朝代主题色浸染本厅（印章、签条、选中态等） */
  document.body.style.setProperty('--dynasty', d.theme);

  renderHero();
  renderSwitch(dynasties);
  renderStory();
  renderFeature();
  renderFilters();
  renderGrid();
  renderHallNav(dynasties);
}

init().catch((e) => {
  document.querySelectorAll('.hall-section, .hall-switch').forEach((el) => (el.style.display = 'none'));
  document.getElementById('hall-error').style.display = 'block';
  console.error(e);
});
