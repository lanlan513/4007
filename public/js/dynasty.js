/* 朝代展厅：概述 + 性别/类别筛选 */
document.getElementById('nav-slot').innerHTML = navHTML('paper');
document.getElementById('footer-slot').innerHTML = footerHTML();

const params = new URLSearchParams(location.search);
const dynastyId = params.get('id') || 'preqin';

let allGarments = [];
let state = { gender: '全部', category: '全部' };

function chip(label, active, onClick) {
  return `<button class="chip ${active ? 'active' : ''}" data-v="${esc(label)}">${esc(label)}</button>`;
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
  grid.innerHTML = list.map((g, i) => garmentCard({ ...g, dynasty_name: d.name, dynasty_years: d.years }, i)).join('');
  grid.querySelectorAll('img').forEach(fadeInImg);
  bindCardClicks(grid);
  initReveal(grid);
}

let d;
async function init() {
  d = await api(`/api/dynasties/${dynastyId}`);

  document.title = `${d.name} · 华服千载`;
  document.getElementById('hero-bg').style.backgroundImage = `url('${d.hero}')`;
  document.getElementById('bc-name').textContent = d.name;
  document.getElementById('d-name').textContent = d.name;
  document.getElementById('d-en').textContent = d.name_en;
  document.getElementById('d-years').textContent = d.years;
  document.getElementById('d-era').textContent = d.era;
  document.getElementById('d-count').textContent = d.garments.length;
  document.getElementById('d-summary').textContent = d.summary;

  allGarments = d.garments;

  // 筛选 chips
  const genders = ['全部', ...new Set(allGarments.map((g) => g.gender))];
  const cats = ['全部', ...new Set(allGarments.map((g) => g.category))];
  const fg = document.getElementById('f-gender');
  const fc = document.getElementById('f-cat');
  genders.forEach((g) => fg.insertAdjacentHTML('beforeend', chip(g, g === '全部')));
  cats.forEach((c) => fc.insertAdjacentHTML('beforeend', chip(c, c === '全部')));

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

  renderGrid();
}

init().catch((e) => {
  document.querySelector('.section').innerHTML =
    `<div class="empty"><p>展厅数据加载失败，请返回<a href="index.html" style="color:var(--cinnabar)">序厅</a>重试</p></div>`;
  console.error(e);
});
