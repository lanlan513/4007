/* ============================================================
   穿越时空寻衣 —— 互动探索 + 自由浏览
   探索模式：领任务 → 用朝代/身份/性别/类别/关键词逐步收窄
            → 点击候选「验藏」→ 成功则展示释义与历史知识
   浏览模式：传统馆藏检索（向后兼容 ?dynasty=&category=&q= 等参数）
   ============================================================ */
document.getElementById('nav-slot').innerHTML = navHTML('paper');
document.getElementById('footer-slot').innerHTML = footerHTML();

/* ── 全局数据 ── */
let DYNASTIES = [];      // 朝代（含 id/name）
let META = null;         // { categories, genders, identities }
let SCENES = [];
let ALL = [];            // 全部服饰（含 identity 字段）

const nameToDynasty = new Map();

const filters = { q: '', dynasty: '全部', identity: '全部', gender: '全部', category: '全部' };
let quest = null;        // 当前任务
let steps = 0;           // 已用步数
let hintShown = false;   // 点睛提示词是否已揭示
let won = false;

const $ = (id) => document.getElementById(id);

/* 等价于服务端 q 匹配：名称/材质/描述/形制/色彩/朝代名 */
function matchKeyword(g, kw) {
  if (!kw) return true;
  const hay = [g.name, g.material, g.description, g.form, g.colors, g.dynasty_name].join(' ');
  return hay.includes(kw);
}

function applyFilters(list, f) {
  return list.filter((g) =>
    (f.dynasty === '全部' || g.dynasty_id === f.dynasty) &&
    (f.identity === '全部' || g.identity === f.identity) &&
    (f.gender === '全部' || g.gender === f.gender) &&
    (f.category === '全部' || g.category === f.category) &&
    matchKeyword(g, f.q)
  );
}

/* ── chips 通用构造 ── */
function fillChips(container, values, stateKey, onChange) {
  container.insertAdjacentHTML(
    'beforeend',
    values.map((v) =>
      `<button class="chip ${v.value === '全部' ? 'active' : ''}" data-v="${esc(v.value)}">${esc(v.label)}</button>`
    ).join('')
  );
  container.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    if (filters[stateKey] === b.dataset.v) return;
    filters[stateKey] = b.dataset.v;
    container.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === b));
    steps++;
    onChange();
  });
}

/* ============================================================
   任务入口（Gate）
   ============================================================ */
function renderGate() {
  // 朝代
  const gd = $('gate-dynasties');
  gd.innerHTML = DYNASTIES.map((d) =>
    `<button class="gate-chip" data-mode="dynasty" data-key="${esc(d.id)}">${esc(d.name)}<small>${esc(d.years.replace(/^约?/, ''))}</small></button>`
  ).join('');

  // 身份
  const gi = $('gate-identities');
  gi.innerHTML = META.identities.map((v) =>
    `<button class="gate-chip" data-mode="identity" data-key="${esc(v)}">${esc(v)}</button>`
  ).join('');

  // 场景
  const gs = $('gate-scenes');
  gs.innerHTML = SCENES.map((s) => `
    <button class="scene-card" data-mode="scene" data-key="${esc(s.id)}">
      <span class="scene-name">${esc(s.name)}</span>
      <span class="scene-en">${esc(s.en)}</span>
      <span class="scene-desc">${esc(s.desc)}</span>
    </button>`).join('');

  const pick = (btn) => startQuest(btn.dataset.mode, btn.dataset.key);
  gd.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) pick(b); });
  gi.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) pick(b); });
  gs.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) pick(b); });
  $('btn-lucky').addEventListener('click', () => startQuest('random', ''));
}

/* ============================================================
   任务流程
   ============================================================ */
async function startQuest(mode, key, exclude) {
  const qs = new URLSearchParams();
  if (mode && mode !== 'random') { qs.set('mode', mode); qs.set('key', key); }
  if (exclude) qs.set('exclude', exclude);
  const url = `/api/quests/random${[...qs].length ? `?${qs}` : ''}`;

  $('mission-title').textContent = '正在开启时空通道…';
  $('gate').hidden = true;
  $('browse').hidden = true;
  $('quest').hidden = false;
  $('quest').scrollIntoView({ behavior: 'smooth', block: 'start' });

  quest = await api(url);
  quest.summon = quest.summon || { mode: mode || 'random', key: key || '' };
  resetQuestState();
  renderMission();
  renderQuestGrid();
}

