/* ============================================================
   华服设计局 · 评价引擎
   纯函数：选项适配、自由模式评价、考据挑战出题与判分
   ============================================================ */

/* 馆藏图床代理（规避 canvas 跨域污染，见 routes/game.js） */
const IMG_PROXY = '/api/game-img?u=';
const imgProxy = (url) => (url ? IMG_PROXY + encodeURIComponent(url) : '');

/* ── 馆藏数据回填：衣身键名 ↔ 数据库 garment 记录 ── */
const bodyByKey = new Map();
function bindGarments(garments) {
  bodyByKey.clear();
  BODIES.forEach((b) => {
    const g = garments.find((x) => x.name === b.key);
    bodyByKey.set(b.key, {
      ...b,
      id: g ? g.id : null,
      image: g ? g.image : '',
      colorsText: g ? g.colors : '',
      material: g ? g.material : '',
    });
  });
}
const getBody = (key) => bodyByKey.get(key) || BODIES.find((b) => b.key === key);
const allBodies = () => BODIES.map((b) => bodyByKey.get(b.key) || b);

/* ── 基础工具 ── */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const eraNameOf = (id) => (ERA_NAMES[id] || id);
const genderFit = (item, gender) => {
  if (!item) return false;
  if (typeof item.gender === 'string') return item.gender === '通' || item.gender === gender;
  if (Array.isArray(item.genders)) return item.genders.includes('通') || item.genders.includes(gender);
  return true; // 未标注性别者（如颜色）视为男女皆宜
};
const roleFit = (item, role) => !!item && (item.roles || []).includes(role);
const eraFit = (item, era) => {
  if (!item) return false;
  return Array.isArray(item.era) ? item.era.includes(era)
    : item.eras ? item.eras.includes(era) : item.era === era;
};
const formMid = (item) =>
  !item ? null
    : typeof item.form === 'number' ? item.form : (item.form[0] + item.form[1]) / 2;
const formOK = (item, occasion) =>
  item.form == null ? true
    : typeof item.form === 'number' ? Math.abs(item.form - occasion) <= 1
    : occasion >= item.form[0] && occasion <= item.form[1];

/* 朝代名映射（bindGarments 后亦可从 API 取，此为兜底） */
const ERA_NAMES = {
  preqin: '先秦', qinhan: '秦汉', weijin: '魏晋', suitang: '隋唐',
  song: '宋', yuan: '元', ming: '明', qing: '清',
};

/* 组件取中文名 */
const itemName = (x) => (x ? x.name || x.key : '未择');
const itemErasText = (x) =>
  (x.eras || (x.era ? [x.era] : [])).map(eraNameOf).join('、');

/* ─────────────────────────────────────────────
   成套彩蛋（协同加分）
   ───────────────────────────────────────────── */
