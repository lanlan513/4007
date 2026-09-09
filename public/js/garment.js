/* 服饰详情：展签 + 同朝馆藏 */
document.getElementById('nav-slot').innerHTML = navHTML('paper');
document.getElementById('footer-slot').innerHTML = footerHTML();

const id = new URLSearchParams(location.search).get('id');

async function init() {
  const g = await api(`/api/garments/${id}`);

  document.title = `${g.name} · ${g.dynasty_name} · 华服千载`;

  // 头图
  document.getElementById('hero-bg').style.backgroundImage = `url('${g.image}')`;
  const bcD = document.getElementById('bc-dynasty');
  bcD.textContent = g.dynasty_name;
  bcD.href = `dynasty.html?id=${g.dynasty_id}`;
  document.getElementById('bc-name').textContent = g.name;
  document.getElementById('g-name').textContent = g.name;
  document.getElementById('g-en').textContent =
    `${g.dynasty_name_en} Dynasty · ${g.category}`;

  // 主图
  const img = document.getElementById('g-img');
  img.src = g.image;
  img.alt = g.name;
  fadeInImg(img);
  document.getElementById('g-caption').textContent =
    `${g.dynasty_name} · ${g.name} · ${g.category}（${g.gender}）`;

  // 展签
  document.getElementById('l-name').textContent = g.name;
  document.getElementById('l-en').textContent =
    `${g.dynasty_name_en} · ${g.years || g.dynasty_years}`;
  document.getElementById('f-dynasty').innerHTML =
    `${esc(g.dynasty_name)} <span style="color:var(--ink-text-3);font-size:14px">（${esc(g.dynasty_years)} · ${esc(g.dynasty_era)}）</span>`;
  document.getElementById('f-gender').textContent = g.gender;
  document.getElementById('f-category').innerHTML =
    `<span class="tag cinnabar" style="display:inline-block">${esc(g.category)}</span>`;
  document.getElementById('f-material').textContent = g.material;
  document.getElementById('f-form').textContent = g.form;
  document.getElementById('f-colors').textContent = g.colors;
  document.getElementById('f-desc').textContent = g.description;
  document.getElementById('back-dynasty').href = `dynasty.html?id=${g.dynasty_id}`;

  // 同朝馆藏
  const rels = (await api(`/api/garments?dynasty=${g.dynasty_id}`)).filter(
    (x) => x.id !== g.id
  );
  const grid = document.getElementById('rel-grid');
  document.getElementById('rel-title').textContent = `${g.dynasty_name} · 同 朝 馆 藏`;
  grid.innerHTML = rels.map((x, i) => garmentCard(x, i)).join('');
  grid.querySelectorAll('img').forEach(fadeInImg);
  bindCardClicks(grid);
  initReveal(grid);
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
