/**
 * REST API 路由
 *  GET /api/dynasties            朝代列表（含服饰数量）
 *  GET /api/dynasties/:id        朝代详情（含该朝服饰）
 *  GET /api/garments             服饰列表（?dynasty=&gender=&category=&identity=&q=）
 *  GET /api/garments/:id         服饰详情（含朝代信息）
 *  GET /api/meta                 筛选项元数据（类型、性别、身份）
 *
 * 「穿越时空寻衣」任务接口
 *  GET /api/scenes               历史场景列表
 *  GET /api/quests               全部任务（不含答案页的详细释义，仅目标摘要）
 *  GET /api/quests/random        随机任务（?exclude=服饰ID&mode=identity|dynasty|scene&key=）
 *  GET /api/quests/:id           指定任务详情（id 为目标服饰 ID）
 */
const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const { QUESTS, IDENTITIES, SCENES, ROLE_PHRASE } = require('../db/quests');

const router = express.Router();
const db = new DatabaseSync(path.join(__dirname, '..', 'db', 'museum.db'));

// 服饰名 → 任务释义（名称在馆藏中唯一）
const questByName = new Map(Object.entries(QUESTS));

// 为服饰行附加游戏化字段（身份 / 是否有任务）
function withQuest(row) {
  const q = questByName.get(row.name);
  return q ? { ...row, identity: q.identity, quest: true } : { ...row, identity: '', quest: false };
}

// 朝代列表
router.get('/dynasties', (req, res) => {
  const rows = db
    .prepare(
      `SELECT d.*, COUNT(g.id) AS garment_count
       FROM dynasties d LEFT JOIN garments g ON g.dynasty_id = d.id
       GROUP BY d.id ORDER BY d.sort_order`
    )
    .all();
  res.json(rows);
});

// 朝代详情
router.get('/dynasties/:id', (req, res) => {
  const dynasty = db
    .prepare('SELECT * FROM dynasties WHERE id = ?')
    .get(req.params.id);
  if (!dynasty) return res.status(404).json({ error: '未找到该朝代' });

  const garments = db
    .prepare(
      `SELECT id, name, gender, category, material, colors, image
       FROM garments WHERE dynasty_id = ? ORDER BY id`
    )
    .all(req.params.id)
    .map(withQuest);
  res.json({ ...dynasty, garments });
});

// 服饰列表（搜索 + 分类）
router.get('/garments', (req, res) => {
  const { dynasty, gender, category, identity, q } = req.query;
  const where = [];
  const params = [];

  if (dynasty) { where.push('g.dynasty_id = ?'); params.push(dynasty); }
  if (gender) { where.push('g.gender = ?'); params.push(gender); }
  if (category) { where.push('g.category = ?'); params.push(category); }
  if (q) {
    where.push(
      `(g.name LIKE ? OR g.material LIKE ? OR g.description LIKE ?
        OR g.form LIKE ? OR g.colors LIKE ? OR d.name LIKE ?)`
    );
    const kw = `%${q}%`;
    params.push(kw, kw, kw, kw, kw, kw);
  }

  const sql = `
    SELECT g.*, d.name AS dynasty_name, d.years AS dynasty_years, d.theme
    FROM garments g JOIN dynasties d ON d.id = g.dynasty_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY d.sort_order, g.id`;
  let rows = db.prepare(sql).all(...params).map(withQuest);

  // 身份筛选依赖任务释义表，在内存中完成
  if (identity) rows = rows.filter((g) => g.identity === identity);

  res.json(rows);
});

// 服饰详情
router.get('/garments/:id', (req, res) => {
  const row = db
    .prepare(
      `SELECT g.*, d.name AS dynasty_name, d.name_en AS dynasty_name_en,
              d.years AS dynasty_years, d.era AS dynasty_era, d.theme, d.summary AS dynasty_summary
       FROM garments g JOIN dynasties d ON d.id = g.dynasty_id
       WHERE g.id = ?`
    )
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: '未找到该服饰' });
  res.json(withQuest(row));
});