function resetQuestState() {
  Object.assign(filters, { q: '', identity: '全部', gender: '全部', category: '全部' });
  // 「按朝代穿越」时替玩家把时代档案先翻到该朝（这是题面给出的条件）
  filters.dynasty = quest.summon.mode === 'dynasty' ? quest.target.dynasty_id : '全部';
  steps = 0;
  hintShown = false;
  won = false;
  $('q').value = '';
  $('judge').hidden = true;
  $('win').hidden = true;
  syncQuestChips();
}

function syncQuestChips() {
  const map = [
    ['f-dynasty', 'dynasty'],
    ['f-identity', 'identity'],
    ['f-gender', 'gender'],
    ['f-cat', 'category'],
  ];
  for (const [cid, key] of map) {
    $(cid).querySelectorAll('.chip').forEach((c) =>
      c.classList.toggle('active', c.dataset.v === filters[key]));
  }
}

/* 根据任务召唤方式生成任务标题 */
function missionTitle() {
  const t = quest.target;
  switch (quest.summon.mode) {
    case 'dynasty':
      return `穿越${t.dynasty_name} · 寻一身时世装束`;
    case 'identity':
      return `寻找一套「${quest.identity}」的服饰`;
    case 'scene':
      return `${quest.scene.name} · 历史现场寻衣`;
    default:
      return '无名密函 · 凭线索寻衣';
  }
}

/* 线索锁定状态 */
function clueState() {
  const t = quest.target;
  return [
    { key: 'dynasty', label: '朝代', need: '从信中情境推断其时代', value: t.dynasty_name, ok: filters.dynasty === t.dynasty_id },
    { key: 'identity', label: '身份', need: '信中人物是何身份', value: t.identity, ok: filters.identity === t.identity },
    { key: 'gender', label: '服属', need: '男装、女装抑或男女通服', value: t.gender, ok: filters.gender === t.gender },
    { key: 'category', label: '类别', need: '礼服 / 官服 / 常服 / 戎服，细读形制', value: t.category, ok: filters.category === t.category },
    { key: 'q', label: '关键词', need: '在搜索框输入形制或材质中独有的一词', value: `「${filters.q}」`, ok: !!(filters.q && matchKeyword(t, filters.q)) },
  ];
}

function renderMission() {
  const t = quest.target;
  $('mission-seal').textContent = quest.scene ? quest.scene.name.slice(0, 2) : '密函';
  $('mission-mode').textContent =
    `${t.dynasty_years} · ${quest.summon.mode === 'random' ? '随机密函' : '馆藏探索任务'}`;
  $('mission-title').textContent = missionTitle();
  $('mission-story').innerHTML =
    `<b>【信中人物】</b>${esc(quest.role)}<br><b>【密函原文】</b>${esc(quest.story)}`;
  renderClues();
}

function renderClues() {
  const states = clueState();
  const matched = states.filter((s) => s.ok).length;
  const pool = applyFilters(ALL, filters);

  $('clue-list').innerHTML = states.map((s) => `
    <li class="clue ${s.ok ? 'on' : ''}">
      <span class="clue-mark">${s.ok ? '✓' : '？'}</span>
      <span class="clue-label">${esc(s.label)}</span>
      <span class="clue-body">${s.ok
        ? `<em>${esc(s.value)}</em>`
        : `待锁定 · <span class="clue-need">${esc(s.need)}</span>`}</span>
    </li>`).join('');

  $('mp-clues').textContent = `已锁定线索 ${matched} / 5`;
  $('mp-pool').textContent = `馆藏中尚余 ${pool.length} 件候选`;
  $('mp-fill').style.width = `${(matched / 5) * 100}%`;
  $('mp-steps').textContent = `已用 ${steps} 步 · 目标藏于候选之中，点击卡片「验藏」`;

  // 候选收窄到 8 件以内，赠点睛一词
  const hintEl = $('mission-hint');
  if (!hintShown && pool.length <= 8 && pool.length > 0) hintShown = true;
  hintEl.innerHTML = hintShown
    ? `◆ 馆长密赠点睛一词，可入搜索框一试：<b>「${esc(quest.hint)}」</b>（此词唯此衣有之）`
    : '◆ 提示：将候选收窄至 8 件以内，馆长会密赠你一个点睛之词。';

  // 唯一候选时呼吸高亮提示
  hintEl.classList.toggle('ready', pool.length === 1 && !won);
  if (pool.length === 1 && !won && pool[0].id === quest.target.id) {
    hintEl.innerHTML += ' <span class="pulse">档案已唯一，点开它验藏！</span>';
  }
}