const SYNERGIES = [
  { test: (c) => c.body.key === '冕服' && c.accessory?.id === 'a-mianliu',
    text: '冕服配冕旒，天子十二旒祭天，礼成天衣' },
  { test: (c) => c.body.key === '玄端' && c.belt?.id === 'b-dadai',
    text: '玄端束大带，方正端直，古意盎然' },
  { test: (c) => c.body.key === '文官朝服（进贤冠）' && c.accessory?.id === 'a-shou',
    text: '进贤冠垂印绶，汉官威仪，绶色即官阶' },
  { test: (c) => c.body.key === '圆领缺骻袍' && c.accessory?.id === 'a-futou' && c.belt?.id === 'b-kua',
    text: '幞头、圆领袍、銙带、长靴——大唐男子经典范式' },
  { test: (c) => c.body.key === '襕衫' && c.accessory?.id === 'a-futou',
    text: '白袍举子裹幞头，宋代科举的经典剪影' },
  { test: (c) => c.body.key === '齐胸襦裙' && c.accessory?.id === 'a-pibo',
    text: '齐胸红裙肩披帛，周昉笔下的大唐仕女' },
  { test: (c) => c.body.key === '袆衣' && c.pattern?.id === 'p-zhai',
    text: '深青袆衣织翟成行，后妃之德，秩序成章' },
  { test: (c) => c.body.key === '袆衣' && c.accessory?.id === 'a-huaguan',
    text: '袆衣配花树冠两博鬓，皇后受册大礼，宋明凤冠之祖' },
  { test: (c) => c.body.key === '半臂' && c.pattern?.id === 'p-lianzhu',
    text: '联珠团窠锦半臂，长安最名贵的胡风时尚' },
  { test: (c) => c.body.key === '大袖' && c.accessory?.id === 'a-zhuchui',
    text: '大袖配珠翠团冠，宋代命妇礼服端方' },
  { test: (c) => c.body.key === '凤冠霞帔' && c.accessory?.id === 'a-xiapei',
    text: '凤冠霞帔，人生最隆重的一袭华服' },
  { test: (c) => c.body.key === '马面裙' && c.pattern?.id === 'p-shouniao',
    text: '马面裙门织花鸟裙襕，金彩辉煌' },
  { test: (c) => c.body.key === '褙子' && c.sleeve?.id === 'sl-dui',
    text: '褙子对襟敞袖，修长清雅如宋瓷' },
  { test: (c) => c.body.key === '直裰' && c.accessory?.id === 'a-dongpo',
    text: '直裰配东坡巾，士人燕居，平淡天真' },
  { test: (c) => c.body.key === '质孙服' && c.belt?.id === 'b-bianxian',
    text: '质孙纳石失配辫线腰线，诈马宴一色成章' },
  { test: (c) => c.body.key === '辫线袄' && c.accessory?.id === 'a-xue',
    text: '辫线袄束腰登皮靴，马上功夫利落' },
  { test: (c) => c.body.key === '袴褶' && c.sleeve?.id === 'sl-wan',
    text: '大口裤膝下绾结，袴褶急装，胡服骑射遗风' },
  { test: (c) => c.body.key === '袴褶' && c.accessory?.id === 'a-xue',
    text: '袴褶束结登皮靴，军中行止，马上如生' },
  { test: (c) => c.body.key === '大袖衫' && c.accessory?.id === 'a-shan',
    text: '宽衫大袖执麈尾，竹林名士放达之姿' },
  { test: (c) => c.body.key === '补服' && c.accessory?.id === 'a-wusha' && c.belt?.id === 'b-yu',
    text: '绯袍补子、乌纱玉带，大明衣冠最熟悉的模样' },
  { test: (c) => c.body.key === '飞鱼服' && c.accessory?.id === 'a-xiuchun',
    text: '飞鱼服佩绣春刀，锦衣卫传奇加身' },
  { test: (c) => c.body.key === '补褂（清代补服）' && c.accessory?.id === 'a-dingdai',
    text: '石青补褂配顶戴花翎，品级全在顶上' },
  { test: (c) => c.body.key === '明黄龙袍' && c.pattern?.id === 'p-long' && c.color?.id === 'c-minghuang',
    text: '明黄九龙、马蹄翻掸，帝王吉服气象森严' },
  { test: (c) => c.body.key === '旗装（衬衣 · 氅衣）' && c.accessory?.id === 'a-liangbatou',
    text: '氅衣十八镶、两把头簪花，晚清旗装风韵' },
  { test: (c) => c.body.key === '罟罟冠' && c.accessory?.id === 'a-gugu',
    text: '罟罟高冠缀珠翠雉尾，“各位高低都在姑姑帽上”' },
  { test: (c) => c.body.key === '杂裾垂髾服' && c.pattern?.id === 'p-xie',
    text: '三角髾片与长襳带齐飞，宛如洛神凌波' },
];

/* ─────────────────────────────────────────────
   单槽判分
   ───────────────────────────────────────────── */
function judgeBody(body, idn) {
  const reasons = [];
  if (!body) {
    return { score: 0, reasons: [{ t: 'warn', text: '尚未择定衣身' }] };
  }
  if (body.era !== idn.era) {
    return { score: 0, reasons: [{ t: 'bad', text: `此「${body.key}」乃${eraNameOf(body.era)}衣式，置于${eraNameOf(idn.era)}，时代错位` }] };
  }
  let score = 2;
  if (!roleFit(body, idn.role)) {
    score -= 1;
    reasons.push({ t: 'warn', text: `「${body.key}」本为${body.roles.map((r) => ROLES[r]).join('、')}之服，与「${idn.name}」身份不称` });
  }
  if (!genderFit(body, idn.gender)) {
    score -= 1;
    reasons.push({ t: 'warn', text: `衣身性别为${body.gender}，与${idn.gender}性身份不合` });
  }
  if (score === 2) reasons.push({ t: 'good', text: `衣身合于${eraNameOf(idn.era)}制度，正称身份` });
  return { score: Math.max(0, score), reasons };
}

