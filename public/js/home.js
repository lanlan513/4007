/* 首页：历史时间轴（长卷 + 预览展柜）+ 馆藏撷珍
   数据全部来自现有后端：GET /api/dynasties、GET /api/garments */
document.getElementById('nav-slot').innerHTML = navHTML('ink');
document.getElementById('footer-slot').innerHTML = footerHTML();

const cnNum = ['一', '二', '三', '四', '五', '六', '七', '八'];

async function initHome() {
  const [dynasties, garments] = await Promise.all([
    api('/api/dynasties'),
    api('/api/garments'),
  ]);

  /* 按朝代归并服饰（接口已按 sort_order 排序） */
  const byDynasty = new Map(dynasties.map((d) => [d.id, []]));
  garments.forEach((g) => byDynasty.get(g.dynasty_id)?.push(g));

  initTimeline(dynasties, byDynasty);
  initFeatured(dynasties, garments);
}

/* ───────────────────────── 历史时间轴 ───────────────────────── */
function initTimeline(dynasties, byDynasty) {
  const track = document.getElementById('tl-track');
  const stage = document.getElementById('tl-stage');
  const stageBg = document.getElementById('tl-stage-bg');
  const stageBody = document.getElementById('tls-body');
  const progress = document.getElementById('tl-progress');
  const prevBtn = document.getElementById('tl-prev');
  const nextBtn = document.getElementById('tl-next');

  let active = 0;            // 当前高亮的朝代下标
  let programmatic = false; // 程序化滚动时跳过 scroll-spy
  let suppressUntil = 0;

  /* 概述首句作为轴卡片上的“服饰特征”短句 */
  const featureOf = (summary) => summary.split('。')[0] + '。';

  /* 渲染长卷节点 */
  track.innerHTML = dynasties
    .map((d, i) => {
      const list = byDynasty.get(d.id) || [];
      const names = list.slice(0, 3);
      const extra = list.length - names.length;
      return `
    <div class="tl-station" data-index="${i}" data-id="${esc(d.id)}">
      <div class="tl-index">${cnNum[i] || i + 1} · ${String(i + 1).padStart(2, '0')}</div>
      <button class="tl-node" style="--theme:${esc(d.theme)}" type="button"
              aria-label="进入${esc(d.name)}展厅" title="进入${esc(d.name)}展厅"></button>
      <div class="tl-card" style="--theme:${esc(d.theme)}">
        <div class="tl-name">${esc(d.name)}</div>
        <div class="tl-en">${esc(d.name_en)}</div>
        <div class="tl-years">${esc(d.years)}<br>${esc(d.era)}</div>
        <ul class="tl-relics">
          ${names.map((g) => `<li>${esc(g.name)}</li>`).join('')}
          ${extra > 0 ? `<li class="tl-more">等 ${list.length} 件 →</li>` : ''}
        </ul>
        <p class="tl-feature">${esc(featureOf(d.summary))}</p>
        <div class="tl-enter">再 点 一 次 · 入 厅 观 览 →</div>
      </div>
    </div>`;
    })
    .join('');

  const stations = [...track.querySelectorAll('.tl-station')];

  /* 渲染预览展柜内容 */
  function stageHTML(d, i) {
    const list = byDynasty.get(d.id) || [];
    const main = list[0];
    const others = list.slice(1);
    return `
    <div class="tls-side tls-text">
      <div class="tls-index">
        <span class="tls-num">${cnNum[i] || i + 1}</span>
        <span>${String(i + 1).padStart(2, '0')} / ${String(dynasties.length).padStart(2, '0')}</span>
      </div>
      <h3 class="tls-name">${esc(d.name)}</h3>
      <div class="tls-en">${esc(d.name_en)}</div>
      <div class="tls-meta">
        <span>${esc(d.years)}</span><i></i><span>${esc(d.era)}</span><i></i><span>馆藏 ${list.length} 件</span>
      </div>
      <p class="tls-feature">${esc(featureOf(d.summary))}</p>
      <p class="tls-summary">${esc(d.summary.slice(featureOf(d.summary).length))}</p>
      <a class="tls-enter" href="dynasty.html?id=${esc(d.id)}">入 ${esc(d.name)} 厅 · 观览全部馆藏 →</a>
    </div>
    <div class="tls-side tls-relic">
      ${
        main
          ? `<a class="tls-figure" href="garment.html?id=${main.id}">
               <img src="${esc(main.image)}" alt="${esc(main.name)}" loading="lazy">
               <span class="tls-figure-cap">
                 <b>${esc(main.name)}</b><i>${esc(main.category)} · ${esc(main.gender)}</i>
               </span>
               <span class="seal small tls-figure-seal">珍</span>
             </a>`
          : ''
      }
      <div class="tls-thumbs">
        ${others
          .map(
            (g) => `
          <a class="tls-thumb" href="garment.html?id=${g.id}" title="${esc(g.name)}">
            <img src="${esc(g.image)}" alt="${esc(g.name)}" loading="lazy">
            <span class="tls-thumb-name">${esc(g.name)}</span>
          </a>`
          )
          .join('')}
      </div>
    </div>`;
  }

  /* 切换高亮朝代；scroll=true 表示由点击/箭头触发，需要把节点滚入视野 */
  function setActive(i, { scroll = false, animate = true } = {}) {
    i = Math.max(0, Math.min(dynasties.length - 1, i));
    if (scroll) {
      programmatic = true;
      suppressUntil = Date.now() + 650;
      stations[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
    if (i === active && stageBody.childElementCount && !scroll) {
      updateArrows(i);
      return;
    }
    active = i;
    const d = dynasties[i];

    stations.forEach((st, j) => st.classList.toggle('active', j === i));

    stage.style.setProperty('--theme', d.theme);

    if (animate) {
      stageBody.classList.add('switching');
      stageBg.classList.add('switching');
      setTimeout(() => {
        stageBody.innerHTML = stageHTML(d, i);
        stageBg.style.backgroundImage = `url('${d.hero}')`;
        stageBody.querySelectorAll('img').forEach(fadeInImg);
        requestAnimationFrame(() => {
          stageBody.classList.remove('switching');
          stageBg.classList.remove('switching');
        });
      }, 240);
    } else {
      stageBody.innerHTML = stageHTML(d, i);
      stageBg.style.backgroundImage = `url('${d.hero}')`;
      stageBody.querySelectorAll('img').forEach(fadeInImg);
    }
    updateArrows(i);
  }

  function updateArrows(i) {
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === dynasties.length - 1;
  }

  /* 长轴滚动：scroll-spy 高亮最近节点 + 更新进度线 */
  function onTrackScroll() {
    const { scrollLeft, scrollWidth, clientWidth } = track;
    const max = scrollWidth - clientWidth;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollLeft / max) : 0})`;

    if (programmatic || Date.now() < suppressUntil) {
      if (programmatic && Date.now() >= suppressUntil) programmatic = false;
      return;
    }
    const lineLeft = track.getBoundingClientRect().left;
    // 探测点取长轴左侧 18%：节点吸附到左端时其轴心最近，与 scroll-snap 落点一致
    const probe = lineLeft + track.clientWidth * 0.18;
    let best = 0;
    let bestDist = Infinity;
    stations.forEach((st, j) => {
      const node = st.querySelector('.tl-node');
      const c = node.getBoundingClientRect().left + node.offsetWidth / 2;
      const dist = Math.abs(c - probe);
      if (dist < bestDist) {
        bestDist = dist;
        best = j;
      }
    });
    if (best !== active) setActive(best, { animate: true });
  }

  let rafPending = false;
  track.addEventListener(
    'scroll',
    () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        onTrackScroll();
      });
    },
    { passive: true }
  );

  /* 交互：点轴珠直接入厅；点卡片选中 / 已选中则入厅 */
  track.addEventListener('click', (e) => {
    const st = e.target.closest('.tl-station');
    if (!st) return;
    const i = Number(st.dataset.index);
    if (e.target.closest('.tl-node')) {
      location.href = `dynasty.html?id=${st.dataset.id}`;
      return;
    }
    const wasActive = i === active;
    setActive(i, { scroll: true, animate: !wasActive });
    if (wasActive) location.href = `dynasty.html?id=${st.dataset.id}`;
  });

  prevBtn.addEventListener('click', () => setActive(active - 1, { scroll: true }));
  nextBtn.addEventListener('click', () => setActive(active + 1, { scroll: true }));

  /* 初始：第一朝 */
  setActive(0, { animate: false });
  requestAnimationFrame(() => onTrackScroll());
}

/* ───────────────────────── 馆藏撷珍 ───────────────────────── */
function initFeatured(dynasties, garments) {
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
