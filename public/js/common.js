/* 公共工具：API 请求、滚动导航、显现动画、图片渐入 */

const api = async (path) => {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`请求失败：${path}`);
  return res.json();
};

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

/* 顶部导航滚动状态 */
function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // 高亮当前页
  const page = location.pathname.split('/').pop() || 'index.html';
  nav.querySelectorAll('.nav-links a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) a.classList.add('active');
  });
}

/* 滚动显现 */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

function initReveal(scope = document) {
  scope.querySelectorAll('.reveal:not(.in)').forEach((el) => revealObserver.observe(el));
}

/* 图片渐入 */
function fadeInImg(img) {
  if (img.complete) img.classList.add('loaded');
  else img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
}

/* 服饰卡片 HTML */
function garmentCard(g, i = 0) {
  return `
  <article class="g-card reveal reveal-d${(i % 4) + 1}" data-href="garment.html?id=${g.id}">
    <div class="g-img">
      <img src="${esc(g.image)}" alt="${esc(g.name)}" loading="lazy">
      <span class="seal small g-seal">赏</span>
    </div>
    <div class="g-body">
      <div class="g-dynasty">${esc(g.dynasty_name || '')} · ${esc(g.dynasty_years || '')}</div>
      <h3 class="g-name">${esc(g.name)}</h3>
      <div class="g-tags">
        <span class="tag cinnabar">${esc(g.category)}</span>
        <span class="tag">${esc(g.gender)}</span>
      </div>
    </div>
  </article>`;
}

function bindCardClicks(scope = document) {
  scope.querySelectorAll('.g-card[data-href]').forEach((card) => {
    card.addEventListener('click', () => (location.href = card.dataset.href));
  });
}

function navHTML(theme) {
  return `
  <nav class="nav">
    <a class="brand" href="index.html">
      <span class="brand-seal"><span>华服</span></span>
      <span>
        <span class="brand-name">华服千载</span>
        <span class="brand-sub">COSTUME MUSEUM OF ANCIENT CHINA</span>
      </span>
    </a>
    <ul class="nav-links">
      <li><a href="index.html">序厅</a></li>
      <li><a href="index.html#timeline">朝代</a></li>
      <li><a href="collection.html">寻衣</a></li>
      <li><a href="collection.html#browse">馆藏</a></li>
    </ul>
  </nav>`;
}

function footerHTML() {
  return `
  <footer class="footer">
    <div class="brand">
      <span class="brand-seal"><span>华服</span></span>
      <span><span class="brand-name">华服千载</span></span>
    </div>
    <div class="footer-latin">A Digital Pavilion of Chinese Costume</div>
    <div>黄帝尧舜 · 垂衣裳而天下治</div>
    <div style="margin-top:10px;opacity:0.6">数字展馆仅作文化展示 · 图像由 AI 生成</div>
  </footer>`;
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initReveal();
  document.querySelectorAll('img').forEach(fadeInImg);
});