/* 候选网格（探索模式：点击 = 验藏） */
function renderQuestGrid() {
  const list = applyFilters(ALL, filters);
  const grid = $('grid');
  const empty = $('empty');
  $('result-count').textContent = `候选 ${list.length} 件`;

  if (!list.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    renderClues();
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = list.map((g, i) => {
    const isTarget = g.id === quest.target.id;
    return `
    <article class="g-card quest-card reveal reveal-d${(i % 4) + 1} in" data-id="${g.id}">
      <div class="g-img">
        <img src="${esc(g.image)}" alt="${esc(g.name)}" loading="lazy">
        <span class="judge-ribbon">点此验藏</span>
      </div>
      <div class="g-body">
        <div class="g-dynasty">${esc(g.dynasty_name)} · ${esc(g.dynasty_years || '')}</div>
        <h3 class="g-name">${esc(g.name)}</h3>
        <div class="g-tags">
          <span class="tag cinnabar">${esc(g.category)}</span>
          <span class="tag">${esc(g.gender)}</span>
          ${g.identity ? `<span class="tag">${esc(g.identity)}</span>` : ''}
        </div>
      </div>
    </article>`;
  }).join('');

  grid.querySelectorAll('img').forEach(fadeInImg);
  grid.querySelectorAll('.quest-card').forEach((card) =>
    card.addEventListener('click', () => judge(Number(card.dataset.id))));
  renderClues();
}

/* 验藏 */
function judge(id) {
  if (won) return;
  const t = quest.target;
  const banner = $('judge');
  const locked = clueState().filter((s) => s.ok).length;
  const picked = ALL.find((g) => g.id === id);

  // 防止「开局盲猜」：未锁定任何线索前，即便点中目标也不予确认
  if (id === t.id && locked === 0) {
    banner.innerHTML = `
      <div class="jb-head"><span class="seal small" style="transform:rotate(-6deg)">慎</span>
        <div>档案馆员按住了你的手：尚未锁定任何线索，不可凭运气验藏。</div>
      </div>
      <ul><li>先用朝代、身份等筛选锁定至少一条线索，再来验明正身。</li></ul>`;
    banner.hidden = false;
    return;
  }

  if (id === t.id) {
    win();
    return;
  }

  // 比对未锁定的线索，给出针对性提示（不剧透答案）
  const states = clueState().filter((s) => !s.ok);
  const diffs = states.map((s) => {
    switch (s.key) {
      case 'dynasty': return `时代不符：此件来自${esc(picked.dynasty_name)}，再读读密函里的年代情境`;
      case 'identity': return `身份不符：此件为「${esc(picked.identity || '未详')}」之物，非信中人物`;
      case 'gender': return `服属不符：此件属${esc(picked.gender)}服`;
      case 'category': return `类别不符：此件是${esc(picked.category)}，对照形制线索再辨`;
      case 'q': return `少了关键一词：此件形制材质中，并无密函所指的独有特征`;
      default: return '';
    }
  });

  banner.innerHTML = `
    <div class="jb-head"><span class="seal small" style="transform:rotate(-6deg)">再<br>察</span>
      <div><b>「${esc(picked.name)}」</b>非密函所寻之衣。</div>
    </div>
    <ul>${diffs.map((d) => `<li>${d}</li>`).join('')}</ul>`;
  banner.hidden = false;
  banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  steps++;
  renderClues();
}

/* 寻衣成功 */
function win() {
  won = true;
  steps++;
  const t = quest.target;
  const states = clueState();
  renderClues();

  $('win-sub').textContent = `${t.dynasty_name} · ${t.dynasty_years}`;
  const img = $('win-img');
  img.src = t.image;
  img.alt = t.name;
  fadeInImg(img);
  $('win-caption').textContent = `${t.name} · ${t.category}（${t.gender}）`;

  // 为什么符合任务条件
  const why = [];
  why.push(`<b>时代相合</b>——它出自${t.dynasty_name}（${t.dynasty_years}），正是密函情境所指的年代。`);
  why.push(`<b>身份相合</b>——它是${quest.role}所服的${t.category}，与「${quest.identity}」身份吻合。`);
  why.push(`<b>服属相合</b>——馆藏标注为「${t.gender}」服。`);
  why.push(`<b>类别相合</b>——形制属${t.category}：${esc(t.form)}`);
  why.push(`<b>关键词相合</b>——点睛之词「${esc(quest.hint)}」唯见于此件的材质形制。`);
  why.push(`<b>场景相合</b>——此衣正可用于「${quest.scene.name}」：${esc(quest.scene.desc)}`);
  $('win-why').innerHTML = why.map((w) => `<li>${w}</li>`).join('');

  $('win-knowledge').textContent = quest.knowledge;
  const sameDynasty = ALL.filter((g) => g.dynasty_id === t.dynasty_id).length - 1;
  $('win-stats').innerHTML =
    `本局共历 <b>${steps}</b> 步 · 锁定线索 <b>${states.filter((s) => s.ok).length}/5</b> ·
     <a href="garment.html?id=${t.id}">前往展签细赏，同朝另有 ${sameDynasty} 件馆藏 →</a>`;
  $('win-detail').href = `garment.html?id=${t.id}`;

  $('win').hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeWin() {
  $('win').hidden = true;
  document.body.style.overflow = '';
}

/* ============================================================
   自由浏览
   ============================================================ */
const bFilters = { q: '', dynasty: '全部', identity: '全部', gender: '全部', category: '全部' };

function renderBrowseGrid() {
  const list = applyFilters(ALL, bFilters);
  const grid = $('b-grid');
  $('b-count').textContent = `共 ${list.length} 件藏品`;
  if (!list.length) {
    grid.innerHTML = '';
    $('b-empty').style.display = 'block';
    return;
  }
  $('b-empty').style.display = 'none';
  grid.innerHTML = list.map((g, i) => {
    const card = garmentCard(g, i);
    return g.identity
      ? card.replace('<div class="g-tags">', `<div class="g-tags"><span class="tag">${esc(g.identity)}</span>`)
      : card;
  }).join('');

  grid.querySelectorAll('img').forEach(fadeInImg);
  bindCardClicks(grid);
}

/* ============================================================
   初始化
   ============================================================ */
function buildQuestConsole() {
  fillChips($('f-dynasty'),
    [{ value: '全部', label: '全部' }, ...DYNASTIES.map((d) => ({ value: d.id, label: d.name }))],
    'dynasty', renderQuestGrid);
  fillChips($('f-identity'),
    [{ value: '全部', label: '全部' }, ...META.identities.map((v) => ({ value: v, label: v }))],
    'identity', renderQuestGrid);
  fillChips($('f-gender'),
    [{ value: '全部', label: '全部' }, ...META.genders.map((v) => ({ value: v, label: v }))],
    'gender', renderQuestGrid);
  fillChips($('f-cat'),
    [{ value: '全部', label: '全部' }, ...META.categories.map((v) => ({ value: v, label: v }))],
    'category', renderQuestGrid);

  let timer;
  $('q').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      filters.q = e.target.value.trim();
      steps++;
      $('judge').hidden = true;
      renderQuestGrid();
    }, 260);
  });

  $('btn-reset').addEventListener('click', () => {
    Object.assign(filters, { q: '', dynasty: '全部', identity: '全部', gender: '全部', category: '全部' });
    $('q').value = '';
    syncQuestChips();
    renderQuestGrid();
  });
  $('btn-another').addEventListener('click', () =>
    startQuest(quest.summon.mode, quest.summon.key, quest.target.id));
  $('btn-back-gate').addEventListener('click', showGate);

  $('win-close').addEventListener('click', closeWin);
  $('win-another').addEventListener('click', () => {
    closeWin();
    startQuest(quest.summon.mode, quest.summon.key, quest.target.id);
  });
  $('win-gate').addEventListener('click', () => { closeWin(); showGate(); });
  $('win').addEventListener('click', (e) => { if (e.target.id === 'win') closeWin(); });
}

