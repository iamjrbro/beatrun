/* ============================================================
   CLOUD RUNNER – game.js
   Tema: céu e nuvens  |  Personagem: menina chibi fofa
   ============================================================ */

const canvas  = document.getElementById('game');
const ctx     = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const comboEl = document.getElementById('combo');
const music   = document.getElementById('music');

ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

/* ── RESIZE ── */
function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

/* ── ÁUDIO ── */
let audioCtx = null;
function getAC() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function tone(freq, type, dur, vol = 0.18) {
  try {
    const a = getAC(), o = a.createOscillator(), g = a.createGain();
    o.connect(g); g.connect(a.destination);
    o.type = type;
    o.frequency.setValueAtTime(freq, a.currentTime);
    g.gain.setValueAtTime(vol, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
    o.start(); o.stop(a.currentTime + dur);
  } catch(e) {}
}
function sfxJump()  { tone(420,'sine',0.15); setTimeout(()=>tone(620,'sine',0.1),50); }
function sfxScore() { tone(520,'sine',0.07,0.12); setTimeout(()=>tone(780,'sine',0.07,0.1),45); }
function sfxDead()  { tone(200,'sawtooth',0.06,0.25); tone(130,'sawtooth',0.4,0.2); }
function startMusic(){ music.play().catch(()=>{}); }

/* ── ESTADO ── */
let STATE    = 'start';
let score    = 0, combo = 0, level = 1;
let frame    = 0, highScore = 0, spawnTimer = 0;

/* ── PLAYER ── */
const player = {
  x: 0, y: 0, vy: 0,
  w: 46, h: 68,
  jumpCount: 0, maxJumps: 2,
  onGround: false,
  squish: 1, squishV: 0,
  run: 0,
};
const GRAVITY = 0.6, JUMP = -14.5;

function getGround() { return canvas.height - 100; }

/* ── LISTAS ── */
let clouds = [], particles = [], bgClouds = [], comboTexts = [], trail = [];

/* ── NUVENS DE FUNDO (decorativas) ── */
function buildBgClouds() {
  bgClouds = [];
  for (let i = 0; i < 7; i++) bgClouds.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height * 0.65,
    scale: Math.random() * 0.8 + 0.4,
    speed: Math.random() * 0.4 + 0.1,
    alpha: Math.random() * 0.35 + 0.15,
  });
}
buildBgClouds();

/* ── RESET ── */
function resetGame() {
  score = 0; combo = 0; level = 1; frame = 0; spawnTimer = 0;
  clouds = []; particles = []; comboTexts = []; trail = [];
  player.y = getGround();
  player.vy = 0; player.onGround = true; player.jumpCount = 0;
  player.squish = 1; player.squishV = 0; player.run = 0;
  scoreEl.textContent = '0'; comboEl.textContent = 'x0'; levelEl.textContent = '1';
  STATE = 'playing';
  startMusic();
}

/* ── PULO ── */
function doJump() {
  if (STATE !== 'playing') { resetGame(); return; }
  if (player.jumpCount < player.maxJumps) {
    player.vy = JUMP;
    player.jumpCount++;
    player.squish = 1.38;
    sfxJump();
    for (let i = 0; i < 8; i++) particles.push({
      x: player.x, y: player.y + player.h * 0.35,
      vx: (Math.random() - 0.5) * 4, vy: Math.random() * 2 + 1,
      life: 1, r: Math.random() * 4 + 2, color: '#ffffff',
    });
  }
}

document.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); doJump(); }
});
canvas.addEventListener('pointerdown', () => doJump());

/* ── SPAWN NUVEM OBSTÁCULO ── */
function spawnCloud() {
  /* variação de altura: no chão ou levemente elevada */
  const lifted = Math.random() < 0.35;
  const yOff   = lifted ? -(40 + Math.random() * 50) : 0;
  clouds.push({
    x: canvas.width + 60,
    y: getGround() + yOff,
    w: 70 + Math.random() * 40,
    h: 40 + Math.random() * 18,
    speed: 5 + level * 0.6,
  });
}