// 筛选项元数据
router.get('/meta', (req, res) => {
  const categories = db
    .prepare('SELECT DISTINCT category FROM garments ORDER BY category')
    .all()
    .map((r) => r.category);
  const genders = db
    .prepare('SELECT DISTINCT gender FROM garments')
    .all()
    .map((r) => r.gender);
  res.json({ categories, genders, identities: IDENTITIES });
});

/* ============================================================
   「穿越时空寻衣」任务
   ============================================================ */

// 组装一件服饰对应的任务对象
function buildQuest(targetId) {
  const row = db
    .prepare(
      `SELECT g.*, d.name AS dynasty_name, d.name_en AS dynasty_name_en,
              d.years AS dynasty_years, d.era AS dynasty_era, d.theme, d.summary AS dynasty_summary
       FROM garments g JOIN dynasties d ON d.id = g.dynasty_id
       WHERE g.id = ?`
    )
    .get(targetId);
  if (!row) return null;
  const q = questByName.get(row.name);
  if (!q) return null;
  const scene = SCENES.find((s) => s.id === q.scene) || null;
  return {
    target: withQuest(row),
    identity: q.identity,
    role: q.role,
    rolePhrase: ROLE_PHRASE[q.identity] || q.role,
    scene,
    story: q.story,
    clue: q.clue,
    hint: q.hint,
    knowledge: q.knowledge,
  };
}

// 历史场景
router.get('/scenes', (req, res) => {
  res.json(SCENES);
});

// 全部任务概览（供入口选择）
router.get('/quests', (req, res) => {
  const rows = db
    .prepare(
      `SELECT g.id, g.name, g.gender, g.category, g.image,
              d.id AS dynasty_id, d.name AS dynasty_name, d.years AS dynasty_years
       FROM garments g JOIN dynasties d ON d.id = g.dynasty_id
       ORDER BY d.sort_order, g.id`
    )
    .all();
  const list = rows
    .filter((g) => questByName.has(g.name))
    .map((g) => {
      const q = questByName.get(g.name);
      return { ...withQuest(g), scene: q.scene };
    });
  res.json(list);
});

// 随机任务
//  ?mode=identity  key=身份名
//  ?mode=dynasty   key=朝代ID
//  ?mode=scene     key=场景ID
//  ?exclude=服饰ID  避免与上一局重复
router.get('/quests/random', (req, res) => {
  const { mode, key, exclude } = req.query;
  const pool = [];

  const rows = db
    .prepare(
      `SELECT g.id, g.name, g.gender, g.dynasty_id FROM garments g
       ${mode === 'dynasty' ? 'WHERE g.dynasty_id = ?' : ''}`
    )
    .all(...(mode === 'dynasty' && key ? [key] : []));

  for (const g of rows) {
    const q = questByName.get(g.name);
    if (!q) continue;
    if (mode === 'identity' && q.identity !== key) continue;
    if (mode === 'scene' && q.scene !== key) continue;
    if (String(exclude) === String(g.id)) continue;
    pool.push(g.id);
  }

  if (!pool.length) {
    // 排除项导致为空（如该池仅一件）时，退回不含排除条件的池子
    return res.redirect(req.path + (mode ? `?mode=${mode}&key=${encodeURIComponent(key || '')}` : ''));
  }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  res.redirect(`/api/quests/${pick}${mode ? `?mode=${encodeURIComponent(mode)}&key=${encodeURIComponent(key || '')}` : ''}`);
});

// 指定任务
router.get('/quests/:id', (req, res) => {
  const quest = buildQuest(req.params.id);
  if (!quest) return res.status(404).json({ error: '未找到该探索任务' });
  // 回传任务的「召唤方式」，供前端生成标题
  quest.summon = { mode: req.query.mode || 'random', key: req.query.key || '' };
  res.json(quest);
});

module.exports = router;