/* 浏览模式 chips（独立 state） */
function buildBrowseConsole() {
  const bChips = (cid, entries, key) => {
    const box = $(cid);
    box.insertAdjacentHTML('beforeend',
      entries.map(({ value, label }) =>
        `<button class="chip ${value === '全部' ? 'active' : ''}" data-v="${esc(value)}">${esc(label)}</button>`).join(''));
    box.addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (!b || bFilters[key] === b.dataset.v) return;
      bFilters[key] = b.dataset.v;
      box.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === b));
      renderBrowseGrid();
    });
  };
  bChips('b-dynasty',
    [{ value: '全部', label: '全部' }, ...DYNASTIES.map((d) => ({ value: d.id, label: d.name }))],
    'dynasty');
  bChips('b-identity', ['全部', ...META.identities].map((v) => ({ value: v, label: v })), 'identity');
  bChips('b-gender', ['全部', ...META.genders].map((v) => ({ value: v, label: v })), 'gender');
  bChips('b-cat', ['全部', ...META.categories].map((v) => ({ value: v, label: v })), 'category');

  let timer;
  $('q-browse').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => { bFilters.q = e.target.value.trim(); renderBrowseGrid(); }, 260);
  });
}

function showGate() {
  $('quest').hidden = true;
  $('browse').hidden = true;
  $('gate').hidden = false;
  setModeTab('quest');
  window.scrollTo({ top: $('gate').offsetTop - 90, behavior: 'smooth' });
}

