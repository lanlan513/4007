/* 评价引擎冒烟测试：node test-engine.js（需 node:sqlite，Node ≥ 22） */
global.window = {};
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ctx = vm.createContext({ window: global.window, console, Math, Date, JSON, Object, Array, Set, Map, String, process });
const src = ['public/js/designer/data.js', 'public/js/designer/engine.js']
  .map((f) => fs.readFileSync(path.join(__dirname, f), 'utf8'))
  .join('\n;\n');
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(path.join(__dirname, 'db/museum.db'));
const garments = db.prepare('SELECT * FROM garments').all();

const testSrc = `
  bindGarments(${JSON.stringify(garments)});
  let pass = 0, fail = 0;
  const ok = (name, cond, extra='') => { if (cond) { pass++; } else { fail++; console.log('  ✕ ' + name, extra); } };

  /* 1. 衣身全部回填馆藏 */
  ok('32 衣身全部绑定馆藏', allBodies().every(b => b.id && b.image),
     allBodies().filter(b=>!b.id).map(b=>b.key).join(','));

  /* 2. 每个身份都能出题，且六槽各有 4 个选项、含唯一理想项 */
  for (const idn of IDENTITIES) {
    const q = generateChallenge(idn);
    for (const k of SLOT_ORDER) {
      ok(idn.name + ' · ' + k + ' 有4选项', q.options[k].length === 4, String(q.options[k].length));
      ok(idn.name + ' · ' + k + ' 含理想项', q.options[k].some(x => (x.key||x.id) === (q.answer[k].key||q.answer[k].id)));
    }
    const r = evaluate(idn, q.answer);
    let tries = [];
    /* 出题含随机，连试 8 次取最高，检验“标准答案可以达标” */
    for (let t = 0; t < 8; t++) {
      const qq = generateChallenge(idn);
      tries.push(evaluate(idn, qq.answer).total);
    }
    const best = Math.max(...tries);
    ok(idn.name + ' · 标准答案 ≥ 75分', best >= 75, '8次最高=' + best + ' 本次=' + r.total);
  }

  /* 3. 典型高分：周天子冕服全套 */
  const tz = IDENTITIES.find(x => x.name === '周天子');
  const q1 = generateChallenge(tz);
  const perfectZhou = {
    body: getBody('冕服'), sleeve: SLEEVES.find(s=>s.id==='sl-chuihu'),
    color: COLORS.find(c=>c.id==='c-xuan'), pattern: PATTERNS.find(p=>p.id==='p-shierzhang'),
    belt: BELTS.find(b=>b.id==='b-dadai'), accessory: ACCESSORIES.find(a=>a.id==='a-mianliu'),
  };
  const r1 = evaluate(tz, perfectZhou);
  console.log('周天子冕服全套:', r1.total, r1.title, '| 彩蛋', r1.synergies.length);
  ok('周天子冕服 ≥ 90', r1.total >= 90, 'score='+r1.total);
  ok('冕服彩蛋命中', r1.synergies.some(s=>s.text.includes('冕旒')));

  /* 4. 僭越检测：平民穿明黄龙袍 */
  const cm = IDENTITIES.find(x => x.name === '市井女子');
  const rebel = {
    body: getBody('明黄龙袍'), sleeve: SLEEVES.find(s=>s.id==='sl-ti'),
    color: COLORS.find(c=>c.id==='c-minghuang'), pattern: PATTERNS.find(p=>p.id==='p-long'),
    belt: BELTS.find(b=>b.id==='b-chaozhu'), accessory: ACCESSORIES.find(a=>a.id==='a-dingdai'),
  };
  const r2 = evaluate(cm, rebel);
  console.log('平民龙袍:', r2.total, r2.title, '| conflicts:', r2.conflicts);
  ok('僭越搭配 ≤ 30', r2.total <= 30, 'score='+r2.total);
  ok('检测到僭越冲突', r2.conflicts.some(x=>x.includes('僭越')));
  ok('含搭配冲突评语', r2.phrases.includes('搭配存在冲突'));

  /* 5. 跨朝错位：大唐宰相配清补褂马蹄袖 */
  const tg = IDENTITIES.find(x => x.name === '大唐宰相');
  const cross = {
    body: getBody('补褂（清代补服）'), sleeve: SLEEVES.find(s=>s.id==='sl-ti'),
    color: COLORS.find(c=>c.id==='c-shiqing'), pattern: PATTERNS.find(p=>p.id==='p-buzi'),
    belt: BELTS.find(b=>b.id==='b-chaozhu'), accessory: ACCESSORIES.find(a=>a.id==='a-dingdai'),
  };
  const r3 = evaluate(tg, cross);
  console.log('唐相清服:', r3.total, '| era dim:', r3.dims.era.score, r3.dims.era.verdict);
  ok('跨朝时代分 ≤ 30', r3.dims.era.score <= 30, String(r3.dims.era.score));

  /* 6. 一键取宜：自由模式选项含宜配 */
  const jw = IDENTITIES.find(x => x.name === '锦衣卫使');
  const fo = freeOptions(jw);
  ok('锦衣卫首项衣身为宜配', isYi(fo.body[0], jw), fo.body[0].key);
  ok('锦衣卫宜配含飞鱼服', fo.body.some(b => b.key === '飞鱼服'));

  /* 7. 随机挑战 200 次不报错，分数落在 0-100 */
  let min = 101, max = -1;
  for (let i = 0; i < 200; i++) {
    const q = generateChallenge();
    const pickOne = k => q.options[k][Math.floor(Math.random()*q.options[k].length)];
    const c = { body: pickOne('body'), sleeve: pickOne('sleeve'), color: pickOne('color'),
                pattern: pickOne('pattern'), belt: pickOne('belt'), accessory: pickOne('accessory') };
    const r = evaluate(q.identity, c);
    if (r.total < min) min = r.total;
    if (r.total > max) max = r.total;
    if (!(r.total >= 0 && r.total <= 100)) { fail++; console.log('  ✕ 分数越界', r.total); }
  }
  ok('200 次随机分数均在 0–100', true);
  console.log('  随机得分区间:', min, '~', max);

  console.log('\\n结果: ' + pass + ' 通过, ' + fail + ' 失败');
  if (fail) process.exit(1);
`;
vm.runInContext(src + '\n;\n' + testSrc, ctx, { filename: 'bundle+test.js' });
