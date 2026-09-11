/* ============================================================
   华服设计局 · 交互控制
   ============================================================ */
document.getElementById('nav-slot').innerHTML = navHTML('paper');
document.getElementById('footer-slot').innerHTML = footerHTML();

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = (x) => (x ? x.key || x.id : null);

/* ── 全局状态 ── */
let dynastyMap = new Map();
const free = {
  era: 'preqin',
  identity: null,
  stage: 'setup',                 // setup | studio | result
  options: null,
  choice: { body: null, sleeve: null, color: null, pattern: null, belt: null, accessory: null },
  result: null,
  serial: null,
};
const ch = {
  stage: 'intro',                 // intro | play | result
  question: null,
  picked: {},
  result: null,
  serial: null,
};

/* ───────────────────────── 视图切换 ───────────────────────── */
const VIEWS = {
  gate: '#view-gate',
  freeSetup: '#view-free-setup',
  freeStudio: '#view-free-studio',
  freeResult: '#view-free-result',
  chIntro: '#view-challenge-intro',
  chPlay: '#view-challenge-play',
  chResult: '#view-challenge-result',
};
function showView(name) {
  Object.values(VIEWS).forEach((v) => $(v).classList.remove('active'));
  $(VIEWS[name]).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function setTab(mode) {
  $$('#mode-tabs .at-tab').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
}
function gotoFree() {
  setTab('free');
  showView({ setup: 'freeSetup', studio: 'freeStudio', result: 'freeResult' }[free.stage]);
}
function gotoChallenge() {
  setTab('challenge');
  showView({ intro: 'chIntro', play: 'chPlay', result: 'chResult' }[ch.stage]);
}

$$('#mode-tabs .at-tab').forEach((btn) =>
  btn.addEventListener('click', () => {
    const m = btn.dataset.mode;
    if (m === 'gate') { setTab('gate'); showView('gate'); }
    if (m === 'free') gotoFree();
    if (m === 'challenge') gotoChallenge();
  })
);

/* ───────────────────────── 初始化数据 ───────────────────────── */
async function init() {
  const [dynasties, garments] = await Promise.all([
    api('/api/dynasties'),
    api('/api/garments'),
  ]);
  dynastyMap = new Map(dynasties.map((d) => [d.id, d]));
  bindGarments(garments);
  renderEraGrid();
  selectEra('preqin');
}

/* ───────────────────────── 自由设计：场景选择 ───────────────────────── */
function renderEraGrid() {
  $('#era-grid').innerHTML = [...dynastyMap.values()]
    .map(
      (d) => `
    <button class="at-era-btn ${d.id === free.era ? 'active' : ''}" data-era="${d.id}">
      <span class="t">${esc(d.name)}</span>
      <span class="y">${esc(d.name_en)}</span>
    </button>`
    )
    .join('');
  $('#era-grid').addEventListener('click', (e) => {
    const b = e.target.closest('.at-era-btn');
    if (b) selectEra(b.dataset.era);
  });
}

function selectEra(era) {
  free.era = era;
  free.identity = null;
  $$('#era-grid .at-era-btn').forEach((b) => b.classList.toggle('active', b.dataset.era === era));

  const ids = IDENTITIES.filter((x) => x.era === era);
  $('#id-grid').innerHTML = ids
    .map(
      (x) => `
    <button class="at-id-btn" data-name="${esc(x.name)}">
      <span class="nm">${esc(x.name)}</span>
      <span class="ht">${esc(x.hint)}</span>
    </button>`
    )
    .join('');
  updateSceneNow();
}

$('#id-grid').addEventListener('click', (e) => {
  const b = e.target.closest('.at-id-btn');
  if (!b) return;
  free.identity = IDENTITIES.find((x) => x.era === free.era && x.name === b.dataset.name);
  $$('#id-grid .at-id-btn').forEach((x) =>
    x.classList.toggle('active', x === b));
  updateSceneNow();
});

function updateSceneNow() {
  const d = dynastyMap.get(free.era);
  if (free.identity) {
    $('#scene-now').innerHTML =
      `将为 <b>${esc(d.name)}</b> 的 <b>${esc(free.identity.name)}</b> 裁衣 —— ${esc(free.identity.hint)}`;
    $('#enter-studio').disabled = false;
  } else {
    $('#scene-now').innerHTML = `已择朝代 <b>${esc(d.name)}</b>，请再择一位人物身份`;
    $('#enter-studio').disabled = true;
  }
}

/* ───────────────────────── 自由设计：工作台 ───────────────────────── */
const SLOT_VIEW = [
  { key: 'body', cn: '衣身', en: 'Garment' },
  { key: 'sleeve', cn: '袖型', en: 'Sleeve' },
  { key: 'color', cn: '颜色', en: 'Colour' },
  { key: 'pattern', cn: '纹样', en: 'Pattern' },
  { key: 'belt', cn: '腰带', en: 'Belt' },
  { key: 'accessory', cn: '配饰', en: 'Accessory', optional: true },
];

$('#enter-studio').addEventListener('click', enterStudio);

function enterStudio() {
  if (!free.identity) return;
  free.options = freeOptions(free.identity);
  free.choice = { body: null, sleeve: null, color: null, pattern: null, belt: null, accessory: null };
  free.stage = 'studio';
  renderStudio();
  gotoFree();
}

function badgesFor(item, idn) {
  const out = [];
  if (isYi(item, idn)) out.push('<span class="mini-badge yi">宜配</span>');
  else if (!eraFit(item, idn.era)) out.push('<span class="mini-badge cross">跨朝</span>');
  if (item.royal && idn.role !== 'emperor') out.push('<span class="mini-badge cross">帝王</span>');
  return out.join('');
}

function optBodyCard(b, idn, chosen) {
  return `
  <button class="at-opt ${chosen ? 'selected' : ''}" data-id="${esc(b.key)}">
    <img class="at-opt-img" src="${imgProxy(b.image)}" alt="${esc(b.key)}" loading="lazy">
    <div class="at-opt-body">
      <div class="at-opt-name">${esc(b.key)}</div>
      <div class="at-opt-era">${esc(eraNameOf(b.era))} · ${esc(b.gender)}</div>
      <div class="at-opt-badges">${badgesFor(b, idn)}</div>
    </div>
  </button>`;
}
function optPlainCard(x, idn, chosen) {
  return `
  <button class="at-opt plain ${chosen ? 'selected' : ''}" data-id="${esc(uid(x))}">
    <div class="at-opt-body">
      <div class="at-opt-name">${esc(x.name)}</div>
      <div class="at-opt-note">${esc(x.note || '')}</div>
      <div class="at-opt-badges">${badgesFor(x, idn)}</div>
    </div>
  </button>`;
}
function optColorCard(x, idn, chosen) {
  return `
  <button class="at-opt color ${chosen ? 'selected' : ''}" data-id="${esc(x.id)}">
    <div class="at-swatch" style="background:${esc(x.hex)}"><span class="hex">${esc(x.hex)}</span></div>
    <div class="at-opt-body">
      <div class="at-opt-name">${esc(x.name)}</div>
      <div class="at-opt-badges">${badgesFor(x, idn)}</div>
    </div>
  </button>`;
}

function renderStudio() {
  const idn = free.identity;
  const d = dynastyMap.get(idn.era);

  $('#free-slots').innerHTML = SLOT_VIEW.map((slot, i) => {
    let cards;
    if (slot.key === 'body') {
      cards = free.options.body.map((b) => optBodyCard(b, idn, free.choice.body === b)).join('');
    } else if (slot.key === 'color') {
      cards = free.options.color.map((x) => optColorCard(x, idn, free.choice.color === x)).join('');
    } else {
      const list = free.options[slot.key];
      cards = list.map((x) => optPlainCard(x, idn, free.choice[slot.key] === x)).join('');
    }
    return `
    <section class="at-slot" data-slot="${slot.key}">
      <div class="at-slot-head">
        <div class="at-slot-title"><span class="num">${['壹', '贰', '叁', '肆', '伍', '陆'][i]}</span>${slot.cn}</div>
        <div class="at-slot-hint">${slot.optional ? '可略过不施' : '横向滑动 · 宜配置顶，跨朝亦可'}${slot.key === 'body' ? ' · 取自本馆馆藏' : ''}</div>
      </div>
      <div class="at-rail">${cards}</div>
    </section>`;
  }).join('') + `
    <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">
      <button class="btn-outline" id="btn-autofit">听尚衣局建议 · 一键取宜</button>
      <button class="btn-text" id="btn-clear">清空重搭</button>
      <span style="font-size:13px;color:var(--ink-text-3);letter-spacing:2px">当前：${esc(d.name)} · ${esc(idn.name)}</span>
    </div>`;

  bindSlotClicks();
  $('#btn-autofit').addEventListener('click', autoFit);
  $('#btn-clear').addEventListener('click', () => {
    free.choice = { body: null, sleeve: null, color: null, pattern: null, belt: null, accessory: null };
    renderStudio();
    updatePreview();
  });
  updatePreview();
}

function bindSlotClicks() {
  $$('#free-slots .at-slot').forEach((sec) => {
    sec.addEventListener('click', (e) => {
      const btn = e.target.closest('.at-opt');
      if (!btn) return;
      const key = sec.dataset.slot;
      const list = free.options[key];
      const item = list.find((x) => String(uid(x)) === btn.dataset.id);
      free.choice[key] = free.choice[key] === item ? null : item;
      sec.querySelectorAll('.at-opt').forEach((b) =>
        b.classList.toggle('selected', b === btn && free.choice[key]));
      updatePreview();
    });
  });
}

/* 一键取宜：全部选评分最高的宜配 */
function autoFit() {
  const idn = free.identity;
  const pickBest = (list) =>
    list.find((x) => isYi(x, idn)) || list.find((x) => eraFit(x, idn));
  free.choice = {
    body: free.options.body.find((b) => isYi(b, idn)) || free.options.body[0],
    sleeve: pickBest(free.options.sleeve),
    color: pickBest(free.options.color),
    pattern: pickBest(free.options.pattern),
    belt: pickBest(free.options.belt),
    accessory: pickBest(free.options.accessory),
  };
  renderStudio();
}

function updatePreview() {
  const c = free.choice;
  const img = $('#pv-img');
  if (c.body) {
    $('#pv-empty').style.display = 'none';
    img.style.display = 'block';
    if (img.dataset.src !== c.body.image) {
      img.classList.remove('loaded');
      img.dataset.src = c.body.image;
      img.src = imgProxy(c.body.image);
      img.onload = () => img.classList.add('loaded');
    } else { img.classList.add('loaded'); }
    $('#pv-name').textContent = c.body.key;
    $('#pv-caption').textContent = `${eraNameOf(c.body.era)} · ${c.body.gender}性 · ${c.body.note.slice(0, 18)}…`;
  } else {
    $('#pv-empty').style.display = 'grid';
    img.style.display = 'none';
    img.removeAttribute('src');
    img.dataset.src = '';
    $('#pv-name').innerHTML = '&nbsp;';
    $('#pv-caption').textContent = '先择一件衣身';
  }

  const rows = [
    ['袖型', c.sleeve], ['颜色', c.color], ['纹样', c.pattern],
    ['腰带', c.belt], ['配饰', c.accessory],
  ];
  $('#pv-list').innerHTML = rows.map(([k, v]) => `
    <div class="at-pv-row">
      <span class="k">${k}</span>
      <span class="v ${v ? '' : 'empty'}">${v ? esc(v.name) : '未择'}</span>
    </div>`).join('');

  $('#btn-finish').disabled = !c.body;
}

$('#btn-finish').addEventListener('click', () => {
  if (!free.choice.body) return;
  free.result = evaluate(free.identity, free.choice);
  free.serial = cardSerial({ f: free.era, i: free.identity.name, c: Object.values(free.choice).map(uid) });
  renderFreeVerdict();
  free.stage = 'result';
  gotoFree();
  drawFreeCard();
});

$('#btn-tweak').addEventListener('click', () => {
  free.stage = 'studio';
  renderStudio();
  gotoFree();
});
$('#btn-reset-free').addEventListener('click', () => {
  free.stage = 'setup';
  free.result = null;
  gotoFree();
});
$('#btn-goto-challenge').addEventListener('click', () => { gotoChallenge(); });

/* ───────────────────────── 自由设计：评案 + 卡片 ───────────────────────── */
function verdictNotesHTML(result) {
  const groups = [];
  const labels = { body: '衣身', sleeve: '袖型', color: '颜色', pattern: '纹样', belt: '腰带', accessory: '配饰' };
  SLOT_ORDER.forEach((k) => {
    const j = result.slots[k];
    const reasons = (j.reasons || []).filter((r) => r.t !== 'muted');
    if (!reasons.length) return;
    groups.push(`<div style="margin-bottom:6px;font-family:var(--xiaowei);color:var(--cinnabar);letter-spacing:3px;font-size:14px">${labels[k]}</div>`);
    reasons.slice(0, 3).forEach((r) =>
      groups.push(`<div class="at-note ${r.t}"><span class="mk">${r.t === 'good' ? '◯' : r.t === 'bad' ? '✕' : '◌'}</span><span>${esc(r.text)}</span></div>`));
  });
  if (result.synergies.length) {
    groups.push('<div style="margin:14px 0 6px;font-family:var(--xiaowei);color:var(--gold);letter-spacing:3px;font-size:14px">成套之妙</div>');
    result.synergies.slice(0, 3).forEach((s) =>
      groups.push(`<div class="at-note synergy"><span class="mk">✦</span><span>${esc(s.text)}</span></div>`));
  }
  return groups.join('');
}

function dimsHTML(dims) {
  return `
  <div class="at-dims">
    ${[
    ['符合时代', dims.era],
    ['身份匹配', dims.role],
    ['色彩协调', dims.color],
    ['搭配和谐', dims.harmony],
  ].map(([label, d]) => `
    <div class="at-dim">
      <div class="at-dim-top"><span>${label} · <span class="vd">${esc(d.verdict)}</span></span><span>${d.score}</span></div>
      <div class="at-bar"><i data-w="${d.score}"></i></div>
    </div>`).join('')}
  </div>`;
}

function animateBars(scope) {
  requestAnimationFrame(() =>
    setTimeout(() => scope.querySelectorAll('.at-bar i').forEach((el) => (el.style.width = el.dataset.w + '%')), 80));
}

function renderFreeVerdict() {
  const r = free.result;
  const idn = free.identity;
  const d = dynastyMap.get(idn.era);
  const phrases = (r.phrases.length ? r.phrases : ['可再加斟酌'])
    .map((p) => `<span class="at-phrase ${p.includes('冲突') || p.includes('错位') || p.includes('失谐') ? 'bad' : ''}">${esc(p)}</span>`)
    .join('');

  $('#free-verdict').innerHTML = `
    <div class="at-score-row">
      <div class="at-score-num">${r.total}<small>/100</small></div>
      <div>
        <div class="at-score-title">${esc(r.title)}</div>
        <div class="at-score-sub">为${esc(d.name)} · ${esc(idn.name)} 裁成的这一袭</div>
      </div>
    </div>
    <div class="at-phrases">${phrases}</div>
    ${dimsHTML(r.dims)}
    <div class="at-notes">${verdictNotesHTML(r)}</div>`;
  animateBars($('#free-verdict'));
}

async function drawFreeCard() {
  const canvas = $('#design-card');
  canvas.getContext('2d').clearRect(0, 0, 900, 1280);
  await drawDesignCard(canvas, {
    mode: 'free',
    dynasty: dynastyMap.get(free.identity.era),
    identity: free.identity,
    choices: free.choice,
    result: free.result,
    serial: free.serial,
  });
  $('#download-card').href = canvas.toDataURL('image/png');
}

/* ───────────────────────── 考据挑战 ───────────────────────── */
$('#gate-free').addEventListener('click', () => { free.stage = 'setup'; gotoFree(); });
$('#gate-challenge').addEventListener('click', () => { ch.stage = 'intro'; gotoChallenge(); });
$('#btn-draw').addEventListener('click', drawQuestion);
$('#btn-next-challenge').addEventListener('click', drawQuestion);
$('#btn-challenge-to-free').addEventListener('click', gotoFree);

function drawQuestion() {
  ch.question = generateChallenge();
  ch.picked = {};
  ch.result = null;
  ch.stage = 'play';
  renderChallengePlay();
  gotoChallenge();
}

function renderChallengePlay() {
  const { identity: idn, options } = ch.question;
  const d = dynastyMap.get(idn.era);

  $('#ch-top').innerHTML = `
    <span class="seal square at-ch-seal" style="background:var(--jade)">考<br>据</span>
    <div class="at-ch-ask">
      <div class="lab">Question · 考题</div>
      <div class="who">${esc(d.name)} · ${esc(idn.name)}</div>
      <div class="hint">身份提示：<b>${esc(idn.hint)}</b>　|　性别：${esc(idn.gender)}</div>
    </div>
    <div class="at-ch-actions">
      <button class="btn-text" id="btn-redraw">↻ 重新抽签</button>
    </div>`;
  $('#btn-redraw').addEventListener('click', drawQuestion);

  const slotCN = { body: '衣身', sleeve: '袖型', color: '颜色', pattern: '纹样', belt: '腰带', accessory: '配饰' };
  $('#ch-grid').innerHTML = SLOT_ORDER.map((key, i) => {
    const optsHTML = options[key].map((x) => {
      let inner;
      if (key === 'body') {
        inner = `<img src="${imgProxy(x.image)}" alt="" style="width:46px;height:56px;object-fit:cover;flex:none;background:var(--paper-3)">
                 <span><span class="nm">${esc(x.key)}</span></span>`;
      } else if (key === 'color') {
        inner = `<span style="width:30px;height:30px;background:${esc(x.hex)};flex:none;border:1px solid var(--paper-line)"></span>
                 <span class="nm">${esc(x.name)}</span>`;
      } else {
        inner = `<span class="nm">${esc(x.name)}</span>`;
      }
      return `
      <button class="at-ch-opt" data-slot="${key}" data-id="${esc(uid(x))}">
        <span class="rad"></span>${inner}<span class="mini-dot"></span>
      </button>`;
    }).join('');
    return `
    <section class="at-ch-slot" data-slot="${key}">
      <div class="at-slot-title"><span class="num">${['壹', '贰', '叁', '肆', '伍', '陆'][i]}</span>${slotCN[key]}</div>
      <div class="at-ch-options">${optsHTML}</div>
    </section>`;
  }).join('');

  $$('#ch-grid .at-ch-slot').forEach((sec) =>
    sec.addEventListener('click', onChallengePick)
  );
  updateChallengeProgress();
  $('#btn-submit').disabled = true;
  $('#btn-submit').onclick = submitChallenge;
}

function onChallengePick(e) {
  if (ch.result) return;
  const btn = e.target.closest('.at-ch-opt');
  if (!btn) return;
  const key = btn.dataset.slot;
  const list = ch.question.options[key];
  const item = list.find((x) => String(uid(x)) === btn.dataset.id);
  ch.picked[key] = item;
  btn.closest('.at-ch-slot').querySelectorAll('.at-ch-opt').forEach((b) =>
    b.classList.toggle('selected', b === btn));
  updateChallengeProgress();
}

function updateChallengeProgress() {
  const n = SLOT_ORDER.filter((k) => ch.picked[k]).length;
  $('#ch-progress').innerHTML = `已搭配 <b>${n}</b> / 6　<span style="color:var(--ink-text-3)">（六格齐备方可交卷）</span>`;
  $('#btn-submit').disabled = n < 6;
}

function submitChallenge() {
  const c = ch.picked;
  ch.result = evaluate(ch.question.identity, c);
  ch.serial = cardSerial({ q: ch.question.identity.name, c: SLOT_ORDER.map((k) => uid(c[k])) });

  /* 标记正解 / 错选 */
  const { answer } = ch.question;
  $$('#ch-grid .at-ch-slot').forEach((sec) => {
    const key = sec.dataset.slot;
    const ideal = answer[key];
    sec.querySelectorAll('.at-ch-opt').forEach((btn) => {
      btn.classList.add('locked');
      const list = ch.question.options[key];
      const item = list.find((x) => String(uid(x)) === btn.dataset.id);
      const dot = btn.querySelector('.mini-dot');
      if (uid(item) === uid(ideal)) { btn.classList.add('correct'); dot.textContent = '正'; }
      else if (uid(item) === uid(c[key])) { btn.classList.add('wrong'); dot.textContent = '误'; }
      else btn.classList.add('dim');
    });
  });

  $('#btn-submit').disabled = true;
  $('#btn-submit').textContent = '已交卷 · 评案如下 ↓';
  renderChallengeResult();
  ch.stage = 'result';
  setTab('challenge');
  setTimeout(() => {
    showView('chResult');
    drawChallengeCard();
  }, 1400);
}

function chGrade(s) {
  return s >= 90 ? ['甲 · 上品', '衣冠博学家，可入尚衣局供奉！']
    : s >= 75 ? ['乙 · 佳品', '针线老到，于历代冠服已得大半']
    : s >= 60 ? ['丙 · 中品', '粗知形制，细节处尚需用功']
    : s >= 40 ? ['丁 · 尚可', '时代与身份多有错置，建议回馆再览']
    : ['劣 · 不逮', '张冠李戴，几近穿越——快去馆藏中补补课'];
}

function renderChallengeResult() {
  const r = ch.result;
  const idn = ch.question.identity;
  const d = dynastyMap.get(idn.era);
  const c = ch.picked;
  const { answer } = ch.question;
  const [grade, gradeComment] = chGrade(r.total);
  const slotCN = { body: '衣身', sleeve: '袖型', color: '颜色', pattern: '纹样', belt: '腰带', accessory: '配饰' };

  const analysisHTML = SLOT_ORDER.map((key) => {
    const j = r.slots[key];
    const picked = c[key];
    const ideal = answer[key];
    const samePick = uid(picked) === uid(ideal);
    const reasonTxt = (j.reasons || [])
      .filter((x) => x.t !== 'muted')
      .map((x) => `<div class="at-note ${x.t}"><span class="mk">${x.t === 'good' ? '◯' : x.t === 'bad' ? '✕' : '◌'}</span><span>${esc(x.text)}</span></div>`)
      .join('');
    return `
    <div class="at-an-row">
      <div>
        <div class="at-an-slot">${slotCN[key]}</div>
        <div class="at-an-score">${j.score} / 2</div>
      </div>
      <div>
        <div class="at-an-pick">
          所择：<span class="${samePick ? 'ans' : 'bad'}">${esc(picked ? (picked.key || picked.name) : '—')}</span>
          ${samePick ? '' : `　正解：<span class="ans">${esc(ideal.key || ideal.name)}</span>`}
        </div>
        <div class="at-an-reasons">
          ${reasonTxt}
          ${samePick ? `<div class="at-note good"><span class="mk">◯</span><span>${esc(ideal.note || '')}</span></div>`
            : `<div class="at-note synergy"><span class="mk">※</span><span>考据：${esc(ideal.note || '')}</span></div>`}
        </div>
      </div>
    </div>`;
  }).join('');

  $('#ch-verdict').innerHTML = `
    <div class="at-score-row">
      <span class="seal square at-grade-seal">${esc(grade.split(' · ')[0])}</span>
      <div>
        <div class="at-score-num">${r.total}<small>/100</small></div>
        <div class="at-score-title" style="margin-top:6px">${esc(grade)}</div>
        <div class="at-score-sub">${esc(d.name)} · ${esc(idn.name)} ｜ ${esc(gradeComment)}</div>
      </div>
    </div>
    <div class="at-phrases">
      ${r.phrases.map((p) => `<span class="at-phrase ${p.includes('冲突') || p.includes('错位') || p.includes('失谐') ? 'bad' : ''}">${esc(p)}</span>`).join('')}
    </div>
    ${dimsHTML(r.dims)}
    <div class="at-analysis">${analysisHTML}</div>
    ${r.synergies.length ? `<div class="at-notes">${r.synergies.map((s) =>
      `<div class="at-note synergy"><span class="mk">✦</span><span>${esc(s.text)}</span></div>`).join('')}</div>` : ''}`;
  animateBars($('#ch-verdict'));
}

async function drawChallengeCard() {
  const canvas = $('#challenge-card');
  canvas.getContext('2d').clearRect(0, 0, 900, 1280);
  await drawDesignCard(canvas, {
    mode: 'challenge',
    dynasty: dynastyMap.get(ch.question.identity.era),
    identity: ch.question.identity,
    choices: ch.picked,
    result: ch.result,
    serial: ch.serial,
  });
  $('#download-challenge-card').href = canvas.toDataURL('image/png');
}

/* ── 启动 ── */
init().catch((e) => {
  console.error(e);
  $('#view-gate').insertAdjacentHTML(
    'beforeend',
    '<div class="empty" style="grid-column:1/-1"><p>雅集数据加载失败，请稍后刷新重试</p></div>'
  );
});
