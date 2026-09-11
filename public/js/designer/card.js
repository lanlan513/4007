/* ============================================================
   华服设计局 · 设计卡（Canvas 900×1280，可导出 PNG）
   布局：页眉 / 标题 / 左立轴 + 右裁衣档 / 底部评案（印章·雅号·四维条）
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

/* 纸张底 + 重边框 */
function paintPaper(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, CARD_H);
  g.addColorStop(0, C.paper);
  g.addColorStop(1, C.paper2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

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

/* 单行文字超长自动缩字号 */
function fitText(ctx, text, x, y, maxW, size, family, { align = 'left', color = C.ink, min = 13, weight = '' } = {}) {
  let s = size;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  do {
    ctx.font = `${weight} ${s}px ${family}`.trim();
    if (ctx.measureText(text).width <= maxW) break;
    s -= 1;
  } while (s >= min);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  return s;
}

function wrapText(ctx, text, x, y, maxW, lh, maxLines = 99, opts = {}) {
  if (opts.color) ctx.fillStyle = opts.color;
  let line = '';
  let n = 0;
  const flush = () => { ctx.fillText(line, x, y); y += lh; line = ''; n++; };
  for (const ch of String(text)) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line) {
      flush();
      if (n >= maxLines) break;
    }
    line += ch;
  }
  if (line && n < maxLines) ctx.fillText(line, x, y);
  return y + (line ? lh : 0);
}

