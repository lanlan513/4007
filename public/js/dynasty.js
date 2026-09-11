/* 朝代展厅：概述 + 时间轴导轨 + 性别/类别筛选 + 前后时期连续浏览
   数据复用现有接口：GET /api/dynasties、GET /api/dynasties/:id */
document.getElementById('nav-slot').innerHTML = navHTML('paper');
document.getElementById('footer-slot').innerHTML = footerHTML();

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const header = document.getElementById('page-hero');
const hall = document.getElementById('hall');
const heroBg = document.getElementById('hero-bg');
const fg = document.getElementById('f-gender');
const fc = document.getElementById('f-cat');
const rail = document.getElementById('journey-rail');
const prevCard = document.getElementById('era-prev');
const nextCard = document.getElementById('era-next');

let dynasties = [];
let indexById = new Map();
let currentId = new URLSearchParams(location.search).get('id') || 'preqin';
let d = null;
let allGarments = [];
let state = { gender: '全部', category: '全部' };
let switchToken = 0;

function chip(label) {
  return `<button class="chip ${state[label.kind] === label.value ? 'active' : ''}"
                 data-kind="${esc(label.kind)}" data-v="${esc(label.value)}" type="button">${esc(label.value)}</button>`;
}

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

function renderChips() {
  const genders = ['全部', ...new Set(allGarments.map((g) => g.gender))];
  const cats = ['全部', ...new Set(allGarments.map((g) => g.category))];
  fg.innerHTML =
    `<span class="filter-label">性别</span>` +
    genders.map((value) => chip({ kind: 'gender', value })).join('');
  fc.innerHTML =
    `<span class="filter-label">类别</span>` +
    cats.map((value) => chip({ kind: 'category', value })).join('');
}

/* 时间轴小导轨 */
function renderJourney() {
  rail.innerHTML = dynasties
    .map(
      (x, i) => `
    <a class="jr-station ${x.id === currentId ? 'active' : ''}" data-id="${esc(x.id)}"
       href="dynasty.html?id=${esc(x.id)}" style="--theme:${esc(x.theme)}">
      <span class="jr-node"></span>
      <span class="jr-name">${esc(x.name)}</span>
      <span class="jr-years">${esc(x.years)}</span>
      <span class="jr-num">${String(i + 1).padStart(2, '0')}</span>
    </a>`
    )
    .join('');
  const act = rail.querySelector('.jr-station.active');
  if (act) rail.scrollLeft = act.offsetLeft - rail.clientWidth / 2 + act.clientWidth / 2;
}

/* 前后时期导航卡片 */
function paintEraCard(el, x) {
  const name = el.querySelector('.era-name');
  const years = el.querySelector('.era-years');
  if (!x) {
    el.classList.add('is-end');
    el.removeAttribute('href');
    el.setAttribute('aria-disabled', 'true');
    name.textContent = '已至卷首';
    years.textContent = '—';
    return;
  }
  el.classList.remove('is-end');
  el.href = `dynasty.html?id=${x.id}`;
  el.dataset.id = x.id;
  el.style.setProperty('--theme', x.theme);
  name.textContent = x.name;
  years.textContent = x.years;
}

function updateEraNav() {
  const i = indexById.get(currentId);
  paintEraCard(prevCard, dynasties[i - 1]);
  paintEraCard(nextCard, dynasties[i + 1]);
}

/* 把已取到的朝代数据铺到页面上（无切换动画，供首屏与切换共用） */
function applyDynasty(data, push) {
  d = data;
  currentId = d.id;
  allGarments = d.garments;
  state = { gender: '全部', category: '全部' };

  document.title = `${d.name} · 华服千载`;
  document.body.style.setProperty('--d-theme', d.theme);
  heroBg.style.backgroundImage = `url('${d.hero}')`;
  document.getElementById('bc-name').textContent = d.name;
  document.getElementById('d-name').textContent = d.name;
  document.getElementById('d-en').textContent = d.name_en;
  document.getElementById('d-years').textContent = d.years;
  document.getElementById('d-era').textContent = d.era;
  document.getElementById('d-count').textContent = d.garments.length;
  document.getElementById('d-summary').textContent = d.summary;

  renderChips();
  renderGrid();
  renderJourney();
  updateEraNav();

  if (push) history.pushState({ id: d.id }, '', `dynasty.html?id=${d.id}`);
}

/* 无刷新切换朝代：淡出 → 换内容 → 淡入 */
async function switchDynasty(id, { push = true } = {}) {
  if (id === currentId) return;
  const token = ++switchToken;
  hall.classList.add('is-switching');
  header.classList.add('is-switching');

  const [data] = await Promise.all([api(`/api/dynasties/${id}`), wait(300)]);
  if (token !== switchToken) return;

  applyDynasty(data, push);
  window.scrollTo({ top: 0, behavior: 'auto' });
  requestAnimationFrame(() => {
    hall.classList.remove('is-switching');
    header.classList.remove('is-switching');
  });
}

/* 筛选 chips（容器常驻，事件只需绑定一次） */
fg.addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (!b) return;
  state.gender = b.dataset.v;
  fg.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === b));
  renderGrid();
});
fc.addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (!b) return;
  state.category = b.dataset.v;
  fc.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === b));
  renderGrid();
});

/* 导轨点击：拦截为无刷新切换 */
rail.addEventListener('click', (e) => {
  const st = e.target.closest('.jr-station');
  if (!st || st.dataset.id === currentId) return;
  e.preventDefault();
  switchDynasty(st.dataset.id);
});

/* 前一朝 / 后一朝 */
[prevCard, nextCard].forEach((card) =>
  card.addEventListener('click', (e) => {
    if (card.classList.contains('is-end')) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    switchDynasty(card.dataset.id);
  })
);

/* 浏览器前进/后退 */
window.addEventListener('popstate', () => {
  const id = new URLSearchParams(location.search).get('id') || 'preqin';
  switchDynasty(id, { push: false });
});

async function init() {
  [dynasties] = await Promise.all([api('/api/dynasties')]);
  dynasties.forEach((x, i) => indexById.set(x.id, i));
  if (!indexById.has(currentId)) currentId = dynasties[0].id;

  const data = await api(`/api/dynasties/${currentId}`);
  applyDynasty(data, false);
  history.replaceState({ id: data.id }, '', `dynasty.html?id=${data.id}`);
}

init().catch((e) => {
  document.querySelector('.section').innerHTML =
    `<div class="empty"><p>展厅数据加载失败，请返回<a href="index.html" style="color:var(--cinnabar)">序厅</a>重试</p></div>`;
  console.error(e);
});