function setModeTab(mode) {
  document.querySelectorAll('.mode-tab').forEach((b) =>
    b.classList.toggle('active', b.dataset.mode === mode));
}

async function init() {
  [DYNASTIES, META, SCENES, ALL] = await Promise.all([
    api('/api/dynasties'),
    api('/api/meta'),
    api('/api/scenes'),
    api('/api/garments'),
  ]);
  DYNASTIES.forEach((d) => nameToDynasty.set(d.name, d));

  renderGate();
  buildQuestConsole();
  buildBrowseConsole();

  // 模式切换
  $('mode-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('.mode-tab');
    if (!b) return;
    setModeTab(b.dataset.mode);
    if (b.dataset.mode === 'browse') {
      $('gate').hidden = true;
      $('quest').hidden = true;
      $('browse').hidden = false;
      renderBrowseGrid();
    } else {
      showGate();
    }
  });

  // 向后兼容：collection.html?dynasty=ming&category=... → 直接进入浏览模式
  const p = new URLSearchParams(location.search);
  if (p.get('dynasty') || p.get('category') || p.get('q') || p.get('gender')) {
    if (p.get('dynasty')) bFilters.dynasty = p.get('dynasty');
    if (p.get('category')) bFilters.category = p.get('category');
    if (p.get('gender')) bFilters.gender = p.get('gender');
    if (p.get('q')) { bFilters.q = p.get('q'); $('q-browse').value = bFilters.q; }
    ['b-dynasty', 'b-gender', 'b-cat', 'b-identity'].forEach((cid) => {
      const key = { 'b-dynasty': 'dynasty', 'b-gender': 'gender', 'b-cat': 'category', 'b-identity': 'identity' }[cid];
      $(cid).querySelectorAll('.chip').forEach((c) =>
        c.classList.toggle('active', c.dataset.v === bFilters[key]));
    });
    setModeTab('browse');
    $('gate').hidden = true;
    $('browse').hidden = false;
    renderBrowseGrid();
  }
}

init().catch((e) => {
  $('gate').insertAdjacentHTML('beforeend',
    `<div class="empty"><p>馆藏数据加载失败，请稍后刷新重试</p></div>`);
  console.error(e);
});
