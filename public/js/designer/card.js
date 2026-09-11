/* ============================================================
   华服设计局 · 设计卡（Canvas 900×1280，可导出 PNG）
   ============================================================ */

const CARD_W = 900;
const CARD_H = 1280;

const C = {
  paper: '#f3ecda',
  paper2: '#ece2ca',
  paperCard: '#f8f3e6',
  ink: '#2a241a',
  ink2: '#574d3c',
  ink3: '#8a7d66',
  line: 'rgba(70,58,36,0.22)',
  lineSoft: 'rgba(70,58,36,0.12)',
  cinnabar: '#a63a2a',
  gold: '#b8924f',
  jade: '#476b5f',
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function coverDraw(ctx, img, x, y, w, h) {
  const ir = img.width / img.height;
  const br = w / h;
  let sw = img.width, sh = img.height, sx = 0, sy = 0;
  if (ir > br) { sh = img.height; sw = sh * br; sx = (img.width - sw) / 2; }
  else { sw = img.width; sh = sw / br; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function loadImage(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/* 确保书法 / 宋体 webfont 已就绪 */
async function readyFonts() {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('600 40px "Noto Serif SC"'),
        document.fonts.load('40px "Ma Shan Zheng"'),
        document.fonts.load('40px "ZCOOL XiaoWei"'),
        document.fonts.ready,
      ]),
      new Promise((r) => setTimeout(r, 2600)),
    ]);
  } catch { /* 字体加载失败则退化为系统字体 */ }
}