function judgeGeneric(item, label, idn, opts = {}) {
  if (!item) return { score: 1, skipped: true, reasons: [{ t: 'muted', text: '未施配饰，简素自持' }] };
  const reasons = [];
  const inEra = eraFit(item, idn.era);
  const c = opts.choices || {};

  /* 僭越：帝王专用之色 / 章 */
  const yellowGrace = item === c.color && c.body?.key === '黄马褂'; // 明黄马褂本身即“赏穿”之恩
  if (item.royal && idn.role !== 'emperor' && !yellowGrace) {
    return {
      score: 0,
      reasons: [
        { t: 'bad', text: `「${itemName(item)}」为帝王专属，${idn.name}用之即是僭越，古制大忌` },
        ...(inEra ? [] : [{ t: 'bad', text: `且其制主要行于${itemErasText(item)}，亦非${eraNameOf(idn.era)}风尚` }]),
      ],
    };
  }

  if (!inEra) {
    return { score: 0, reasons: [{ t: 'bad', text: `「${itemName(item)}」行用于${itemErasText(item)}，未见于${eraNameOf(idn.era)}` }] };
  }

  let score = 2;
  if (!roleFit(item, idn.role)) {
    score -= 1;
    reasons.push({ t: 'warn', text: `「${itemName(item)}」更合${(item.roles || []).map((r) => ROLES[r]).join('、')}身份，${idn.name}用之稍觉不称` });
  }
  if (opts.checkGender && !genderFit(item, idn.gender)) {
    score -= 1;
    reasons.push({ t: 'warn', text: `「${itemName(item)}」多为${(item.genders || []).filter((g) => g !== '通').join('/')}性所用` });
  }
  if (opts.occasion && !formOK(item, opts.occasion)) {
    score -= 1;
    const [lo, hi] = Array.isArray(item.form) ? item.form : [item.form, item.form];
    reasons.push({ t: 'warn', text: `「${itemName(item)}」正式度合${FORMALITY[lo] || lo}${lo !== hi ? '至' + (FORMALITY[hi] || hi) : ''}场合，与此装不协` });
  }
  if (score === 2) reasons.push({ t: 'good', text: `「${itemName(item)}」合时合制` });
  return { score: Math.max(0, score), reasons };
}

/* ─────────────────────────────────────────────
   总评
   choices: { body, sleeve, color, pattern, belt, accessory }
   ───────────────────────────────────────────── */
