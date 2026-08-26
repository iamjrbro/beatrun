/* ============================================================
   BEAT RUNNER – game.js
   Presente para o DJ – personagem inspirado na arte fornecida
   ============================================================ */

const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const levelEl = document.getElementById('level');
const music   = document.getElementById('music');

/* ── RESIZE ── */
function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

/* ── ÁUDIO SINTÉTICO ── */
let audioCtx = null;
function ac() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTone(freq, type, duration, vol = 0.2) {
  try {
    const a = ac();
    const o = a.createOscillator();
    const g = a.createGain();
    o.connect(g); g.connect(a.destination);
    o.type = type;
    o.frequency.setValueAtTime(freq, a.currentTime);
    g.gain.setValueAtTime(vol, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + duration);
    o.start(); o.stop(a.currentTime + duration);
  } catch (e) {}
}
function sfxJump()  { playTone(300,'sine',0.2); setTimeout(()=>playTone(550,'sine',0.12),60); }
function sfxScore() { playTone(440,'sine',0.08,0.15); setTimeout(()=>playTone(660,'sine',0.08,0.12),50); }
function sfxDead()  { playTone(120,'sawtooth',0.5,0.35); }
function startMusic() {
  music.play().catch(()=>{});
}

/* ── ESTADO ── */
let STATE       = 'start'; // 'start' | 'playing' | 'dead'
let score       = 0;
let combo       = 0;
let level       = 1;
let frame       = 0;
let highScore   = 0;
let spawnTimer  = 0;

/* ── PLAYER ── */
const player = {
  x: 0, y: 0,
  vy: 0,
  w: 52, h: 52,
  jumpCount: 0,
  maxJumps: 2,
  onGround: false,
  squish: 1,
  squishV: 0,
  runFrame: 0,
};

const GRAVITY    = 0.65;
const JUMP_FORCE = -15;

function getGround() { return canvas.height - 90; }
function getBeatY()  { return getGround(); }

/* ── LISTAS ── */
let beats      = [];
let particles  = [];
let stars      = [];
let comboTexts = [];
let trail      = [];
let scanLines  = [];

/* ── ESTRELAS ── */
function buildStars() {
  stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.75,
      r: Math.random() * 1.6 + 0.3,
      speed: Math.random() * 0.6 + 0.15,
      phase: Math.random() * Math.PI * 2,
    });
  }
}
buildStars();

/* ── RESET ── */
function resetGame() {
  score = 0; combo = 0; level = 1; frame = 0; spawnTimer = 0;
  beats = []; particles = []; comboTexts = []; trail = [];
  player.y = getGround();
  player.vy = 0;
  player.onGround = true;
  player.jumpCount = 0;
  player.squish = 1;
  player.squishV = 0;
  player.runFrame = 0;
  scoreEl.textContent = '0';
  comboEl.textContent = 'x0';
  levelEl.textContent = '1';
  STATE = 'playing';
  startMusic();
}

/* ── PULO ── */
function doJump() {
  if (STATE === 'start') { resetGame(); return; }
  if (STATE === 'dead')  { resetGame(); return; }
  if (player.jumpCount < player.maxJumps) {
    player.vy = JUMP_FORCE;
    player.jumpCount++;
    player.squish = 1.45;
    sfxJump();
    for (let i = 0; i < 10; i++) {
      particles.push({
        x: player.x, y: player.y + player.h / 2,
        vx: (Math.random() - 0.5) * 5,
        vy:  Math.random() * 3 + 1,
        life: 1, r: Math.random() * 4 + 2,
        color: '#00ffc8',
      });
    }
  }
}

/* ── INPUTS ── */
document.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); doJump(); }
});
canvas.addEventListener('pointerdown', () => doJump());

/* ── SPAWN ── */
const BEAT_TYPES = ['note','note','diamond','circle','vinyl'];

function spawnBeat() {
  const type = BEAT_TYPES[Math.floor(Math.random() * BEAT_TYPES.length)];
  const size = 34 + Math.random() * 14;
  beats.push({
    x: canvas.width + 40,
    y: getBeatY(),
    size,
    type,
    rot: 0,
    speed: 5 + level * 0.6,
    color: type === 'diamond' ? '#ffaa00'
         : type === 'vinyl'   ? '#cc88ff'
         : '#ff44cc',
  });
}

/* ── PARTÍCULA DE HIT ── */
function hitParticles(x, y, color) {
  for (let i = 0; i < 20; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 7 + 2;
    particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 1,
      r: Math.random() * 5 + 2,
      color,
    });
  }
}

/* ── COMBO TEXT ── */
function addComboText(x, y, text, color) {
  comboTexts.push({ x, y, text, color, life: 1, vy: -2.2 });
}