function seal(ctx, x, y, size, ch, bg = C.cinnabar, fs = null) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate((-4 * Math.PI) / 180);
  roundRect(ctx, -size / 2, -size / 2, size, size, 6);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(247,239,221,0.8)';
  roundRect(ctx, -size / 2 + 5, -size / 2 + 5, size - 10, size - 10, 3);
  ctx.stroke();
  ctx.fillStyle = '#f7efdd';
  ctx.font = `${fs || size * 0.4}px "Ma Shan Zheng", "STKaiti", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = ch.split('\n');
  lines.forEach((ln, i) =>
    ctx.fillText(ln, 0, (i - (lines.length - 1) / 2) * size * 0.34)
  );
  ctx.restore();
}

/* 纸张底 + 重边框 + 角部朱砂点缀 */
function paintPaper(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, CARD_H);
  g.addColorStop(0, C.paper);
  g.addColorStop(1, C.paper2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  /* 细碎纸纹 */
  ctx.save();
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#463a24' : '#b8924f';
    ctx.fillRect(Math.random() * CARD_W, Math.random() * CARD_H, 1.2, 1.2);
  }
  ctx.restore();

  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, CARD_W - 68, CARD_H - 68);
  ctx.strokeStyle = C.lineSoft;
  ctx.lineWidth = 1;
  ctx.strokeRect(46, 46, CARD_W - 92, CARD_H - 92);
}

function dimBar(ctx, x, y, w, label, score) {
  ctx.font = '22px "ZCOOL XiaoWei", "Noto Serif SC", serif';
  ctx.fillStyle = C.ink2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(label, x, y);
  ctx.font = 'italic 18px "Cormorant Garamond", serif';
  ctx.fillStyle = C.ink3;
  ctx.textAlign = 'right';
  ctx.fillText(String(score), x + w, y);

  ctx.fillStyle = 'rgba(70,58,36,0.12)';
  ctx.fillRect(x, y + 12, w, 7);
  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, C.gold);
  grad.addColorStop(1, C.cinnabar);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y + 12, (w * score) / 100, 7);
}

const GRADE_OF = (s) => (s >= 90 ? ['甲', '上品'] : s >= 75 ? ['乙', '佳品'] : s >= 60 ? ['丙', '中品'] : s >= 40 ? ['丁', '尚可'] : ['劣', '不逮']);

/**
 * 绘制设计卡
 * spec: { mode:'free'|'challenge', dynasty:{name,name_en}, identity:{name,hint},
 *         choices, result, serial }
 */
async function drawDesignCard(canvas, spec) {
  await readyFonts();
  const ctx = canvas.getContext('2d');
  const { mode, dynasty, identity, choices, result, serial } = spec;
  const img = await loadImage(choices.body ? imgProxy(choices.body.image) : '');

  paintPaper(ctx);
  const M = 70;

  /* ── 页眉 ── */
  seal(ctx, M, 64, 52, '华\n服', C.cinnabar, 21);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.ink;
  ctx.font = '30px "ZCOOL XiaoWei", "Noto Serif SC", serif';
  ctx.fillText('华服千载', M + 68, 86);
  ctx.font = 'italic 14px "Cormorant Garamond", serif';
  ctx.fillStyle = C.ink3;
  ctx.fillText('COSTUME MUSEUM OF ANCIENT CHINA', M + 68, 108);

  ctx.textAlign = 'right';
  ctx.font = '20px "ZCOOL XiaoWei", serif';
  ctx.fillStyle = C.cinnabar;
  ctx.fillText(mode === 'challenge' ? '历 史 考 据 帖' : '服 饰 设 计 帖', CARD_W - M, 82);
  ctx.font = 'italic 13px "Cormorant Garamond", serif';
  ctx.fillStyle = C.ink3;
  ctx.fillText(mode === 'challenge' ? 'Authenticity Examination' : 'Personal Design Card', CARD_W - M, 106);

  /* 金线 */
  const goldLine = ctx.createLinearGradient(M, 0, CARD_W - M, 0);
  goldLine.addColorStop(0, 'transparent');
  goldLine.addColorStop(0.2, C.gold);
  goldLine.addColorStop(0.8, C.gold);
  goldLine.addColorStop(1, 'transparent');
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = goldLine;
  ctx.fillRect(M, 128, CARD_W - M * 2, 1.5);
  ctx.globalAlpha = 1;

  /* ── 标题 ── */
  const tieName = `${dynasty.name} · ${identity.name}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = C.ink;
  ctx.font = '64px "Ma Shan Zheng", "STKaiti", serif';
  ctx.fillText(tieName, CARD_W / 2, 208);
  ctx.font = 'italic 20px "Cormorant Garamond", serif';
  ctx.fillStyle = C.gold;
  ctx.fillText(`${dynasty.name_en || ''} · ${mode === 'challenge' ? 'Kaoju Challenge' : 'Design Atelier'}`, CARD_W / 2, 240);

  /* 题签行 */
  ctx.font = '17px "Noto Serif SC", serif';
  ctx.fillStyle = C.ink2;
  const today = new Date();
  const dateStr = `${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日`;
  ctx.fillText(`${dateStr}　·　帖号 ${serial}`, CARD_W / 2, 278);

  /* ── 左：衣身立像 ── */
  const imgX = M, imgY = 310, imgW = 400, imgH = 500;
  ctx.fillStyle = C.paperCard;
  ctx.fillRect(imgX - 12, imgY - 12, imgW + 24, imgH + 24);
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(imgX - 12, imgY - 12, imgW + 24, imgH + 24);

  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(imgX, imgY, imgW, imgH);
    ctx.clip();
    coverDraw(ctx, img, imgX, imgY, imgW, imgH);
    ctx.restore();
  } else {
    ctx.fillStyle = '#e5d9bc';
    ctx.fillRect(imgX, imgY, imgW, imgH);
    ctx.fillStyle = 'rgba(70,58,36,0.28)';
    ctx.font = '150px "Ma Shan Zheng", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('衣', imgX + imgW / 2, imgY + imgH / 2 - 10);
  }
  ctx.strokeStyle = C.lineSoft;
  ctx.strokeRect(imgX + 8, imgY + 8, imgW - 16, imgH - 16);

  /* 图说 */
  ctx.textAlign = 'center';
  ctx.font = 'italic 16px "Cormorant Garamond", serif';
  ctx.fillStyle = C.ink3;
  ctx.fillText('— 衣 身 立 轴 · 取 自 本 馆 馆 藏 —', imgX + imgW / 2, imgY + imgH + 42);
  ctx.font = '30px "Ma Shan Zheng", serif';
  ctx.fillStyle = C.ink;
  ctx.fillText(choices.body ? choices.body.key : '未择衣身', imgX + imgW / 2, imgY + imgH + 84);

  /* ── 右：六格档案 ── */
  const rx = imgX + imgW + 52;
  const rw = CARD_W - M - rx;
  let ry = imgY - 4;
  ctx.textAlign = 'left';
  ctx.font = '22px "ZCOOL XiaoWei", serif';
  ctx.fillStyle = C.cinnabar;
  ctx.fillText('裁 衣 档', rx, ry);
  ctx.fillStyle = C.gold;
  ctx.fillRect(rx, ry + 14, 44, 1.5);
  ry += 52;

  const rows = [
    ['朝代', dynasty.name],
    ['身份', identity.name],
    ['衣身', choices.body ? choices.body.key : '—'],
    ['袖型', choices.sleeve ? choices.sleeve.name : '—'],
    ['颜色', choices.color ? choices.color.name : '—', choices.color ? choices.color.hex : null],
    ['纹样', choices.pattern ? choices.pattern.name : '—'],
    ['腰带', choices.belt ? choices.belt.name : '—'],
    ['配饰', choices.accessory ? choices.accessory.name : '—'],
  ];
  ctx.font = '21px "Noto Serif SC", serif';
  rows.forEach(([k, v, hex]) => {
    ctx.fillStyle = C.ink3;
    ctx.font = '19px "ZCOOL XiaoWei", serif';
    ctx.fillText(k, rx, ry);
    ctx.font = '21px "Noto Serif SC", serif';
    ctx.fillStyle = C.ink;
    const tx = rx + 76;
    let maxW = rw - 76;
    if (hex) {
      ctx.fillStyle = hex;
      ctx.fillRect(rx + rw - 34, ry - 17, 26, 22);
      ctx.strokeStyle = C.line;
      ctx.strokeRect(rx + rw - 34, ry - 17, 26, 22);
      maxW -= 42;
    }
    ctx.fillStyle = C.ink;
    const text = String(v);
    ctx.save();
    ctx.beginPath();
    ctx.rect(tx - 4, ry - 26, maxW + 8, 40);
    ctx.clip();
    ctx.fillText(text, tx, ry, maxW);
    ctx.restore();
    ctx.strokeStyle = C.lineSoft;
    ctx.beginPath();
    ctx.moveTo(rx, ry + 18);
    ctx.lineTo(rx + rw, ry + 18);
    ctx.stroke();
    ry += 58;
  });

  /* 考据点（衣身 note） */
  if (choices.body?.note) {
    ctx.fillStyle = C.ink2;
    ctx.font = '16px "Noto Serif SC", serif';
    wrapText(ctx, choices.body.note, rx, ry + 6, rw, 24, 4);
  }

  /* ── 底部：评案 ── */
  const py = 900;
  ctx.strokeStyle = C.line;
  ctx.beginPath();
  ctx.moveTo(M, py - 26);
  ctx.lineTo(CARD_W - M, py - 26);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = '22px "ZCOOL XiaoWei", serif';
  ctx.fillStyle = C.cinnabar;
  ctx.fillText(mode === 'challenge' ? '考 据 评 案' : '裁 衣 评 案', M, py + 4);

  /* 分数圆印 */
  const sx = M + 70, syy = py + 128;
  ctx.beginPath();
  ctx.arc(sx, syy, 66, 0, Math.PI * 2);
  ctx.fillStyle = mode === 'challenge' ? C.jade : C.cinnabar;
  ctx.fill();
  ctx.fillStyle = '#f7efdd';
  ctx.textAlign = 'center';
  ctx.font = '52px "Ma Shan Zheng", serif';
  ctx.fillText(String(result.total), sx, syy + 8);
  ctx.font = '15px "Noto Serif SC", serif';
  ctx.fillText('分 / 百', sx, syy + 38);

  /* 评级印 */
  const [grade, gradeLabel] = GRADE_OF(result.total);
  seal(ctx, sx + 52, syy - 58, 58, grade, C.ink, 30);

  /* 雅号与评语 */
  ctx.textAlign = 'left';
  ctx.fillStyle = C.ink;
  ctx.font = '44px "Ma Shan Zheng", serif';
  ctx.fillText(mode === 'challenge' ? `评第 · ${gradeLabel}` : result.title, M + 170, py + 62);
  ctx.fillStyle = C.ink2;
  ctx.font = '18px "Noto Serif SC", serif';
  const phraseTxt = result.phrases.length ? result.phrases.join('　·　') : '搭配平平，未入流品';
  ctx.fillText(phraseTxt, M + 172, py + 100);
  if (result.synergies?.length) {
    ctx.fillStyle = '#8a6a30';
    ctx.font = '16px "Noto Serif SC", serif';
    wrapText(ctx, `✦ 成套：${result.synergies[0].text}${result.synergies[1] ? '；' + result.synergies[1].text : ''}`,
      M + 172, py + 132, 320, 22, 2);
  }

  /* 四维分条 */
  const bx = 560;
  dimBar(ctx, bx, py + 28, 270, '符合时代', result.dims.era.score);
  dimBar(ctx, bx, py + 82, 270, '身份匹配', result.dims.role.score);
  dimBar(ctx, bx, py + 136, 270, '色彩协调', result.dims.color.score);
  dimBar(ctx, bx, py + 190, 270, '搭配和谐', result.dims.harmony.score);

  /* 页脚 */
  ctx.textAlign = 'center';
  ctx.font = '17px "Noto Serif SC", serif';
  ctx.fillStyle = C.ink3;
  ctx.fillText('垂 衣 裳 而 天 下 治　·　华 服 千 载 数 字 展 馆 · 设 计 局 雅 集', CARD_W / 2, CARD_H - 76);
  ctx.font = 'italic 13px "Cormorant Garamond", serif';
  ctx.fillText('Digital pavilion illustration · AI-generated image, for cultural play only', CARD_W / 2, CARD_H - 52);

  return canvas;
}

function wrapText(ctx, text, x, y, maxW, lh, maxLines = 99) {
  let line = '';
  let n = 0;
  const flush = () => { ctx.fillText(line, x, y); y += lh; line = ''; n++; };
  for (const ch of String(text)) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line) {
      flush();
      if (n >= maxLines - 1) break;
    }
    line += ch;
  }
  if (line && n < maxLines) ctx.fillText(line, x, y);
}

window.drawDesignCard = drawDesignCard;