function dimBar(ctx, x, y, w, label, score) {
  ctx.font = '21px "ZCOOL XiaoWei", "Noto Serif SC", serif';
  ctx.fillStyle = C.ink2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(label, x, y);
  ctx.font = 'italic 19px "Cormorant Garamond", serif';
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

const GRADE_OF = (s) =>
  s >= 90 ? ['甲', '上品'] : s >= 75 ? ['乙', '佳品'] : s >= 60 ? ['丙', '中品'] : s >= 40 ? ['丁', '尚可'] : ['劣', '不逮'];

/**
 * 绘制设计卡
 * spec: { mode:'free'|'challenge', dynasty:{name,name_en}, identity:{name},
 *         choices, result, serial }
 */
async function drawDesignCard(canvas, spec) {
  await readyFonts();
  const ctx = canvas.getContext('2d');
  const { mode, dynasty, identity, choices, result, serial } = spec;
  const img = await loadImage(choices.body ? imgProxy(choices.body.image) : '');

  paintPaper(ctx);
  const M = 70;
  const SERIF = '"Noto Serif SC", "Songti SC", serif';
  const XIAO = '"ZCOOL XiaoWei", "Noto Serif SC", serif';
  const CALLI = '"Ma Shan Zheng", "STKaiti", serif';

  /* ── 页眉 ── */
  seal(ctx, M, 62, 50, '华\n服', C.cinnabar, 20);
  ctx.textAlign = 'left';
  fitText(ctx, '华服千载', M + 66, 84, 220, 29, XIAO, { color: C.ink });
  ctx.font = 'italic 13px "Cormorant Garamond", serif';
  ctx.fillStyle = C.ink3;
  ctx.fillText('COSTUME MUSEUM OF ANCIENT CHINA', M + 66, 106);

  ctx.textAlign = 'right';
  fitText(ctx, mode === 'challenge' ? '历史考据帖' : '服饰设计帖', CARD_W - M, 82, 260, 20, XIAO, { align: 'right', color: C.cinnabar });
  ctx.font = 'italic 12.5px "Cormorant Garamond", serif';
  ctx.fillStyle = C.ink3;
  ctx.fillText(mode === 'challenge' ? 'Authenticity Examination' : 'Personal Design Card', CARD_W - M, 105);

  /* 金线 */
  const goldLine = ctx.createLinearGradient(M, 0, CARD_W - M, 0);
  goldLine.addColorStop(0, 'transparent');
  goldLine.addColorStop(0.2, C.gold);
  goldLine.addColorStop(0.8, C.gold);
  goldLine.addColorStop(1, 'transparent');
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = goldLine;
  ctx.fillRect(M, 126, CARD_W - M * 2, 1.5);
  ctx.globalAlpha = 1;

  /* ── 标题 ── */
  const tieName = `${dynasty.name}・${identity.name}`;
  fitText(ctx, tieName, CARD_W / 2, 205, CARD_W - M * 2, 62, CALLI, { align: 'center', color: C.ink, min: 40 });
  ctx.textAlign = 'center';
  ctx.font = 'italic 19px "Cormorant Garamond", serif';
  ctx.fillStyle = C.gold;
  ctx.fillText(`${dynasty.name_en || ''} · ${mode === 'challenge' ? 'Kaoju Challenge' : 'Design Atelier'}`, CARD_W / 2, 236);

  const today = new Date();
  ctx.font = '16px ' + SERIF;
  ctx.fillStyle = C.ink2;
  ctx.fillText(`${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日　·　帖号 ${serial}`, CARD_W / 2, 270);

  /* ── 左：衣身立轴 ── */
  const imgX = M, imgY = 300, imgW = 390, imgH = 424;
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
    ctx.font = '140px ' + CALLI;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('衣', imgX + imgW / 2, imgY + imgH / 2 - 10);
    ctx.textBaseline = 'alphabetic';
  }
  ctx.strokeStyle = C.lineSoft;
  ctx.strokeRect(imgX + 8, imgY + 8, imgW - 16, imgH - 16);

  ctx.textAlign = 'center';
  ctx.font = '14px ' + SERIF;
  ctx.fillStyle = C.ink3;
  ctx.fillText('— 衣身立轴 · 取自本馆馆藏 —', imgX + imgW / 2, imgY + imgH + 38);
  fitText(ctx, choices.body ? choices.body.key : '未择衣身',
    imgX + imgW / 2, imgY + imgH + 80, imgW, 30, CALLI, { align: 'center', color: C.ink, min: 20 });

  /* 衣身考据点 */
  if (choices.body?.note) {
    ctx.textAlign = 'left';
    ctx.font = '14px ' + SERIF;
    wrapText(ctx, choices.body.note, imgX, imgY + imgH + 106, imgW, 19, 2, { color: C.ink2 });
  }

  /* ── 右：裁衣档 ── */
  const rx = imgX + imgW + 52;
  const rw = CARD_W - M - rx;
  let ry = imgY + 8;
  ctx.textAlign = 'left';
  fitText(ctx, '裁 衣 档', rx, ry, 200, 22, XIAO, { color: C.cinnabar });
  ctx.fillStyle = C.gold;
  ctx.fillRect(rx, ry + 12, 44, 1.5);
  ry += 44;

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
  const rowH = 52;
  rows.forEach(([k, v, hex], idx) => {
    const y0 = ry + idx * rowH;
    ctx.textAlign = 'left';
    ctx.fillStyle = C.ink3;
    fitText(ctx, k, rx, y0, 70, 18, XIAO, { color: C.ink3 });
    let maxW = rw - 78;
    if (hex) {
      ctx.fillStyle = hex;
      ctx.fillRect(rx + rw - 30, y0 - 17, 24, 21);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.strokeRect(rx + rw - 30, y0 - 17, 24, 21);
      maxW -= 38;
    }
    fitText(ctx, String(v), rx + 76, y0, maxW, 20, SERIF, { color: C.ink, min: 12.5 });
    ctx.strokeStyle = C.lineSoft;
    ctx.beginPath();
    ctx.moveTo(rx, y0 + 16);
    ctx.lineTo(rx + rw, y0 + 16);
    ctx.stroke();
  });

  /* ── 底部评案区（y ≥ 872） ── */
  const py = 906;
  ctx.strokeStyle = C.line;
  ctx.beginPath();
  ctx.moveTo(M, py - 34);
  ctx.lineTo(CARD_W - M, py - 34);
  ctx.stroke();

  ctx.textAlign = 'left';
  fitText(ctx, mode === 'challenge' ? '考 据 评 案' : '裁 衣 评 案', M, py - 6, 240, 22, XIAO, { color: C.cinnabar });

  /* 左：分数圆印 + 等级方印 */
  const cx = M + 58, cyy = py + 102;
  ctx.beginPath();
  ctx.arc(cx, cyy, 56, 0, Math.PI * 2);
  ctx.fillStyle = mode === 'challenge' ? C.jade : C.cinnabar;
  ctx.fill();
  ctx.fillStyle = '#f7efdd';
  ctx.textAlign = 'center';
  ctx.font = '46px ' + CALLI;
  ctx.fillText(String(result.total), cx, cyy + 5);
  ctx.font = '12.5px ' + SERIF;
  ctx.fillText('分 / 百', cx, cyy + 32);

  const [grade, gradeLabel] = GRADE_OF(result.total);
  seal(ctx, cx + 30, cyy - 92, 44, grade, C.ink, 23);

  /* 中：雅号 / 评语 / 成套 */
  const tx = M + 168;
  const tw = 300;
  fitText(ctx, mode === 'challenge' ? `评第 · ${gradeLabel}` : result.title,
    tx, py + 14, tw, 30, CALLI, { color: C.ink, min: 18 });
  ctx.textAlign = 'left';
  ctx.font = '14px ' + SERIF;
  const phraseTxt = result.phrases.length ? result.phrases.join(' · ') : '搭配平平，未入流品';
  wrapText(ctx, phraseTxt, tx, py + 44, tw, 20, 2, { color: C.ink2 });
  if (result.synergies?.length) {
    ctx.font = '13.5px ' + SERIF;
    wrapText(ctx, '✦ ' + result.synergies[0].text, tx, py + 96, tw, 19, 3, { color: '#8a6a30' });
  }

  /* 右：四维分条 */
  const bx = tx + tw + 24;
  const bw = CARD_W - M - bx;
  dimBar(ctx, bx, py + 4, bw, '符合时代', result.dims.era.score);
  dimBar(ctx, bx, py + 54, bw, '身份匹配', result.dims.role.score);
  dimBar(ctx, bx, py + 104, bw, '色彩协调', result.dims.color.score);
  dimBar(ctx, bx, py + 154, bw, '搭配和谐', result.dims.harmony.score);

  /* 页脚 */
  ctx.textAlign = 'center';
  ctx.font = '16px ' + SERIF;
  ctx.fillStyle = C.ink3;
  ctx.fillText('垂 衣 裳 而 天 下 治　·　华 服 千 载 数 字 展 馆 · 设 计 局 雅 集', CARD_W / 2, CARD_H - 72);
  ctx.font = 'italic 12.5px "Cormorant Garamond", serif';
  ctx.fillText('Digital pavilion illustration · AI-generated image, for cultural play only', CARD_W / 2, CARD_H - 50);

  return canvas;
}

window.drawDesignCard = drawDesignCard;