/* ── UPDATE ── */
function update() {
  frame++;
  player.runFrame++;

  /* nível */
  level = 1 + Math.floor(score / 250);
  levelEl.textContent = level;
  const spawnInterval = Math.max(38, 95 - level * 9);

  /* spawn */
  spawnTimer++;
  if (spawnTimer >= spawnInterval) { spawnTimer = 0; spawnBeat(); }

  /* física */
  player.vy += GRAVITY;
  player.y  += player.vy;
  const ground = getGround();
  if (player.y >= ground) {
    player.y = ground;
    player.vy = 0;
    player.onGround = true;
    player.jumpCount = 0;
    player.squish = 0.72;
  } else {
    player.onGround = false;
  }

  /* squish spring */
  player.squishV += (1 - player.squish) * 0.28;
  player.squishV *= 0.62;
  player.squish  += player.squishV;

  /* trail */
  trail.push({ x: player.x, y: player.y, life: 1 });
  if (trail.length > 14) trail.shift();
  trail.forEach(t => t.life -= 0.07);

  /* beats */
  for (let i = beats.length - 1; i >= 0; i--) {
    const b = beats[i];
    b.x  -= b.speed + level * 0.35;
    b.rot += 0.06;

    /* colisão (hitbox reduzida) */
    const margin = 10;
    const px = player.x - player.w / 2 + margin;
    const py = player.y - (player.h * player.squish) / 2 + margin;
    const pw = player.w - margin * 2;
    const ph = player.h * player.squish - margin * 2;
    if (px < b.x + b.size && px + pw > b.x && py < b.y + b.size && py + ph > b.y) {
      STATE = 'dead';
      if (score > highScore) highScore = score;
      sfxDead();
      hitParticles(player.x, player.y, '#ff4466');
      beats = [];
      return;
    }

    /* passou */
    if (b.x < -80) {
      const bonus = 10 * (1 + Math.floor(combo / 5));
      score += bonus;
      combo++;
      scoreEl.textContent = score;
      comboEl.textContent = 'x' + combo;
      sfxScore();
      const label = combo > 1 ? '+' + bonus + '  x' + combo + ' COMBO!' : '+10';
      const col   = combo > 14 ? '#ffdd00' : combo > 7 ? '#00ffc8' : '#ffffff';
      addComboText(canvas.width / 2, getGround() - 60, label, col);
      beats.splice(i, 1);
    }
  }

  /* particles */
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.18;
    p.life -= 0.032;
  });
  particles = particles.filter(p => p.life > 0);

  /* comboTexts */
  comboTexts.forEach(c => { c.y += c.vy; c.life -= 0.022; });
  comboTexts = comboTexts.filter(c => c.life > 0);
}

/* ================================================================
   DRAW – FUNDO
   ================================================================ */