function hitParticles(x, y) {
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2, s = Math.random() * 6 + 2;
    particles.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 1, r: Math.random()*5+2, color: '#ff7eb3' });
  }
}

function addComboText(text, color) {
  comboTexts.push({ x: canvas.width / 2, y: getGround() - 70, text, color, life: 1, vy: -2 });
}

/* ── UPDATE ── */
function update() {
  frame++; player.run++;
  level = 1 + Math.floor(score / 200);
  levelEl.textContent = level;
  const si = Math.max(40, 100 - level * 10);
  if (++spawnTimer >= si) { spawnTimer = 0; spawnCloud(); }

  /* física */
  player.vy += GRAVITY; player.y += player.vy;
  const g = getGround();
  if (player.y >= g) {
    player.y = g; player.vy = 0; player.onGround = true;
    player.jumpCount = 0; player.squish = 0.76;
  } else { player.onGround = false; }

  player.squishV += (1 - player.squish) * 0.28;
  player.squishV *= 0.62;
  player.squish  += player.squishV;

  /* trail */
  trail.push({ x: player.x, y: player.y, life: 1 });
  if (trail.length > 10) trail.shift();
  trail.forEach(t => t.life -= 0.1);

  /* nuvens obstáculo */
  for (let i = clouds.length - 1; i >= 0; i--) {
    const c = clouds[i];
    c.x -= c.speed + level * 0.3;

    const mg = 12;
    const px = player.x - player.w/2 + mg, py = player.y - (player.h*player.squish)/2 + mg;
    const pw = player.w - mg*2, ph = player.h*player.squish - mg*2;
    if (px < c.x+c.w && px+pw > c.x && py < c.y+c.h && py+ph > c.y) {
      STATE = 'dead';
      if (score > highScore) highScore = score;
      sfxDead(); hitParticles(player.x, player.y); clouds = []; return;
    }

    if (c.x + c.w < 0) {
      const bonus = 10 * (1 + Math.floor(combo / 5));
      score += bonus; combo++;
      scoreEl.textContent = score; comboEl.textContent = 'x' + combo; sfxScore();
      addComboText(combo > 1 ? '+'+bonus+' x'+combo+' COMBO!' : '+10',
        combo > 14 ? '#ffaa00' : combo > 7 ? '#ee44aa' : '#3366cc');
      clouds.splice(i, 1);
    }
  }

  particles.forEach(p => { p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.life-=0.033; });
  particles = particles.filter(p => p.life > 0);
  comboTexts.forEach(c => { c.y+=c.vy; c.life-=0.022; });
  comboTexts = comboTexts.filter(c => c.life > 0);
}

