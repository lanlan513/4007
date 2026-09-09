/* 首页：时间轴 + 馆藏撷珍 */
document.getElementById('nav-slot').innerHTML = navHTML('ink');
document.getElementById('footer-slot').innerHTML = footerHTML();

const cnNum = ['一', '二', '三', '四', '五', '六', '七', '八'];

async function initHome() {
  const [dynasties, garments] = await Promise.all([
    api('/api/dynasties'),
    api('/api/garments'),
  ]);

  /* 时间轴 */
  const track = document.getElementById('tl-track');
  track.innerHTML = dynasties
    .map(
      (d, i) => `
    <div class="tl-station" data-id="${esc(d.id)}">
      <div class="tl-index">${cnNum[i] || i + 1} · ${String(i + 1).padStart(2, '0')}</div>
      <div class="tl-node" style="--theme:${esc(d.theme)}"></div>
      <div class="tl-card">
        <div class="tl-name">${esc(d.name)}</div>
        <div class="tl-en">${esc(d.name_en)}</div>
        <div class="tl-years">${esc(d.years)}<br>${esc(d.era)}</div>
        <div class="tl-enter">入 厅 观 览 →</div>
      </div>
    </div>`
    )
    .join('');

  track.querySelectorAll('.tl-station').forEach((st) => {
    st.addEventListener('click', () => {
      location.href = `dynasty.html?id=${st.dataset.id}`;
    });
  });

  /* 撷珍：每朝取第一件 */
  const seen = new Set();
  const featured = garments.filter((g) => {
    if (seen.has(g.dynasty_id)) return false;
    seen.add(g.dynasty_id);
    return true;
  });
  const grid = document.getElementById('featured-grid');
  grid.innerHTML = featured.map((g, i) => garmentCard(g, i)).join('');
  grid.querySelectorAll('img').forEach(fadeInImg);
  bindCardClicks(grid);
  initReveal(grid);
}

initHome().catch((e) => {
  document.getElementById('tl-track').innerHTML =
    `<div class="empty"><p>展馆数据加载失败，请稍后刷新重试</p></div>`;
  console.error(e);
});