function evaluate(idn, c) {
  const slotJudges = {
    body: judgeBody(c.body, idn),
    sleeve: judgeGeneric(c.sleeve, '袖型', idn, { checkGender: true, occasion: c.body?.form ?? 3 }),
    color: judgeGeneric(c.color, '颜色', idn, { choices: c }),
    pattern: judgeGeneric(c.pattern, '纹样', idn, { checkGender: true, occasion: c.body?.form ?? 3 }),
    belt: judgeGeneric(c.belt, '腰带', idn, { checkGender: true, occasion: c.body?.form ?? 3 }),
    accessory: judgeGeneric(c.accessory, '配饰', idn, { checkGender: true, occasion: c.body?.form ?? 3 }),
  };

  /* ── 维度一：时代 ── */
  const eraSlots = ['body', 'sleeve', 'color', 'pattern', 'belt'];
  const eraHits = eraSlots.filter((k) => slotJudges[k].score > 0 && eraFit(c[k], idn.era)).length;
  const accEra = c.accessory ? (eraFit(c.accessory, idn.era) ? 1 : 0) : 0.5;
  const eraScore = Math.round(((eraHits + accEra) / 6) * 100);

  /* ── 维度二：身份（含性别） ── */
  const roleHits = ['body', 'sleeve', 'color', 'pattern', 'belt'].filter((k) =>
    slotJudges[k].score > 0 && roleFit(c[k], idn.role) && genderFit(c[k], idn.gender)).length;
  const accRole = c.accessory
    ? roleFit(c.accessory, idn.role) && genderFit(c.accessory, idn.gender) ? 1 : 0
    : 0.5;
  const roleScore = Math.round(((roleHits + accRole) / 6) * 100);

  /* ── 维度三：色彩 ── */
  const conflicts = [];
  let colorScore = 50;
  const col = c.color;
  if (col) {
    if (eraFit(col, idn.era)) colorScore += 20; else { colorScore -= 15; conflicts.push(`「${col.name}」非${eraNameOf(idn.era)}典型色`); }
    const yellowGrace = col.royal && c.body?.key === '黄马褂';
    if (col.royal && idn.role !== 'emperor' && !yellowGrace) {
      colorScore = Math.min(colorScore, 25);
      conflicts.push(`「${col.name}」乃帝王独用之色，他人服用为僭越`);
    } else if (yellowGrace) {
      colorScore += 12; // 赏穿黄马褂，明黄即是恩荣本身
    } else if (roleFit(col, idn.role)) colorScore += 15;
    else colorScore -= 10;

    /* 时代审美调性 */
    const paleEras = ['song', 'weijin'];
    if (paleEras.includes(idn.era) && ['scholar', 'maiden'].includes(idn.role)) {
      if (col.sat === 'pale') colorScore += 10;
      if (col.sat === 'bright') { colorScore -= 10; conflicts.push(`${eraNameOf(idn.era)}清雅尚淡，「${col.name}」过于浓艳`); }
    }
    if (idn.era === 'suitang' && ['lady', 'maiden', 'noble'].includes(idn.role) &&
        ['bright', 'soft'].includes(col.sat)) colorScore += 8;
    if (['preqin', 'qinhan', 'qing'].includes(idn.era) && ['emperor', 'official'].includes(idn.role) &&
        ['low', 'deep'].includes(col.sat)) colorScore += 8;

    /* 色章相配 */
    const pat = c.pattern;
    if (pat) {
      if (pat.id === 'p-jinzhi' && col.family === 'gold') {
        colorScore -= 14;
        conflicts.push('织金衣料与「素面无纹」自相矛盾');
      }
      if ((pat.id === 'p-long' || pat.id === 'p-shierzhang') && col.id === 'c-minghuang') colorScore += 8;
      if (pat.id === 'p-zhai' && ['c-ganlan', 'c-mo', 'c-daiqing', 'c-shiqing'].includes(col.id)) colorScore += 8;
      if (pat.id === 'p-buzi' && ['blue', 'red'].includes(col.family) && col.sat === 'deep') colorScore += 6;
      if (pat.id === 'p-lianzhu' && ['gold', 'yellow'].includes(col.family)) colorScore += 6;
      if (pat.id === 'p-jinzhi' && ['pale', 'low'].includes(col.sat) && c.body?.form <= 3) colorScore += 6;
      /* 织金纳石失等重纹遇上高饱和撞色主调，金彩不显 */
      if (['p-nashi', 'p-long', 'p-shierzhang'].includes(pat.id) && col.sat === 'bright' &&
          !['gold', 'yellow'].includes(col.family)) colorScore -= 6;
    }
  }
  colorScore = Math.max(8, Math.min(100, colorScore));

  /* ── 维度四：和谐（正式度 / 形制 / 成套） ── */
  let harmonyScore = 70;
  const forms = [c.body && formMid(c.body), c.sleeve && formMid(c.sleeve), c.pattern && formMid(c.pattern),
    c.belt && formMid(c.belt), c.accessory && formMid(c.accessory)].filter((x) => x != null);
  if (forms.length >= 3) {
    const spread = Math.max(...forms) - Math.min(...forms);
    if (spread >= 3) {
      harmonyScore -= 18;
      conflicts.push('大典礼服与燕居便服混搭，场合轻重失序');
    } else if (spread === 2) harmonyScore -= 6;
  }

  /* 性别错位计数 */
  ['sleeve', 'pattern', 'belt', 'accessory'].forEach((k) => {
    const it = c[k];
    if (it && !genderFit(it, idn.gender)) {
      harmonyScore -= 7;
      conflicts.push(`「${itemName(it)}」与${idn.gender}性装束不协`);
    }
  });

  /* 形制互斥 */
  if (c.sleeve?.id === 'sl-wan' && c.body?.tag !== 'pants') {
    harmonyScore -= 10;
    conflicts.push('绾结束口乃袴褶急装之袖，施于袍衫不合');
  }
  if (c.pattern?.id === 'p-jinzhi' && c.body?.form >= 4) {
    harmonyScore -= 10;
    conflicts.push('隆礼重仪之场合，「素面无纹」失之过简');
  }
  if (c.body?.tag === 'vest' && c.sleeve && !['sl-wan', 'sl-zhai'].includes(c.sleeve.id) &&
      eraFit(c.sleeve, idn.era)) {
    /* 裲裆本罩于衫外，宽袖大衫亦可，略宽容不扣分 */
  }

  /* 成套彩蛋：仅当衣身合于时代、且着衣人身份相称时才算“成套”，
     避免穿越僭越的混搭反获彩蛋 */
  const coherent = c.body && c.body.era === idn.era &&
    roleFit(c.body, idn.role) && genderFit(c.body, idn.gender);
  const synergies = coherent ? SYNERGIES.filter((s) => {
    try { return s.test(c); } catch { return false; }
  }) : [];
  harmonyScore = Math.max(6, Math.min(100, harmonyScore + synergies.length * 7));

  /* ── 总分：六槽 85 分 + 成套 15 分 ── */
  const raw = Object.values(slotJudges).reduce((s, j) => s + j.score, 0);
  let total = Math.round((raw / 12) * 85 + Math.min(15, synergies.length * 5));
  if (conflicts.some((x) => x.includes('僭越'))) total -= 6;
  total = Math.max(0, Math.min(100, total));

  /* ── 评语与雅号 ── */
  const dims = {
    era: { score: eraScore, verdict: eraScore >= 90 ? '符合时代' : eraScore >= 60 ? '大体合制' : '时代错位' },
    role: { score: roleScore, verdict: roleScore >= 90 ? '身份相称' : roleScore >= 60 ? '身份尚可' : '张冠李戴' },
    color: { score: colorScore, verdict: colorScore >= 80 ? '色彩协调' : colorScore >= 60 ? '尚称顺眼' : '色彩失谐' },
    harmony: { score: harmonyScore, verdict: harmonyScore >= 80 ? '搭配成套' : harmonyScore >= 60 ? '略有参差' : '搭配冲突' },
  };

  const phrases = [];
  if (dims.era.score >= 90) phrases.push('符合时代');
  if (dims.role.score >= 90) phrases.push('身份匹配');
  if (dims.color.score >= 80) phrases.push('色彩协调');
  if (dims.harmony.score >= 80) phrases.push('搭配成套');
  if (conflicts.length) phrases.push('搭配存在冲突');

  const title = total >= 90 ? '大国衣冠匠'
    : total >= 75 ? '尚衣局高手'
    : total >= 60 ? '成衣铺巧手'
    : total >= 40 ? '初入行的小裁缝'
    : '东拼西凑小学徒';

  return { slots: slotJudges, dims, total, title, phrases, conflicts: [...new Set(conflicts)], synergies, forms };
}