/* ================================================================
   FUNDO – gradiente de céu, nuvens decorativas, chão gramado
================================================================ */
function drawBackground() {
  const w = canvas.width, h = canvas.height;

  /* céu gradiente */
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#5bc8f5');
  sky.addColorStop(0.6, '#a8dff7');
  sky.addColorStop(1, '#d4f0ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  /* sol */
  ctx.save();
  ctx.fillStyle = '#fff9b0';
  ctx.shadowColor = '#ffee44'; ctx.shadowBlur = 40;
  ctx.beginPath(); ctx.arc(w - 90, 70, 38, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fffde0';
  ctx.beginPath(); ctx.arc(w - 90, 70, 28, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  /* nuvens de fundo (decorativas) */
  const bgs = 0.3 + level * 0.1;
  bgClouds.forEach(bc => {
    bc.x -= bc.speed * bgs;
    if (bc.x + 120 * bc.scale < 0) {
      bc.x = w + 20;
      bc.y = Math.random() * h * 0.6;
    }
    drawCloudShape(bc.x, bc.y, bc.scale, bc.alpha);
  });

  /* chão gramado */
  const groundY = getGround() + player.h * 0.45 + 6;

  /* terra */
  const dirtGrad = ctx.createLinearGradient(0, groundY, 0, h);
  dirtGrad.addColorStop(0, '#8B6914');
  dirtGrad.addColorStop(1, '#6b4f0f');
  ctx.fillStyle = dirtGrad;
  ctx.fillRect(0, groundY + 12, w, h - groundY);

  /* grama */
  const grassGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 14);
  grassGrad.addColorStop(0, '#5db842');
  grassGrad.addColorStop(1, '#3d9e28');
  ctx.fillStyle = grassGrad;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 12);

  /* borda ondulada da grama */
  for (let x = 0; x <= w; x += 18) {
    const wave = Math.sin((x + frame * 1.2) * 0.15) * 3;
    ctx.lineTo(x, groundY + wave);
  }
  ctx.lineTo(w, groundY + 12);
  ctx.closePath();
  ctx.fill();

  /* flores decorativas na grama */
  const flowerOff = (frame * 2) % 120;
  for (let fx = (-flowerOff % 120); fx < w; fx += 120) {
    drawFlower(fx + 40, groundY + 4, '#ff9ecd');
    drawFlower(fx + 90, groundY + 2, '#ffec6e');
  }
}

function drawFlower(x, y, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ffee44';
  ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
}

/* ── NUVEM OBSTÁCULO ── */
function drawCloudShape(x, y, scale = 1, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(180,220,255,0.4)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(x + 20*scale, y + 10*scale, 16*scale, 0, Math.PI*2);
  ctx.arc(x + 40*scale, y,            20*scale, 0, Math.PI*2);
  ctx.arc(x + 62*scale, y + 8*scale,  16*scale, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
  ctx.shadowBlur = 0;
}

function drawObstacleClouds() {
  clouds.forEach(c => {
    /* sombra da nuvem */
    ctx.fillStyle = 'rgba(150,200,230,0.18)';
    ctx.beginPath();
    ctx.ellipse(c.x + c.w/2, getGround() + player.h*0.5 + 14, c.w*0.45, 7, 0, 0, Math.PI*2);
    ctx.fill();

    /* nuvem branca fofa em 3 esferas */
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(100,160,220,0.35)'; ctx.shadowBlur = 10;
    const cx = c.x, cy = c.y, cw = c.w, ch = c.h;
    ctx.beginPath();
    ctx.arc(cx + cw*0.25, cy + ch*0.55, ch*0.5,  0, Math.PI*2);
    ctx.arc(cx + cw*0.5,  cy + ch*0.3,  ch*0.6,  0, Math.PI*2);
    ctx.arc(cx + cw*0.78, cy + ch*0.55, ch*0.45, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;

    /* borda sutil para indicar perigo */
    ctx.save();
    ctx.strokeStyle = 'rgba(150,200,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx + cw*0.5, cy + ch*0.3, ch*0.62, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
  });
}

/* ================================================================
   TRAIL
================================================================ */
function drawTrail() {
  trail.forEach((t, i) => {
    ctx.fillStyle = `rgba(255,180,220,${t.life * 0.2 * (i / trail.length)})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, (i / trail.length) * 14, 0, Math.PI*2);
    ctx.fill();
  });
}

/* ================================================================
   PERSONAGEM – MENINA CHIBI FOFA
   Vestidinho azul claro, cabelo castanho com lacinho,
   olhos grandes expressivos, bochechas rosadas.
================================================================ */
function drawPlayer() {
  const sq = player.squish, t = player.run;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.scale(1/sq, sq);

  const HR = 22;        // raio da cabeça
  const HY = -30;       // centro da cabeça
  const bodyTop = HY + HR - 4;
  const bodyH   = 20;
  const bodyW   = 28;

  /* sombra */
  if (player.onGround) {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath(); ctx.ellipse(0, 28, 18, 4, 0, 0, Math.PI*2); ctx.fill();
  }

  const legS = player.onGround ? Math.sin(t * 0.28) * 20 : 0;
  const armS = player.onGround ? Math.cos(t * 0.28) * 22 : 10;

  /* ── PERNAS ── */
  // perna esq
  ctx.save();
  ctx.translate(-8, bodyTop + bodyH - 2); ctx.rotate(legS * Math.PI/180);
  ctx.fillStyle = '#f5c8dc'; // meia rosa
  ctx.beginPath(); ctx.roundRect(-4, 0, 9, 18, 3); ctx.fill();
  ctx.fillStyle = '#cc4488'; // sapatinho
  ctx.beginPath(); ctx.roundRect(-6, 14, 13, 6, [2,2,4,4]); ctx.fill();
  ctx.fillStyle = '#ff88bb';
  ctx.beginPath(); ctx.roundRect(-5, 13, 11, 3, 2); ctx.fill();
  ctx.restore();

  // perna dir
  ctx.save();
  ctx.translate(8, bodyTop + bodyH - 2); ctx.rotate(-legS * Math.PI/180);
  ctx.fillStyle = '#f5c8dc';
  ctx.beginPath(); ctx.roundRect(-5, 0, 9, 18, 3); ctx.fill();
  ctx.fillStyle = '#cc4488';
  ctx.beginPath(); ctx.roundRect(-6, 14, 13, 6, [2,2,4,4]); ctx.fill();
  ctx.fillStyle = '#ff88bb';
  ctx.beginPath(); ctx.roundRect(-5, 13, 11, 3, 2); ctx.fill();
  ctx.restore();

  /* ── VESTIDINHO ── */
  ctx.fillStyle = '#6bb8f0'; // azul claro
  ctx.beginPath(); ctx.roundRect(-bodyW/2, bodyTop, bodyW, bodyH, [3,3,8,8]); ctx.fill();
  // saia flared
  ctx.beginPath();
  ctx.moveTo(-bodyW/2 - 4, bodyTop + bodyH);
  ctx.bezierCurveTo(-bodyW/2 - 6, bodyTop + bodyH + 8, bodyW/2 + 6, bodyTop + bodyH + 8, bodyW/2 + 4, bodyTop + bodyH);
  ctx.closePath();
  ctx.fillStyle = '#7dc8ff';
  ctx.fill();
  // detalhinho gola
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(0, bodyTop + 4, 8, 4, 0, 0, Math.PI*2); ctx.fill();
  // laço na cintura
  ctx.fillStyle = '#ff88bb';
  ctx.beginPath(); ctx.ellipse(-5, bodyTop + bodyH - 4, 5, 3, -0.3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 5, bodyTop + bodyH - 4, 5, 3,  0.3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ff66aa';
  ctx.beginPath(); ctx.arc(0, bodyTop + bodyH - 4, 3, 0, Math.PI*2); ctx.fill();

  /* ── BRAÇOS ── */
  // braço esq
  ctx.save();
  ctx.translate(-bodyW/2 + 1, bodyTop + 5); ctx.rotate(armS * Math.PI/180);
  ctx.fillStyle = '#6bb8f0';
  ctx.beginPath(); ctx.roundRect(-4, 0, 8, 13, 4); ctx.fill();
  ctx.fillStyle = '#fde8d8'; // mãozinha
  ctx.beginPath(); ctx.arc(0, 15, 5, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // braço dir
  ctx.save();
  ctx.translate(bodyW/2 - 1, bodyTop + 5); ctx.rotate(-armS * Math.PI/180);
  ctx.fillStyle = '#6bb8f0';
  ctx.beginPath(); ctx.roundRect(-4, 0, 8, 13, 4); ctx.fill();
  ctx.fillStyle = '#fde8d8';
  ctx.beginPath(); ctx.arc(0, 15, 5, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  /* ── CABEÇA ── */
  ctx.fillStyle = '#fde8d8';
  ctx.beginPath(); ctx.arc(0, HY, HR, 0, Math.PI*2); ctx.fill();

  /* bochechas */
  ctx.fillStyle = 'rgba(255, 140, 160, 0.35)';
  ctx.beginPath(); ctx.ellipse(-13, HY+7, 7, 5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 13, HY+7, 7, 5, 0, 0, Math.PI*2); ctx.fill();

  /* sobrancelhas */
  ctx.strokeStyle = '#7a5030'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-13, HY-10); ctx.quadraticCurveTo(-9, HY-13, -5, HY-11); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( 13, HY-10); ctx.quadraticCurveTo( 9, HY-13,  5, HY-11); ctx.stroke();

  /* olhos grandes */
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(-8, HY-2, 7, 7.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 8, HY-2, 7, 7.5, 0, 0, Math.PI*2); ctx.fill();
  // íris castanha
  ctx.fillStyle = '#7a4820';
  ctx.beginPath(); ctx.arc(-8, HY-1, 5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 8, HY-1, 5, 0, Math.PI*2); ctx.fill();
  // pupila
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(-8, HY-1, 2.8, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 8, HY-1, 2.8, 0, Math.PI*2); ctx.fill();
  // brilhos
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-6.5, HY-3.5, 2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 9.5, HY-3.5, 2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(-10, HY+0.5, 1.1, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(  6, HY+0.5, 1.1, 0, Math.PI*2); ctx.fill();

  /* nariz */
  ctx.fillStyle = '#e0a882';
  ctx.beginPath(); ctx.arc(-2, HY+7, 1.4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 2, HY+7, 1.4, 0, Math.PI*2); ctx.fill();

  /* boca – sorriso feliz */
  ctx.fillStyle = '#c03050';
  ctx.beginPath(); ctx.arc(0, HY+12, 5, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#f8f8f8';
  ctx.beginPath(); ctx.roundRect(-4, HY+12, 8, 3, [0,0,2,2]); ctx.fill();

  /* ── CABELO CASTANHO COM LACINHO ── */
  ctx.fillStyle = '#8B4513'; // castanho escuro
  // calota
  ctx.beginPath(); ctx.arc(0, HY, HR, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.arc(0, HY, HR, Math.PI*0.9, Math.PI*0.1); ctx.fill();
  // lateral esq
  ctx.beginPath();
  ctx.moveTo(-HR, HY);
  ctx.bezierCurveTo(-HR-5, HY+2, -HR-5, HY+14, -HR+3, HY+18);
  ctx.bezierCurveTo(-HR+8, HY+16, -HR+6, HY+4, -HR, HY);
  ctx.fill();
  // lateral dir
  ctx.beginPath();
  ctx.moveTo(HR, HY);
  ctx.bezierCurveTo(HR+5, HY+2, HR+5, HY+14, HR-3, HY+18);
  ctx.bezierCurveTo(HR-8, HY+16, HR-6, HY+4, HR, HY);
  ctx.fill();
  // franja
  ctx.fillStyle = '#a0521e';
  ctx.beginPath();
  ctx.moveTo(-HR+2, HY-2);
  ctx.bezierCurveTo(-HR+4, HY-14, -8, HY-HR-2, 0, HY-HR-2);
  ctx.bezierCurveTo(8, HY-HR-2, HR-4, HY-14, HR-2, HY-2);
  ctx.fill();
  ctx.fillStyle = '#8B4513';
  ctx.beginPath();
  ctx.moveTo(-14, HY-14);
  ctx.bezierCurveTo(-10, HY-5, -5, HY-5, 0, HY-6);
  ctx.bezierCurveTo(5, HY-5, 10, HY-5, 14, HY-14);
  ctx.fill();

  /* lacinho rosa no cabelo */
  ctx.fillStyle = '#ff88cc';
  // asa esq do laço
  ctx.beginPath();
  ctx.moveTo(-HR+6, HY-HR+4);
  ctx.bezierCurveTo(-HR-4, HY-HR-4, -HR-6, HY-HR+8, -HR+6, HY-HR+10);
  ctx.fill();
  // asa dir
  ctx.beginPath();
  ctx.moveTo(-HR+6, HY-HR+4);
  ctx.bezierCurveTo(4, HY-HR-4, 6, HY-HR+8, -HR+6, HY-HR+10);
  ctx.fill();
  // nozinho
  ctx.fillStyle = '#ff55aa';
  ctx.beginPath(); ctx.arc(-HR+6, HY-HR+7, 4, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ff99dd';
  ctx.beginPath(); ctx.arc(-HR+5, HY-HR+6, 1.8, 0, Math.PI*2); ctx.fill();

  ctx.restore();
}

/* ================================================================
   PARTÍCULAS + COMBO TEXTS
================================================================ */
function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}

function drawComboTexts() {
  comboTexts.forEach(c => {
    ctx.globalAlpha = c.life;
    ctx.fillStyle = c.color;
    ctx.shadowColor = c.color; ctx.shadowBlur = 6;
    ctx.font = `bold ${16 + Math.min(combo, 14)}px Arial`;
    ctx.textAlign = 'center'; ctx.fillText(c.text, c.x, c.y);
  });
  ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.textAlign = 'left';
}

/* ================================================================
   TELAS – START / GAME OVER
================================================================ */
function _btn(cx, cy, bw, bh, label, bgColor, textColor) {
  const x = cx - bw/2, y = cy - bh/2;
  ctx.shadowColor = bgColor; ctx.shadowBlur = 14;
  ctx.fillStyle = bgColor;
  ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 12); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = textColor || '#fff';
  ctx.font = `bold 17px Arial`;
  ctx.textAlign = 'center'; ctx.fillText(label, cx, cy + 6);
}

function drawStart() {
  const w = canvas.width, h = canvas.height;

  // painel
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath(); ctx.roundRect(w/2 - 230, h/2 - 130, 460, 230, 20); ctx.fill();
  ctx.strokeStyle = 'rgba(100,180,255,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(w/2 - 230, h/2 - 130, 460, 230, 20); ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#2266aa';
  ctx.font = `bold ${Math.min(w * 0.07, 46)}px Arial`;
  ctx.shadowColor = 'rgba(100,200,255,0.5)'; ctx.shadowBlur = 16;
  ctx.fillText('CLOUD RUNNER', w/2, h/2 - 72);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#5599cc';
  ctx.font = `${Math.min(w * 0.03, 15)}px Arial`;
  ctx.fillText('Desvie das nuvens pulando! Duplo pulo disponível ☁️', w/2, h/2 - 36);
  ctx.fillText('ESPAÇO / TOQUE para pular', w/2, h/2 - 10);

  _btn(w/2, h/2 + 46, 200, 50, '✨ COMEÇAR', '#3399ee', '#fff');
  ctx.textAlign = 'left';
}

function drawDead() {
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.roundRect(w/2 - 220, h/2 - 130, 440, 240, 20); ctx.fill();
  ctx.strokeStyle = 'rgba(255,120,180,0.4)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(w/2 - 220, h/2 - 130, 440, 240, 20); ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#cc3366';
  ctx.font = `bold ${Math.min(w*0.08, 48)}px Arial`;
  ctx.shadowColor = 'rgba(255,100,150,0.4)'; ctx.shadowBlur = 14;
  ctx.fillText('GAME OVER', w/2, h/2 - 72);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#444';
  ctx.font = `${Math.min(w*0.038, 20)}px Arial`;
  ctx.fillText('Score: ' + score, w/2, h/2 - 34);
  ctx.fillStyle = '#cc8800';
  ctx.font = `${Math.min(w*0.032, 16)}px Arial`;
  ctx.fillText('Melhor: ' + highScore, w/2, h/2 - 8);

  _btn(w/2, h/2 + 50, 220, 50, '🔄 JOGAR DE NOVO', '#3399ee', '#fff');
  ctx.textAlign = 'left';
}

/* ================================================================
   LOOP
================================================================ */
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  player.x = Math.min(150, canvas.width * 0.16);

  drawBackground();
  drawTrail();
  drawObstacleClouds();
  drawPlayer();
  drawParticles();
  drawComboTexts();

  if      (STATE === 'start')   drawStart();
  else if (STATE === 'playing') update();
  else                          drawDead();

  requestAnimationFrame(gameLoop);
}

/* polyfill roundRect Safari */
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r) {
    if (typeof r === 'number') r = [r,r,r,r];
    this.beginPath();
    this.moveTo(x+r[0], y);
    this.arcTo(x+w, y,   x+w, y+h, r[1]);
    this.arcTo(x+w, y+h, x,   y+h, r[2]);
    this.arcTo(x,   y+h, x,   y,   r[3]);
    this.arcTo(x,   y,   x+w, y,   r[0]);
    this.closePath();
  };
}

gameLoop();