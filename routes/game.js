/**
 * 华服设计局 · 游戏辅助路由
 *  GET /api/game-img?u=<encoded url>
 *    馆藏图床同源代理：设计卡 Canvas 需要跨域读取图片，
 *    浏览器直连会污染画布导致 toDataURL 失败，故由服务端转发。
 *    仅允许白名单图床，防止成为开放代理。
 */
const express = require('express');

const router = express.Router();

const IMG_HOST = 'trae-api-cn.mchost.guru';
const IMG_PATH = '/api/ide/v1/text_to_image';

router.get('/game-img', async (req, res) => {
  let u;
  try {
    u = new URL(req.query.u || '');
  } catch {
    return res.status(400).end('bad url');
  }
  if (u.hostname !== IMG_HOST || u.pathname !== IMG_PATH) {
    return res.status(403).end('forbidden host');
  }

  try {
    const r = await fetch(u.toString());
    if (!r.ok) return res.status(r.status).end('upstream error');
    const type = r.headers.get('content-type') || 'image/jpeg';
    res.set('Content-Type', type);
    res.set('Cache-Control', 'public, max-age=86400');
    const buf = Buffer.from(await r.arrayBuffer());
    res.send(buf);
  } catch (e) {
    res.status(502).end('image fetch failed');
  }
});

module.exports = router;