function drawBackground() {
  const w = canvas.width, h = canvas.height;

  /* céu */
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#03030f');
  sky.addColorStop(1, '#08081a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  /* grade perspectiva (chão) */
  const vanishY = h * 0.55;
  const gridOff = (frame * 2) % 60;
  ctx.strokeStyle = 'rgba(0,255,200,0.06)';
  ctx.lineWidth = 1;

  /* linhas verticais perspectiva */
  for (let i = -20; i <= 20; i++) {
    const bx = w / 2 + i * 80;
    ctx.beginPath();
    ctx.moveTo(w / 2, vanishY);
    ctx.lineTo(bx, h);
    ctx.stroke();
  }
  /* linhas horizontais */
  for (let d = 0; d < 1; d += 0.06) {
    const y = vanishY + (h - vanishY) * Math.pow((d + (gridOff / 600)) % 1, 1.3);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  /* estrelas */
  const starSpeed = 0.5 + level * 0.3;
  stars.forEach(s => {
    s.x -= s.speed * starSpeed;
    if (s.x < 0) { s.x = w + 5; s.y = Math.random() * h * 0.55; }
    const pulse = 0.5 + 0.5 * Math.sin(frame * 0.05 + s.phase);
    ctx.fillStyle = `rgba(180,220,255,${0.25 + pulse * 0.5})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  /* chão glow */
  const gY = getGround() + player.h / 2 + 6;
  ctx.save();
  ctx.shadowColor = '#00ffc8';
  ctx.shadowBlur  = 18;
  ctx.strokeStyle = '#00ffc8';
  ctx.lineWidth   = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, gY);
  ctx.lineTo(w, gY);
  ctx.stroke();
  ctx.restore();

  /* reflexo chão */
  const ref = ctx.createLinearGradient(0, gY, 0, gY + 40);
  ref.addColorStop(0, 'rgba(0,255,200,0.12)');
  ref.addColorStop(1, 'rgba(0,255,200,0)');
  ctx.fillStyle = ref;
  ctx.fillRect(0, gY, w, 40);
}

/* ================================================================
   DRAW – PERSONAGEM DJ
   Fiel à pixel art: corpo robusto e baixo, rosto gordo/redondo,
   moletom baggy preto com capuz, calça cargo larga, tênis preto
   grosso estilo chunky, corrente dourada dupla, cabelo loiro
   curtíssimo tipo buzz cut. Animação de corrida com balanço.
   ================================================================ */
function drawPlayer() {
  const sq  = player.squish;
  const leg = player.runFrame;

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.scale(1 / sq, sq);

  // ── PROPORÇÕES FIÉIS À IMAGEM ──
  // corpo largo e baixo, pernas curtas e grossas
  // a origem (0,0) é o chão dos pés
  // tudo construído de baixo para cima

  const legSwing = player.onGround ? Math.sin(leg * 0.2) * 10 : 0;
  const armSwing = player.onGround ? Math.cos(leg * 0.2) * 14 : 5;

  /* ── SOMBRA ── */
  if (player.onGround) {
    ctx.fillStyle = 'rgba(0,255,200,0.1)';
    ctx.beginPath(); ctx.ellipse(0, 2, 28, 5, 0, 0, Math.PI * 2); ctx.fill();
  }

  /* ════════════════════════════════
     TÊNIS – grosso, blocão, preto
  ════════════════════════════════ */
  // pé esq
  ctx.save();
  ctx.translate(-12, 0);
  ctx.rotate(legSwing * Math.PI / 180);
  // solado grosso
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath(); ctx.roundRect(-11, -6, 22, 6, [0, 0, 4, 4]); ctx.fill();
  // corpo do tênis
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.roundRect(-10, -14, 20, 10, [4, 4, 0, 0]); ctx.fill();
  // língua / detalhe
  ctx.fillStyle = '#252525';
  ctx.beginPath(); ctx.roundRect(-7, -14, 14, 5, 2); ctx.fill();
  // cadarço
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-6, -11); ctx.lineTo(6, -11); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-5, -9); ctx.lineTo(5, -9); ctx.stroke();
  ctx.restore();

  // pé dir
  ctx.save();
  ctx.translate(12, 0);
  ctx.rotate(-legSwing * Math.PI / 180);
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath(); ctx.roundRect(-11, -6, 22, 6, [0, 0, 4, 4]); ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.roundRect(-10, -14, 20, 10, [4, 4, 0, 0]); ctx.fill();
  ctx.fillStyle = '#252525';
  ctx.beginPath(); ctx.roundRect(-7, -14, 14, 5, 2); ctx.fill();
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-6, -11); ctx.lineTo(6, -11); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-5, -9); ctx.lineTo(5, -9); ctx.stroke();
  ctx.restore();

  /* ════════════════════════════════
     CALÇA BAGGY – larga, escura, com dobras
  ════════════════════════════════ */
  // perna esq (animada)
  ctx.save();
  ctx.translate(-12, -14);
  ctx.rotate(legSwing * Math.PI / 180);
  // calça extremamente larga
  ctx.fillStyle = '#2a2a2e';
  ctx.beginPath();
  ctx.moveTo(-13, 0);
  ctx.lineTo(-11, -38);
  ctx.lineTo(8,   -38);
  ctx.lineTo(11,  0);
  ctx.closePath();
  ctx.fill();
  // dobra da calça baggy
  ctx.fillStyle = '#222226';
  ctx.beginPath(); ctx.roundRect(-12, -14, 22, 5, 1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-11, -28, 21, 4, 1); ctx.fill();
  // sombra lateral
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(-11, -38); ctx.lineTo(-5, -38); ctx.lineTo(-7, 0); ctx.closePath(); ctx.fill();
  ctx.restore();

  // perna dir (animada oposta)
  ctx.save();
  ctx.translate(12, -14);
  ctx.rotate(-legSwing * Math.PI / 180);
  ctx.fillStyle = '#272730';
  ctx.beginPath();
  ctx.moveTo(-11, 0);
  ctx.lineTo(-8,  -38);
  ctx.lineTo(11,  -38);
  ctx.lineTo(13,  0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#222226';
  ctx.beginPath(); ctx.roundRect(-10, -14, 22, 5, 1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-9,  -28, 21, 4, 1); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(11, -38); ctx.lineTo(5, -38); ctx.lineTo(7, 0); ctx.closePath(); ctx.fill();
  ctx.restore();

  /* ════════════════════════════════
     MOLETOM BAGGY – corpo muito largo
     capuz caído nas costas cria volume atrás
  ════════════════════════════════ */
  const torsoY = -52; // topo do torso
  const torsoH = 38;
  const torsoW = 52;  // muito largo, igual à imagem

  // CORPO do moletom
  ctx.fillStyle = '#252528';
  ctx.beginPath();
  // forma trapezoidal (mais largo embaixo, típico de moletão oversized)
  ctx.moveTo(-torsoW/2 - 4, torsoY + torsoH);
  ctx.lineTo(-torsoW/2 + 2, torsoY);
  ctx.lineTo( torsoW/2 - 2, torsoY);
  ctx.lineTo( torsoW/2 + 4, torsoY + torsoH);
  ctx.closePath();
  ctx.fill();

  // sombra lateral esq (profundidade)
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.moveTo(-torsoW/2 - 4, torsoY + torsoH);
  ctx.lineTo(-torsoW/2 + 2, torsoY);
  ctx.lineTo(-torsoW/2 + 12, torsoY);
  ctx.lineTo(-torsoW/2 + 8, torsoY + torsoH);
  ctx.closePath(); ctx.fill();

  // sombra lateral dir
  ctx.beginPath();
  ctx.moveTo(torsoW/2 + 4, torsoY + torsoH);
  ctx.lineTo(torsoW/2 - 2, torsoY);
  ctx.lineTo(torsoW/2 - 12, torsoY);
  ctx.lineTo(torsoW/2 - 8, torsoY + torsoH);
  ctx.closePath(); ctx.fill();

  // dobra horizontal do moletom (detalhe tecido)
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-torsoW/2, torsoY + torsoH*0.4); ctx.lineTo(torsoW/2, torsoY + torsoH*0.4); ctx.stroke();

  // barra do moletom (parte de baixo)
  ctx.fillStyle = '#1e1e21';
  ctx.beginPath(); ctx.roundRect(-torsoW/2 - 2, torsoY + torsoH - 6, torsoW + 4, 8, [0,0,4,4]); ctx.fill();

  // CAPUZ CAÍDO – volume atrás do pescoço (muito característico)
  ctx.fillStyle = '#2a2a2d';
  ctx.beginPath();
  ctx.arc(4, torsoY + 4, 20, Math.PI * 0.8, Math.PI * 0.2, true);
  ctx.fill();
  ctx.fillStyle = '#222225';
  ctx.beginPath();
  ctx.arc(4, torsoY + 5, 14, Math.PI * 0.85, Math.PI * 0.15, true);
  ctx.fill();
  // sombra dentro do capuz
  ctx.fillStyle = '#111113';
  ctx.beginPath();
  ctx.arc(4, torsoY + 6, 9, Math.PI * 0.9, Math.PI * 0.1, true);
  ctx.fill();

  // bolso canguru (detalhe)
  ctx.fillStyle = '#1e1e22';
  ctx.beginPath(); ctx.roundRect(-14, torsoY + torsoH - 20, 28, 14, [3,3,0,0]); ctx.fill();
  ctx.strokeStyle = '#2a2a2e'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(-14, torsoY + torsoH - 20, 28, 14, [3,3,0,0]); ctx.stroke();

  /* ════════════════════════════════
     CORRENTE DOURADA DUPLA – grossa
  ════════════════════════════════ */
  ctx.shadowColor = '#cc8800'; ctx.shadowBlur = 8;
  // corrente externa (mais grossa)
  ctx.strokeStyle = '#b8820a'; ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-18, torsoY + 10);
  ctx.bezierCurveTo(-12, torsoY + 26, 12, torsoY + 26, 18, torsoY + 10);
  ctx.stroke();
  // corrente interna (mais fina, mais brilhante)
  ctx.strokeStyle = '#e8b820'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-15, torsoY + 11);
  ctx.bezierCurveTo(-9, torsoY + 24, 9, torsoY + 24, 15, torsoY + 11);
  ctx.stroke();
  // pingente
  ctx.fillStyle = '#cc8800';
  ctx.beginPath(); ctx.arc(0, torsoY + 27, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffcc22';
  ctx.beginPath(); ctx.arc(-1, torsoY + 26, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  /* ════════════════════════════════
     BRAÇOS – manga larga, punho dobrado
  ════════════════════════════════ */
  // BRAÇO ESQ
  ctx.save();
  ctx.translate(-torsoW/2 - 2, torsoY + 6);
  ctx.rotate(armSwing * Math.PI / 180);
  // manga superior (larga)
  ctx.fillStyle = '#252528';
  ctx.beginPath();
  ctx.moveTo(-2, 0); ctx.lineTo(-10, 26); ctx.lineTo(4, 26); ctx.lineTo(6, 0);
  ctx.closePath(); ctx.fill();
  // sombra manga
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.moveTo(-2,0); ctx.lineTo(-10,26); ctx.lineTo(-5,26); ctx.lineTo(-1,0); ctx.closePath(); ctx.fill();
  // punho
  ctx.fillStyle = '#1e1e21';
  ctx.beginPath(); ctx.roundRect(-10, 24, 14, 6, 2); ctx.fill();
  // mão – roliça, de pele clara
  ctx.fillStyle = '#e8c898';
  ctx.beginPath(); ctx.ellipse(-3, 35, 7, 6, 0.2, 0, Math.PI * 2); ctx.fill();
  // tatuagem na mão
  ctx.strokeStyle = 'rgba(70,50,130,0.5)'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(-6,33); ctx.lineTo(-1,39); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-2,32); ctx.lineTo(2,38); ctx.stroke();
  ctx.restore();

  // BRAÇO DIR
  ctx.save();
  ctx.translate(torsoW/2 + 2, torsoY + 6);
  ctx.rotate(-armSwing * Math.PI / 180);
  ctx.fillStyle = '#272730';
  ctx.beginPath();
  ctx.moveTo(2, 0); ctx.lineTo(10, 26); ctx.lineTo(-4, 26); ctx.lineTo(-6, 0);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.moveTo(2,0); ctx.lineTo(10,26); ctx.lineTo(5,26); ctx.lineTo(1,0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1e1e21';
  ctx.beginPath(); ctx.roundRect(-4, 24, 14, 6, 2); ctx.fill();
  ctx.fillStyle = '#e8c898';
  ctx.beginPath(); ctx.ellipse(3, 35, 7, 6, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(70,50,130,0.5)'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(0,33); ctx.lineTo(4,39); ctx.stroke();
  ctx.restore();

  /* ════════════════════════════════
     CABEÇA – gorda, redonda, pescoço grosso
     rosto cheio com queixo duplo
  ════════════════════════════════ */
  const HCY = torsoY - 18; // centro do rosto
  const HW  = 22;           // semi-largura (rosto largo)
  const HH  = 20;           // semi-altura

  // pescoço grosso (quase não aparece – cabeça grossa cobre)
  ctx.fillStyle = '#d8b888';
  ctx.beginPath(); ctx.roundRect(-9, torsoY - 8, 18, 12, 4); ctx.fill();

  // QUEIXO DUPLO / papada (detalhe crucial da imagem)
  ctx.fillStyle = '#e8c898';
  ctx.beginPath();
  ctx.ellipse(1, torsoY - 8, HW - 4, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // ROSTO – oval gordo/redondo, mais largo que alto
  ctx.fillStyle = '#f0c890';
  ctx.beginPath();
  ctx.ellipse(1, HCY, HW, HH, 0, 0, Math.PI * 2);
  ctx.fill();

  // volume bochechas (rosto cheio)
  ctx.fillStyle = '#e8be88';
  ctx.beginPath(); ctx.ellipse(-14, HCY + 4, 9, 7, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 16, HCY + 4, 9, 7,  0.2, 0, Math.PI * 2); ctx.fill();

  // sombra embaixo do rosto (volume pescoço/queixo)
  ctx.fillStyle = 'rgba(160,100,40,0.2)';
  ctx.beginPath(); ctx.ellipse(1, HCY + HH - 2, HW - 2, 6, 0, 0, Math.PI * 2); ctx.fill();

  // sombra lateral esq rosto
  ctx.fillStyle = 'rgba(160,100,40,0.15)';
  ctx.beginPath(); ctx.ellipse(-HW + 6, HCY, 8, HH - 4, 0, 0, Math.PI * 2); ctx.fill();

  /* sobrancelhas – grossas, retas, levemente franzidas */
  ctx.fillStyle = '#7a5528';
  // esq
  ctx.beginPath();
  ctx.moveTo(-16, HCY - 12);
  ctx.lineTo(-5,  HCY - 13);
  ctx.lineTo(-5,  HCY - 10);
  ctx.lineTo(-16, HCY - 9);
  ctx.closePath(); ctx.fill();
  // dir
  ctx.beginPath();
  ctx.moveTo(7,   HCY - 13);
  ctx.lineTo(18,  HCY - 12);
  ctx.lineTo(18,  HCY - 9);
  ctx.lineTo(7,   HCY - 10);
  ctx.closePath(); ctx.fill();
  // franzido (risco entre sobrancelhas)
  ctx.strokeStyle = 'rgba(100,60,20,0.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-3, HCY-13); ctx.lineTo(-1, HCY-9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, HCY-13); ctx.lineTo(3, HCY-9); ctx.stroke();

  /* olhos – pequenos em relação ao rosto gordo (característico) */
  // fundo branco (amendoado)
  ctx.fillStyle = '#f0ece4';
  ctx.beginPath(); ctx.ellipse(-9, HCY - 4, 6, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 9, HCY - 4, 6, 4, 0, 0, Math.PI*2); ctx.fill();
  // íris castanha/escura
  ctx.fillStyle = '#4a2c10';
  ctx.beginPath(); ctx.arc(-9, HCY - 4, 3.2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 9, HCY - 4, 3.2, 0, Math.PI*2); ctx.fill();
  // pupila
  ctx.fillStyle = '#0a0806';
  ctx.beginPath(); ctx.arc(-9, HCY - 4, 1.8, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 9, HCY - 4, 1.8, 0, Math.PI*2); ctx.fill();
  // brilho
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(-7.8, HCY - 5.5, 1, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 10.2, HCY - 5.5, 1, 0, Math.PI*2); ctx.fill();
  // pálpebra superior (olho meio fechado – expressão séria)
  ctx.fillStyle = '#f0c890';
  ctx.beginPath(); ctx.ellipse(-9, HCY - 7, 7, 3, 0, 0, Math.PI); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 9, HCY - 7, 7, 3, 0, 0, Math.PI); ctx.fill();
  // linha pálpebra superior
  ctx.strokeStyle = '#4a2c10'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-15, HCY-4); ctx.bezierCurveTo(-13,HCY-8,-5,HCY-8,-3,HCY-4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3, HCY-4); ctx.bezierCurveTo(5,HCY-8,13,HCY-8,15,HCY-4); ctx.stroke();

  /* nariz – menor e mais discreto */
  ctx.fillStyle = '#d4a060';
  ctx.beginPath(); ctx.ellipse(1, HCY + 4, 3.5, 2.5, 0, 0, Math.PI*2); ctx.fill();
  // narinas
  ctx.fillStyle = 'rgba(100,55,15,0.55)';
  ctx.beginPath(); ctx.ellipse(-2.8, HCY + 5.5, 2, 1.4, -0.2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 4.8, HCY + 5.5, 2, 1.4,  0.2, 0, Math.PI*2); ctx.fill();
  // dorso sutil
  ctx.fillStyle = 'rgba(200,140,60,0.15)';
  ctx.beginPath(); ctx.roundRect(-0.5, HCY - 2, 2, 6, 1); ctx.fill();

  /* boca – fechada, expressão séria neutra */
  // lábio inferior cheio
  ctx.fillStyle = '#b07848';
  ctx.beginPath();
  ctx.moveTo(-10, HCY + 12);
  ctx.bezierCurveTo(-7, HCY + 17, 8, HCY + 17, 11, HCY + 12);
  ctx.bezierCurveTo(7, HCY + 14, -6, HCY + 14, -10, HCY + 12);
  ctx.fill();
  // lábio superior
  ctx.fillStyle = '#9a6438';
  ctx.beginPath();
  ctx.moveTo(-10, HCY + 12);
  ctx.bezierCurveTo(-6, HCY + 9, -1, HCY + 10, 1, HCY + 11);
  ctx.bezierCurveTo(3, HCY + 10, 7, HCY + 9, 11, HCY + 12);
  ctx.bezierCurveTo(6, HCY + 12, -5, HCY + 12, -10, HCY + 12);
  ctx.fill();
  // linha da boca
  ctx.strokeStyle = 'rgba(100,50,15,0.55)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-10, HCY+12); ctx.lineTo(11, HCY+12); ctx.stroke();

  /* ════════════════════════════════
     CABELO – buzz cut rente ao crânio, sem volume de capacete.
     Estratégia: clipar tudo dentro da elipse do rosto+crânio,
     pintar só uma fina camada no topo/laterais, sem extrapolar.
  ════════════════════════════════ */
  ctx.save();

  // clip exato: a mesma elipse do rosto, ligeiramente maior no topo
  // para cobrir só o crânio sem criar silhueta acima da cabeça
  ctx.beginPath();
  ctx.ellipse(1, HCY - 2, HW + 1, HH + 3, 0, 0, Math.PI * 2);
  ctx.clip();

  // 1. base escura (laterais raspadas / fade)
  ctx.fillStyle = '#9a7210';
  ctx.beginPath();
  ctx.ellipse(1, HCY - HH + 5, HW + 1, HH, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. camada loira principal – só no topo, bem fina
  ctx.fillStyle = '#c89a18';
  ctx.beginPath();
  ctx.ellipse(1, HCY - HH + 2, HW - 2, HH - 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. topo mais claro (luz natural no alto do crânio)
  ctx.fillStyle = '#ddb020';
  ctx.beginPath();
  ctx.ellipse(1, HCY - HH, HW - 7, HH - 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. highlight pontual (brilho no topo)
  ctx.fillStyle = '#f0cc30';
  ctx.beginPath();
  ctx.ellipse(-1, HCY - HH - 1, HW - 13, HH - 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // 5. fade lateral esq (mais raspado)
  const fL = ctx.createRadialGradient(-HW + 3, HCY - 4, 0, -HW + 3, HCY - 4, 12);
  fL.addColorStop(0, 'rgba(60,40,5,0.55)');
  fL.addColorStop(1, 'rgba(60,40,5,0)');
  ctx.fillStyle = fL;
  ctx.fillRect(-HW - 2, HCY - HH - 4, 18, HH + 4);

  // 6. fade lateral dir
  const fR = ctx.createRadialGradient(HW - 3, HCY - 4, 0, HW - 3, HCY - 4, 12);
  fR.addColorStop(0, 'rgba(60,40,5,0.55)');
  fR.addColorStop(1, 'rgba(60,40,5,0)');
  ctx.fillStyle = fR;
  ctx.fillRect(HW - 16, HCY - HH - 4, 18, HH + 4);

  // 7. textura de fios curtíssimos (direção vertical, bem suaves)
  ctx.strokeStyle = 'rgba(100,65,5,0.22)'; ctx.lineWidth = 0.8; ctx.lineCap = 'round';
  const hairTop = HCY - HH - 2;
  [[-12,hairTop+10,-12,hairTop+2],[-7,hairTop+8,-7,hairTop+1],[-2,hairTop+7,-2,hairTop],
   [3,hairTop+7,3,hairTop],[8,hairTop+8,8,hairTop+1],[13,hairTop+10,13,hairTop+2]].forEach(([x1,y1,x2,y2])=>{
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  });

  ctx.restore();

  // hairline – linha fina na testa, fora do clip para ficar visível
  // posicionada bem baixa, onde o cabelo encontra a testa
  const HL = HCY - HH + 8;
  ctx.strokeStyle = '#7a5808'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-HW + 1, HL + 4);
  ctx.bezierCurveTo(-HW + 4, HL + 1, -HW + 9, HL, -HW + 11, HL);
  ctx.bezierCurveTo(-4, HL, 5, HL, HW - 9, HL);
  ctx.bezierCurveTo(HW - 5, HL, HW - 1, HL + 2, HW - 1, HL + 4);
  ctx.stroke();

  ctx.restore();
}

/* ================================================================
   DRAW – TRAIL
   ================================================================ */
function drawTrail() {
  trail.forEach((t, i) => {
    const a = t.life * 0.25 * (i / trail.length);
    ctx.fillStyle = `rgba(0,255,200,${a})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, (i / trail.length) * player.w * 0.35, 0, Math.PI * 2);
    ctx.fill();
  });
}

/* ================================================================
   DRAW – BEATS (obstáculos musicais)
   ================================================================ */
function drawNote(ctx, size) {
  /* nota musical clássica */
  ctx.fillStyle = '#ff44cc';
  ctx.shadowColor = '#ff44cc';
  ctx.shadowBlur = 14;
  // haste
  ctx.fillRect(-size * 0.08, -size * 0.55, size * 0.15, size * 0.65);
  // cabeça oval
  ctx.save();
  ctx.translate(-size * 0.18, size * 0.1);
  ctx.rotate(-0.4);
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.22, size * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // bandeira
  ctx.strokeStyle = '#ff44cc';
  ctx.lineWidth = size * 0.1;
  ctx.beginPath();
  ctx.moveTo(size * 0.07, -size * 0.55);
  ctx.bezierCurveTo(size * 0.35, -size * 0.3, size * 0.35, -size * 0.05, size * 0.1, size * 0.0);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawDiamond(ctx, size, color) {
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.55);
  ctx.lineTo(size * 0.45, 0);
  ctx.lineTo(0, size * 0.55);
  ctx.lineTo(-size * 0.45, 0);
  ctx.closePath();
  ctx.fill();
  // brilho
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.5);
  ctx.lineTo(size * 0.2, -size * 0.1);
  ctx.lineTo(0, 0);
  ctx.lineTo(-size * 0.2, -size * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawVinyl(ctx, size) {
  /* disco de vinil */
  ctx.fillStyle = '#1a0a2e';
  ctx.shadowColor = '#cc88ff';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.48, 0, Math.PI * 2);
  ctx.fill();
  // sulcos
  for (let r = 0.15; r < 0.45; r += 0.08) {
    ctx.strokeStyle = `rgba(180,100,255,${0.4 - r * 0.5})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, size * r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // label central
  ctx.fillStyle = '#cc88ff';
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.13, 0, Math.PI * 2);
  ctx.fill();
  // buraco
  ctx.fillStyle = '#1a0a2e';
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawCircleObstacle(ctx, size) {
  /* anel pulsante */
  const p = 0.5 + 0.5 * Math.sin(frame * 0.15);
  ctx.strokeStyle = '#ff44cc';
  ctx.shadowColor = '#ff44cc';
  ctx.lineWidth = 3 + p * 2;
  ctx.shadowBlur = 10 + p * 10;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.46, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = `rgba(255,68,204,${0.08 + p * 0.08})`;
  ctx.fill();
  // símbolo de onda (EQ)
  ctx.strokeStyle = '#ff88ee';
  ctx.lineWidth = 2;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  for (let x = -size * 0.3; x <= size * 0.3; x += 2) {
    const y = Math.sin((x / (size * 0.15)) * Math.PI + frame * 0.2) * size * 0.12;
    x === -size * 0.3 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawBeats() {
  beats.forEach(b => {
    ctx.save();
    ctx.translate(b.x + b.size / 2, b.y + b.size / 2);
    ctx.rotate(b.rot);
    const s = b.size;
    switch (b.type) {
      case 'note':    drawNote(ctx, s);                   break;
      case 'diamond': drawDiamond(ctx, s, b.color);       break;
      case 'vinyl':   drawVinyl(ctx, s);                  break;
      case 'circle':  drawCircleObstacle(ctx, s);         break;
    }
    ctx.restore();
    ctx.shadowBlur = 0;
  });
}

/* ================================================================
   DRAW – PARTICLES
   ================================================================ */
function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle   = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur  = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.shadowBlur  = 0;
}

/* ================================================================
   DRAW – COMBO TEXTS
   ================================================================ */
function drawComboTexts() {
  comboTexts.forEach(c => {
    ctx.globalAlpha = c.life;
    ctx.fillStyle   = c.color;
    ctx.shadowColor = c.color;
    ctx.shadowBlur  = 8;
    ctx.font        = `bold ${16 + Math.min(combo, 15)}px 'Courier New'`;
    ctx.textAlign   = 'center';
    ctx.fillText(c.text, c.x, c.y);
  });
  ctx.globalAlpha = 1;
  ctx.shadowBlur  = 0;
  ctx.textAlign   = 'left';
}

/* ================================================================
   TELAS – START / GAME OVER
   ================================================================ */
function drawStart() {
  const w = canvas.width, h = canvas.height;

  /* título */
  ctx.textAlign = 'center';
  ctx.font = `bold ${Math.min(w * 0.08, 52)}px 'Courier New'`;
  ctx.shadowColor = '#00ffc8';
  ctx.shadowBlur  = 30;
  ctx.fillStyle   = '#00ffc8';
  ctx.fillText('BEAT RUNNER', w / 2, h / 2 - 90);

  ctx.shadowBlur = 0;
  ctx.font = `${Math.min(w * 0.035, 18)}px 'Courier New'`;
  ctx.fillStyle = 'rgba(200,255,240,0.8)';
  ctx.fillText('Um presente pra quem faz o beat acontecer 🎧', w / 2, h / 2 - 48);

  ctx.fillStyle = 'rgba(0,255,200,0.6)';
  ctx.font = `${Math.min(w * 0.03, 15)}px 'Courier New'`;
  ctx.fillText('ESPAÇO / TOQUE = pular  •  Duplo pulo disponível', w / 2, h / 2 - 14);

  /* botão */
  _drawButton(w / 2, h / 2 + 30, 220, 52, 'COMEÇAR');

  ctx.textAlign = 'left';
}

function drawDead() {
  const w = canvas.width, h = canvas.height;

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, w, h);

  ctx.textAlign = 'center';
  ctx.font = `bold ${Math.min(w * 0.09, 54)}px 'Courier New'`;
  ctx.shadowColor = '#ff4466';
  ctx.shadowBlur  = 28;
  ctx.fillStyle   = '#ff4466';
  ctx.fillText('GAME OVER', w / 2, h / 2 - 90);

  ctx.shadowBlur = 0;
  ctx.fillStyle  = '#ffffff';
  ctx.font       = `${Math.min(w * 0.04, 20)}px 'Courier New'`;
  ctx.fillText('Score: ' + score, w / 2, h / 2 - 44);

  ctx.fillStyle = 'rgba(255,220,80,0.9)';
  ctx.font      = `${Math.min(w * 0.033, 16)}px 'Courier New'`;
  ctx.fillText('Melhor: ' + highScore, w / 2, h / 2 - 14);

  _drawButton(w / 2, h / 2 + 30, 240, 52, 'JOGAR DE NOVO');

  ctx.textAlign = 'left';
}

function _drawButton(cx, cy, bw, bh, label) {
  const x = cx - bw / 2;
  const y = cy - bh / 2;
  ctx.shadowColor = '#00ffc8';
  ctx.shadowBlur  = 20;
  ctx.strokeStyle = '#00ffc8';
  ctx.lineWidth   = 2;
  ctx.fillStyle   = 'rgba(0,255,200,0.12)';
  ctx.beginPath();
  ctx.roundRect(x, y, bw, bh, 10);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle  = '#00ffc8';
  ctx.font       = `bold 17px 'Courier New'`;
  ctx.fillText(label, cx, cy + 6);
}

/* ================================================================
   LOOP PRINCIPAL
   ================================================================ */
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* posição X do player */
  player.x = Math.min(160, canvas.width * 0.18);

  drawBackground();
  drawTrail();
  drawPlayer();
  drawBeats();
  drawParticles();
  drawComboTexts();

  if (STATE === 'start')        drawStart();
  else if (STATE === 'playing') update();
  else                          drawDead();

  requestAnimationFrame(gameLoop);
}

/* ── polyfill roundRect para Safari antigo ── */
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (typeof r === 'number') r = [r, r, r, r];
    this.beginPath();
    this.moveTo(x + r[0], y);
    this.arcTo(x + w, y,     x + w, y + h, r[1]);
    this.arcTo(x + w, y + h, x,     y + h, r[2]);
    this.arcTo(x,     y + h, x,     y,     r[3]);
    this.arcTo(x,     y,     x + w, y,     r[0]);
    this.closePath();
  };
}

/* inicia */
gameLoop();