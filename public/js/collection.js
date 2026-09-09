/* 馆藏检索：搜索 + 朝代/性别/类别筛选（服务端过滤） */
document.getElementById('nav-slot').innerHTML = navHTML('paper');
document.getElementById('footer-slot').innerHTML = footerHTML();

const state = { q: '', dynasty: '全部', gender: '全部', category: '全部' };

function makeChips(container, values, key) {
  container.insertAdjacentHTML(
    'beforeend',
    values.map((v) => `<button class="chip ${v === '全部' ? 'active' : ''}" data-v="${esc(v)}">${esc(v)}</button>`).join('')
  );
  container.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    state[key] = b.dataset.v;
    container.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === b));
    load();
  });
}

async function load() {
  const qs = new URLSearchParams();
  if (state.q) qs.set('q', state.q);
  if (state.dynasty !== '全部') qs.set('dynasty', state.dynasty);
  if (state.gender !== '全部') qs.set('gender', state.gender);
  if (state.category !== '全部') qs.set('category', state.category);

  const list = await api(`/api/garments?${qs.toString()}`);
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  document.getElementById('result-count').textContent = `共 ${list.length} 件藏品`;

  if (!list.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = list.map((g, i) => garmentCard(g, i)).join('');
  grid.querySelectorAll('img').forEach(fadeInImg);
  bindCardClicks(grid);
  initReveal(grid);
}

let timer;
document.getElementById('q').addEventListener('input', (e) => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    state.q = e.target.value.trim();
    load();
  }, 280);
});

async function init() {
  const [dynasties, meta] = await Promise.all([api('/api/dynasties'), api('/api/meta')]);
  // 朝代 chips：显示名称，查询时映射为 id
  const fd = document.getElementById('f-dynasty');
  const nameToId = new Map(dynasties.map((d) => [d.name, d.id]));
  ['全部', ...dynasties.map((d) => d.name)].forEach((v) =>
    fd.insertAdjacentHTML(
      'beforeend',
      `<button class="chip ${v === '全部' ? 'active' : ''}" data-v="${esc(v)}">${esc(v)}</button>`
    )
  );
  fd.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    const v = b.dataset.v;
    state.dynasty = v === '全部' ? '全部' : nameToId.get(v);
    fd.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === b));
    load();
  });
  makeChips(document.getElementById('f-gender'), ['全部', ...meta.genders], 'gender');
  makeChips(document.getElementById('f-cat'), ['全部', ...meta.categories], 'category');

  // 支持从 URL 传入初始筛选，如 collection.html?dynasty=ming
  const p = new URLSearchParams(location.search);
  if (p.get('category')) {
    state.category = p.get('category');
    document.querySelectorAll('#f-cat .chip').forEach((c) =>
      c.classList.toggle('active', c.dataset.v === state.category)
    );
  }
  await load();
}

init().catch((e) => {
  document.getElementById('grid').innerHTML =
    `<div class="empty" style="grid-column:1/-1"><p>馆藏数据加载失败，请稍后重试</p></div>`;
  console.error(e);
});
