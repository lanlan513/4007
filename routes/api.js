/**
 * REST API 路由
 *  GET /api/dynasties              朝代列表（含服饰数量）
 *  GET /api/dynasties/:id          朝代详情（含该朝服饰）
 *  GET /api/garments               服饰列表（?dynasty=&gender=&category=&q=）
 *  GET /api/garments/:id           服饰详情（含朝代信息）
 *  GET /api/garments/:id/related   关联服饰（同朝代 + 同类别/同服属的他朝服饰）
 *  GET /api/meta                   筛选项元数据（类型、性别）
 */
const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const router = express.Router();
const db = new DatabaseSync(path.join(__dirname, '..', 'db', 'museum.db'));

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
    .all(req.params.id);
  res.json({ ...dynasty, garments });
});

// 服饰列表（搜索 + 分类）
router.get('/garments', (req, res) => {
  const { dynasty, gender, category, q } = req.query;
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
  res.json(db.prepare(sql).all(...params));
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
  res.json(row);
});

// 关联服饰：同朝代服饰 + 相关服饰（依类别、服属关联，均取自现有馆藏表）
router.get('/garments/:id/related', (req, res) => {
  const cur = db.prepare('SELECT * FROM garments WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: '未找到该服饰' });

  const cols = `g.id, g.name, g.gender, g.category, g.image, g.dynasty_id,
                d.name AS dynasty_name, d.years AS dynasty_years`;

  // 同朝代服饰
  const sameDynasty = db
    .prepare(
      `SELECT ${cols}
       FROM garments g JOIN dynasties d ON d.id = g.dynasty_id
       WHERE g.dynasty_id = ? AND g.id != ?
       ORDER BY g.id`
    )
    .all(cur.dynasty_id, cur.id);

  // 相关服饰：跨朝代，同类别优先、同服属次之
  const related = db
    .prepare(
      `SELECT ${cols},
              ((g.category = ?) * 2 + (g.gender = ?)) AS relevance
       FROM garments g JOIN dynasties d ON d.id = g.dynasty_id
       WHERE g.id != ? AND g.dynasty_id != ?
         AND (g.category = ? OR g.gender = ?)
       ORDER BY relevance DESC, d.sort_order, g.id
       LIMIT 4`
    )
    .all(cur.category, cur.gender, cur.id, cur.dynasty_id, cur.category, cur.gender);

  res.json({ same_dynasty: sameDynasty, related });
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
  res.json({ categories, genders });
});

module.exports = router;