/* ─────────────────────────────────────────────
   自由模式选项（全库可选，同朝宜配置顶）
   ───────────────────────────────────────────── */
function rankOptions(list, idn, key) {
  const scoreOf = (x) => {
    let s = 0;
    if (eraFit(x, idn.era)) s += 4;
    if (roleFit(x, idn.role)) s += 2;
    if (genderFit(x, idn.gender)) s += 1;
    if (key === 'body' && x.tag === 'robe') s += 1;
    return -s;
  };
  return [...list].sort((a, b) => scoreOf(a) - scoreOf(b));
}
function freeOptions(idn) {
  return {
    body: rankOptions(allBodies(), idn, 'body'),
    sleeve: rankOptions(SLEEVES, idn),
    color: rankOptions(COLORS, idn),
    pattern: rankOptions(PATTERNS, idn),
    belt: rankOptions(BELTS, idn),
    accessory: rankOptions(ACCESSORIES, idn),
  };
}
const isYi = (item, idn) => item && eraFit(item, idn.era) && roleFit(item, idn.role) && genderFit(item, idn.gender);

/* ─────────────────────────────────────────────
   考据挑战：出题
   ───────────────────────────────────────────── */
function pickIdeal(list, idn, occasion, { genderRequired = true } = {}) {
  /* 分级取最优：先求全合（时代+身份+性别+正式度），逐级放宽并打散随机 */
  const tiers = [
    (x) => eraFit(x, idn.era) && roleFit(x, idn.role) &&
           (!genderRequired || genderFit(x, idn.gender)) && formOK(x, occasion),
    (x) => eraFit(x, idn.era) && roleFit(x, idn.role) && (!genderRequired || genderFit(x, idn.gender)),
    (x) => eraFit(x, idn.era),
  ];
  for (const f of tiers) {
    const pool = list.filter(f);
    if (pool.length) return pick(shuffle(pool));
  }
  return pick(list);
}

