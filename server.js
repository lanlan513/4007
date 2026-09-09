/**
 * 华服千载 —— 中国古代服饰数字展馆
 * Express 服务器：静态前端 + REST API
 */
const express = require('express');
const path = require('node:path');
const fs = require('node:fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 若数据库不存在则自动初始化
const dbFile = path.join(__dirname, 'db', 'museum.db');
if (!fs.existsSync(dbFile)) {
  console.log('数据库不存在，正在初始化...');
  require('./db/seed');
}

app.use(express.json());
app.use('/api', require('./routes/api'));
app.use(express.static(path.join(__dirname, 'public')));

// 页面路由（友好 URL）
const pages = {
  '/dynasty': 'dynasty.html',
  '/garment': 'garment.html',
  '/collection': 'collection.html',
};
for (const [route, file] of Object.entries(pages)) {
  app.get(route, (req, res) => res.sendFile(path.join(__dirname, 'public', file)));
}

app.listen(PORT, () => {
  console.log(`\n  华服千载 · 中国古代服饰数字展馆`);
  console.log(`  展馆已开放：http://localhost:${PORT}\n`);
});