function makeOptions(ideal, list, idn, { genderAware = true } = {}) {
  const sameEra = list.filter((x) => eraFit(x, idn.era) && x !== ideal);
  const crossEra = list.filter((x) => !eraFit(x, idn.era) &&
    roleFit(x, idn.role) && (!genderAware || genderFit(x, idn.gender)));
  const far = list.filter((x) => !eraFit(x, idn.era) &&
    (!roleFit(x, idn.role) || (genderAware && !genderFit(x, idn.gender))));

  const dNear = pick(shuffle(sameEra).filter((x) => !roleFit(x, idn.role) || (genderAware && !genderFit(x, idn.gender))));
  const dTime = pick(shuffle(crossEra));
  const dFar = pick(shuffle(far));

  const opts = [ideal, dNear, dTime, dFar].filter(Boolean);
  /* 去重兜底 */
  const seen = new Set();
  const uniq = opts.filter((x) => (seen.has(x) ? false : seen.add(x)));
  for (const x of shuffle(list)) {
    if (uniq.length >= 4) break;
    if (!seen.has(x)) { seen.add(x); uniq.push(x); }
  }
  return shuffle(uniq).slice(0, 4);
}

function generateChallenge(identity) {
  const idn = identity || pick(IDENTITIES);
  /* 衣身：同朝同身份，礼重者优先（袍衫类优先于外罩） */
  const bodyFits = BODIES
    .filter((b) => b.era === idn.era && roleFit(b, idn.role) && genderFit(b, idn.gender))
    .sort((a, b) => (b.form - a.form) || ((b.tag === 'robe') - (a.tag === 'robe')));
  const idealBody = bodyFits[0] || BODIES.find((b) => b.era === idn.era && genderFit(b, idn.gender));
  const occasion = idealBody.form;

  const idealSleeve = pickIdeal(SLEEVES, idn, occasion);
  const idealColor = pickIdeal(COLORS, idn, occasion, { genderRequired: false });
  const idealPattern = pickIdeal(PATTERNS, idn, occasion);
  const idealBelt = pickIdeal(BELTS, idn, occasion);
  const idealAcc = pickIdeal(ACCESSORIES, idn, occasion);

  const answer = {
    body: getBody(idealBody.key),
    sleeve: idealSleeve, color: idealColor, pattern: idealPattern,
    belt: idealBelt, accessory: idealAcc,
  };

  return {
    identity: idn,
    answer,
    options: {
      body: makeOptions(answer.body, allBodies(), idn),
      sleeve: makeOptions(idealSleeve, SLEEVES, idn),
      color: makeOptions(idealColor, COLORS, idn, { genderAware: false }),
      pattern: makeOptions(idealPattern, PATTERNS, idn),
      belt: makeOptions(idealBelt, BELTS, idn),
      accessory: makeOptions(idealAcc, ACCESSORIES, idn),
    },
  };
}

/* 设计卡编号 */
const SLOT_ORDER = ['body', 'sleeve', 'color', 'pattern', 'belt', 'accessory'];

function cardSerial(seed) {
  let h = 0;
  const s = JSON.stringify(seed) + Date.now().toString(36);
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return 'HF-' + Math.abs(h).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
}

Object.assign(window, {
  imgProxy, bindGarments, getBody, allBodies, eraNameOf, genderFit, roleFit, eraFit,
  evaluate, freeOptions, isYi, generateChallenge, cardSerial,
  SLOT_ORDER: ['body', 'sleeve', 'color', 'pattern', 'belt', 'accessory'],
});
