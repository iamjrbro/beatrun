/* ============================================================
   BEAT RUNNER – game.js
   ============================================================ */

const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const levelEl = document.getElementById('level');
const music   = document.getElementById('music');

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

/* ── ÁUDIO ── */
let audioCtx = null;
function ac() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTone(freq, type, dur, vol=0.2) {
  try {
    const a=ac(), o=a.createOscillator(), g=a.createGain();
    o.connect(g); g.connect(a.destination);
    o.type=type;
    o.frequency.setValueAtTime(freq,a.currentTime);
    g.gain.setValueAtTime(vol,a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+dur);
    o.start(); o.stop(a.currentTime+dur);
  } catch(e){}
}
function sfxJump()  { playTone(350,'sine',0.18); setTimeout(()=>playTone(600,'sine',0.1),55); }
function sfxScore() { playTone(450,'sine',0.07,0.13); setTimeout(()=>playTone(680,'sine',0.07,0.1),50); }
function sfxDead()  { playTone(110,'sawtooth',0.45,0.32); }
function startMusic() { music.play().catch(()=>{}); }

/* ── ESTADO ── */
let STATE='start', score=0, combo=0, level=1;
let frame=0, highScore=0, spawnTimer=0;

/* ── PLAYER ── */
const player = {
  x:0, y:0, vy:0,
  w:48, h:72,          // hitbox
  jumpCount:0, maxJumps:2,
  onGround:false,
  squish:1, squishV:0,
  run:0,
};
const GRAVITY=0.65, JUMP=-15;
function getGround() { return canvas.height - 90; }

let beats=[], particles=[], stars=[], comboTexts=[], trail=[];

function buildStars() {
  stars=[];
  for(let i=0;i<100;i++) stars.push({
    x:Math.random()*canvas.width,
    y:Math.random()*canvas.height*0.72,
    r:Math.random()*1.5+0.3,
    speed:Math.random()*0.55+0.15,
    phase:Math.random()*Math.PI*2,
  });
}
buildStars();

function resetGame() {
  score=0; combo=0; level=1; frame=0; spawnTimer=0;
  beats=[]; particles=[]; comboTexts=[]; trail=[];
  player.y=getGround(); player.vy=0; player.onGround=true;
  player.jumpCount=0; player.squish=1; player.squishV=0; player.run=0;
  scoreEl.textContent='0'; comboEl.textContent='x0'; levelEl.textContent='1';
  STATE='playing'; startMusic();
}

function doJump() {
  if(STATE!=='playing'){ resetGame(); return; }
  if(player.jumpCount<player.maxJumps){
    player.vy=JUMP; player.jumpCount++; player.squish=1.4; sfxJump();
    for(let i=0;i<8;i++) particles.push({
      x:player.x, y:player.y+player.h*0.4,
      vx:(Math.random()-0.5)*4, vy:Math.random()*2.5+1,
      life:1, r:Math.random()*3+2, color:'#00ffc8',
    });
  }
}

document.addEventListener('keydown',e=>{
  if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();doJump();}
});
canvas.addEventListener('pointerdown',()=>doJump());

const BEAT_TYPES=['note','note','diamond','circle','vinyl'];

function spawnBeat(){
  const type=BEAT_TYPES[Math.floor(Math.random()*BEAT_TYPES.length)];
  const size=34+Math.random()*14;
  beats.push({
    x:canvas.width+40, y:getGround(), size, type, rot:0,
    speed:5+level*0.6,
    color: type==='diamond'?'#ffaa00':type==='vinyl'?'#cc88ff':'#ff44cc',
  });
}

function hitParticles(x,y,color){
  for(let i=0;i<18;i++){
    const a=Math.random()*Math.PI*2, s=Math.random()*7+2;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,r:Math.random()*5+2,color});
  }
}

function addComboText(x,y,text,color){
  comboTexts.push({x,y,text,color,life:1,vy:-2});
}

function update(){
  frame++; player.run++;
  level=1+Math.floor(score/250);
  levelEl.textContent=level;
  const si=Math.max(38,95-level*9);
  if(++spawnTimer>=si){spawnTimer=0;spawnBeat();}

  player.vy+=GRAVITY; player.y+=player.vy;
  const g=getGround();
  if(player.y>=g){
    player.y=g; player.vy=0; player.onGround=true;
    player.jumpCount=0; player.squish=0.75;
  } else { player.onGround=false; }

  player.squishV+=(1-player.squish)*0.28;
  player.squishV*=0.62;
  player.squish+=player.squishV;

  trail.push({x:player.x,y:player.y,life:1});
  if(trail.length>12) trail.shift();
  trail.forEach(t=>t.life-=0.08);

  for(let i=beats.length-1;i>=0;i--){
    const b=beats[i];
    b.x-=b.speed+level*0.35; b.rot+=0.06;
    const mg=14;
    const px=player.x-player.w/2+mg, py=player.y-(player.h*player.squish)/2+mg;
    const pw=player.w-mg*2,          ph=player.h*player.squish-mg*2;
    if(px<b.x+b.size&&px+pw>b.x&&py<b.y+b.size&&py+ph>b.y){
      STATE='dead'; if(score>highScore)highScore=score;
      sfxDead(); hitParticles(player.x,player.y,'#ff4466'); beats=[]; return;
    }
    if(b.x<-80){
      const bonus=10*(1+Math.floor(combo/5));
      score+=bonus; combo++;
      scoreEl.textContent=score; comboEl.textContent='x'+combo; sfxScore();
      addComboText(canvas.width/2,getGround()-70,
        combo>1?'+'+bonus+' x'+combo+' COMBO!':'+10',
        combo>14?'#ffdd00':combo>7?'#00ffc8':'#fff');
      beats.splice(i,1);
    }
  }

  particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.18;p.life-=0.033;});
  particles=particles.filter(p=>p.life>0);
  comboTexts.forEach(c=>{c.y+=c.vy;c.life-=0.022;});
  comboTexts=comboTexts.filter(c=>c.life>0);
}

/* ================================================================
   FUNDO
================================================================ */
function drawBackground(){
  const w=canvas.width,h=canvas.height;
  const sky=ctx.createLinearGradient(0,0,0,h);
  sky.addColorStop(0,'#03030f'); sky.addColorStop(1,'#08081a');
  ctx.fillStyle=sky; ctx.fillRect(0,0,w,h);

  const vY=h*0.55, go=(frame*2)%60;
  ctx.strokeStyle='rgba(0,255,200,0.055)'; ctx.lineWidth=1;
  for(let i=-20;i<=20;i++){
    ctx.beginPath(); ctx.moveTo(w/2,vY); ctx.lineTo(w/2+i*80,h); ctx.stroke();
  }
  for(let d=0;d<1;d+=0.06){
    const y=vY+(h-vY)*Math.pow((d+(go/600))%1,1.3);
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
  }

  const ss=0.5+level*0.3;
  stars.forEach(s=>{
    s.x-=s.speed*ss;
    if(s.x<0){s.x=w+5;s.y=Math.random()*h*0.55;}
    const p=0.5+0.5*Math.sin(frame*0.05+s.phase);
    ctx.fillStyle=`rgba(180,220,255,${0.22+p*0.5})`;
    ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
  });

  const gY=getGround()+player.h*0.45+6;
  ctx.save();
  ctx.shadowColor='#00ffc8'; ctx.shadowBlur=16;
  ctx.strokeStyle='#00ffc8'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.moveTo(0,gY); ctx.lineTo(w,gY); ctx.stroke();
  ctx.restore();
  const ref=ctx.createLinearGradient(0,gY,0,gY+40);
  ref.addColorStop(0,'rgba(0,255,200,0.1)'); ref.addColorStop(1,'rgba(0,255,200,0)');
  ctx.fillStyle=ref; ctx.fillRect(0,gY,w,40);
}

/* ================================================================
   TRAIL
================================================================ */
function drawTrail(){
  trail.forEach((t,i)=>{
    ctx.fillStyle=`rgba(0,255,200,${t.life*0.18*(i/trail.length)})`;
    ctx.beginPath(); ctx.arc(t.x,t.y,(i/trail.length)*18,0,Math.PI*2); ctx.fill();
  });
}

/* ================================================================
   PERSONAGEM CHIBI FOFO
   Estilo: cabeça grande redondinha, corpo pequeninho,
   cabelo platinado bagunçado curto, sem fone,
   olhos grandes castanhos brilhantes, bochechas rosadas,
   corrente dourada, camiseta preta, calça preta, tênis branco.
================================================================ */
function drawPlayer(){
  const sq=player.squish, t=player.run;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.scale(1/sq, sq);

  /* ── proporções chibi ──
     cabeça: raio ~22  (grande!)
     corpo:  pequeno abaixo
     total height ≈ 70px
  */
  const HR = 22;          // head radius
  const HY = -28;         // head center Y (acima do centro)
  const bodyTop = HY+HR-4;
  const bodyH   = 22;
  const bodyW   = 30;

  /* sombra chão */
  if(player.onGround){
    ctx.fillStyle='rgba(0,255,200,0.12)';
    ctx.beginPath(); ctx.ellipse(0,28,20,4,0,0,Math.PI*2); ctx.fill();
  }

  const legS = player.onGround ? Math.sin(t*0.28)*18 : 0;
  const armS = player.onGround ? Math.cos(t*0.28)*20 : 10;

  /* ── PERNAS ── */
  // perna esquerda
  ctx.save();
  ctx.translate(-9, bodyTop+bodyH-2); ctx.rotate(legS*Math.PI/180);
  ctx.fillStyle='#1a1a1a';
  ctx.beginPath(); ctx.roundRect(-5,0,10,18,3); ctx.fill();
  // tênis branco
  ctx.fillStyle='#111';
  ctx.beginPath(); ctx.roundRect(-7,17,14,4,[0,0,3,3]); ctx.fill();
  ctx.fillStyle='#efefef';
  ctx.beginPath(); ctx.roundRect(-7,13,14,6,[3,3,0,0]); ctx.fill();
  ctx.restore();

  // perna direita
  ctx.save();
  ctx.translate(9, bodyTop+bodyH-2); ctx.rotate(-legS*Math.PI/180);
  ctx.fillStyle='#1a1a1a';
  ctx.beginPath(); ctx.roundRect(-5,0,10,18,3); ctx.fill();
  ctx.fillStyle='#111';
  ctx.beginPath(); ctx.roundRect(-7,17,14,4,[0,0,3,3]); ctx.fill();
  ctx.fillStyle='#efefef';
  ctx.beginPath(); ctx.roundRect(-7,13,14,6,[3,3,0,0]); ctx.fill();
  ctx.restore();

  /* ── CORPO ── */
  ctx.fillStyle='#1a1a1a';
  ctx.beginPath(); ctx.roundRect(-bodyW/2, bodyTop, bodyW, bodyH, [4,4,6,6]); ctx.fill();

  /* corrente dourada */
  ctx.strokeStyle='#d4a017'; ctx.lineWidth=1.8;
  ctx.shadowColor='#ffd700'; ctx.shadowBlur=4;
  ctx.beginPath();
  ctx.moveTo(-8, bodyTop+4);
  ctx.bezierCurveTo(-5,bodyTop+10, 5,bodyTop+10, 8,bodyTop+4);
  ctx.stroke();
  // pingente
  ctx.fillStyle='#d4a017';
  ctx.beginPath(); ctx.arc(0,bodyTop+11,2.5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#ffe57a';
  ctx.beginPath(); ctx.arc(-0.4,bodyTop+10.5,1,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur=0;

  /* ── BRAÇOS ── */
  // braço esq
  ctx.save();
  ctx.translate(-bodyW/2+1, bodyTop+4); ctx.rotate(armS*Math.PI/180);
  ctx.fillStyle='#1a1a1a';
  ctx.beginPath(); ctx.roundRect(-4,0,9,14,4); ctx.fill();
  // mãozinha fofa redonda
  ctx.fillStyle='#f2d9be';
  ctx.beginPath(); ctx.arc(0.5,16,5,0,Math.PI*2); ctx.fill();
  ctx.restore();

  // braço dir
  ctx.save();
  ctx.translate(bodyW/2-1, bodyTop+4); ctx.rotate(-armS*Math.PI/180);
  ctx.fillStyle='#1a1a1a';
  ctx.beginPath(); ctx.roundRect(-5,0,9,14,4); ctx.fill();
  ctx.fillStyle='#f2d9be';
  ctx.beginPath(); ctx.arc(-0.5,16,5,0,Math.PI*2); ctx.fill();
  ctx.restore();

  /* ── CABEÇA ── */
  // rosto (círculo grande e fofo)
  ctx.fillStyle='#f5e0c8';
  ctx.beginPath(); ctx.arc(0,HY,HR,0,Math.PI*2); ctx.fill();

  // bochechinha esq
  ctx.fillStyle='rgba(240,140,120,0.32)';
  ctx.beginPath(); ctx.ellipse(-13,HY+6,7,5,0,0,Math.PI*2); ctx.fill();
  // bochechinha dir
  ctx.beginPath(); ctx.ellipse( 13,HY+6,7,5,0,0,Math.PI*2); ctx.fill();

  /* sobrancelhas – simples, levemente arqueadas */
  ctx.strokeStyle='#7a5c38'; ctx.lineWidth=2; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-13,HY-9); ctx.quadraticCurveTo(-9,HY-12,-5,HY-10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( 13,HY-9); ctx.quadraticCurveTo( 9,HY-12, 5,HY-10); ctx.stroke();

  /* olhos grandes e brilhantes */
  // fundo branco
  ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.ellipse(-8,HY-2,6.5,7,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 8,HY-2,6.5,7,0,0,Math.PI*2); ctx.fill();
  // íris castanha
  ctx.fillStyle='#7a4822';
  ctx.beginPath(); ctx.arc(-8,HY-1,4.5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 8,HY-1,4.5,0,Math.PI*2); ctx.fill();
  // pupila preta
  ctx.fillStyle='#111';
  ctx.beginPath(); ctx.arc(-8,HY-1,2.6,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 8,HY-1,2.6,0,Math.PI*2); ctx.fill();
  // brilho principal
  ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.arc(-6.5,HY-3,1.8,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 9.5,HY-3,1.8,0,Math.PI*2); ctx.fill();
  // brilho menor
  ctx.beginPath(); ctx.arc(-9.5,HY,1,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 6.5,HY,1,0,Math.PI*2); ctx.fill();

  /* nariz mínimo (2 pontinhos fofos) */
  ctx.fillStyle='#d4a882';
  ctx.beginPath(); ctx.arc(-2.5,HY+7,1.5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 2.5,HY+7,1.5,0,Math.PI*2); ctx.fill();

  /* boca – sorriso aberto fofo */
  ctx.fillStyle='#c0394a';
  ctx.beginPath(); ctx.arc(0,HY+12,5.5,0,Math.PI); ctx.fill();
  // dentinhos brancos
  ctx.fillStyle='#f8f8f8';
  ctx.beginPath(); ctx.roundRect(-4.5,HY+12,9,3.5,[0,0,2,2]); ctx.fill();

  /* ── CABELO PLATINADO ──
     curto e bagunçado, quase branco, com leve amarelo torrado */
  const hairColor='#e8ddb0';
  const hairDark ='#d0c490';

  ctx.fillStyle=hairColor;
  // calota principal
  ctx.beginPath(); ctx.arc(0,HY,HR,Math.PI,0); ctx.fill();
  // franja – forma orgânica
  ctx.beginPath();
  ctx.moveTo(-HR, HY-2);
  ctx.bezierCurveTo(-HR+2,HY-14, -10,HY-HR-2, 0,HY-HR-2);
  ctx.bezierCurveTo( 10,HY-HR-2,  HR-2,HY-14, HR,HY-2);
  ctx.fill();

  // franjinha caindo na testa (irregular, fofa)
  ctx.fillStyle=hairColor;
  // mecha esq
  ctx.beginPath();
  ctx.moveTo(-HR+2,HY-5);
  ctx.bezierCurveTo(-HR-4,HY-8,-HR-6,HY+2,-HR+1,HY+6);
  ctx.bezierCurveTo(-HR+5,HY+3,-HR+4,HY-2,-HR+2,HY-5);
  ctx.fill();
  // mecha dir
  ctx.beginPath();
  ctx.moveTo(HR-2,HY-5);
  ctx.bezierCurveTo(HR+4,HY-8,HR+6,HY+2,HR-1,HY+6);
  ctx.bezierCurveTo(HR-5,HY+3,HR-4,HY-2,HR-2,HY-5);
  ctx.fill();
  // franja central caindo levemente
  ctx.beginPath();
  ctx.moveTo(-8,HY-HR+4);
  ctx.bezierCurveTo(-7,HY-8,-3,HY-6, 0,HY-7);
  ctx.bezierCurveTo( 3,HY-6, 7,HY-8, 8,HY-HR+4);
  ctx.bezierCurveTo(4,HY-HR+2,-4,HY-HR+2,-8,HY-HR+4);
  ctx.fill();

  // linhas de textura do cabelo
  ctx.strokeStyle=hairDark; ctx.lineWidth=1; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-5,HY-HR+6); ctx.bezierCurveTo(-4,HY-12,-2,HY-8, 0,HY-9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( 5,HY-HR+6); ctx.bezierCurveTo( 4,HY-12, 2,HY-8, 0,HY-9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-14,HY-14);  ctx.bezierCurveTo(-13,HY-8,-12,HY-4,-11,HY-1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( 14,HY-14);  ctx.bezierCurveTo( 13,HY-8, 12,HY-4, 11,HY-1); ctx.stroke();

  ctx.restore();
}

/* ================================================================
   BEATS
================================================================ */
function drawNote(c,s){
  c.fillStyle='#ff44cc'; c.shadowColor='#ff44cc'; c.shadowBlur=14;
  c.fillRect(-s*0.08,-s*0.55,s*0.15,s*0.65);
  c.save(); c.translate(-s*0.18,s*0.1); c.rotate(-0.4);
  c.beginPath(); c.ellipse(0,0,s*0.22,s*0.17,0,0,Math.PI*2); c.fill(); c.restore();
  c.strokeStyle='#ff44cc'; c.lineWidth=s*0.1;
  c.beginPath(); c.moveTo(s*0.07,-s*0.55);
  c.bezierCurveTo(s*0.35,-s*0.3,s*0.35,-s*0.05,s*0.1,0); c.stroke();
  c.shadowBlur=0;
}
function drawDiamond(c,s,color){
  c.fillStyle=color; c.shadowColor=color; c.shadowBlur=14;
  c.beginPath();
  c.moveTo(0,-s*0.55); c.lineTo(s*0.45,0); c.lineTo(0,s*0.55); c.lineTo(-s*0.45,0);
  c.closePath(); c.fill();
  c.fillStyle='rgba(255,255,255,0.22)';
  c.beginPath(); c.moveTo(0,-s*0.5); c.lineTo(s*0.2,-s*0.1); c.lineTo(0,0); c.lineTo(-s*0.2,-s*0.1); c.closePath(); c.fill();
  c.shadowBlur=0;
}
function drawVinyl(c,s){
  c.fillStyle='#1a0a2e'; c.shadowColor='#cc88ff'; c.shadowBlur=14;
  c.beginPath(); c.arc(0,0,s*0.48,0,Math.PI*2); c.fill();
  for(let r=0.15;r<0.45;r+=0.08){
    c.strokeStyle=`rgba(180,100,255,${0.4-r*0.5})`; c.lineWidth=1.5;
    c.beginPath(); c.arc(0,0,s*r,0,Math.PI*2); c.stroke();
  }
  c.fillStyle='#cc88ff'; c.beginPath(); c.arc(0,0,s*0.13,0,Math.PI*2); c.fill();
  c.fillStyle='#1a0a2e'; c.beginPath(); c.arc(0,0,s*0.05,0,Math.PI*2); c.fill();
  c.shadowBlur=0;
}
function drawCircleObstacle(c,s){
  const p=0.5+0.5*Math.sin(frame*0.15);
  c.strokeStyle='#ff44cc'; c.shadowColor='#ff44cc';
  c.lineWidth=3+p*2; c.shadowBlur=10+p*10;
  c.beginPath(); c.arc(0,0,s*0.46,0,Math.PI*2); c.stroke();
  c.fillStyle=`rgba(255,68,204,${0.06+p*0.08})`; c.fill();
  c.strokeStyle='#ff88ee'; c.lineWidth=1.5; c.shadowBlur=0;
  c.beginPath();
  for(let x=-s*0.3;x<=s*0.3;x+=2){
    const y=Math.sin((x/(s*0.15))*Math.PI+frame*0.2)*s*0.12;
    x===-s*0.3?c.moveTo(x,y):c.lineTo(x,y);
  }
  c.stroke();
}

function drawBeats(){
  beats.forEach(b=>{
    ctx.save();
    ctx.translate(b.x+b.size/2, b.y+b.size/2); ctx.rotate(b.rot);
    switch(b.type){
      case 'note':    drawNote(ctx,b.size);            break;
      case 'diamond': drawDiamond(ctx,b.size,b.color); break;
      case 'vinyl':   drawVinyl(ctx,b.size);           break;
      case 'circle':  drawCircleObstacle(ctx,b.size);  break;
    }
    ctx.restore(); ctx.shadowBlur=0;
  });
}

function drawParticles(){
  particles.forEach(p=>{
    ctx.globalAlpha=p.life; ctx.fillStyle=p.color;
    ctx.shadowColor=p.color; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha=1; ctx.shadowBlur=0;
}

function drawComboTexts(){
  comboTexts.forEach(c=>{
    ctx.globalAlpha=c.life; ctx.fillStyle=c.color;
    ctx.shadowColor=c.color; ctx.shadowBlur=6;
    ctx.font=`bold ${16+Math.min(combo,14)}px 'Courier New'`;
    ctx.textAlign='center'; ctx.fillText(c.text,c.x,c.y);
  });
  ctx.globalAlpha=1; ctx.shadowBlur=0; ctx.textAlign='left';
}

/* ================================================================
   TELAS
================================================================ */
function _btn(cx,cy,bw,bh,label){
  const x=cx-bw/2, y=cy-bh/2;
  ctx.shadowColor='#00ffc8'; ctx.shadowBlur=18;
  ctx.strokeStyle='#00ffc8'; ctx.lineWidth=2;
  ctx.fillStyle='rgba(0,255,200,0.11)';
  ctx.beginPath(); ctx.roundRect(x,y,bw,bh,10); ctx.fill(); ctx.stroke();
  ctx.shadowBlur=0; ctx.fillStyle='#00ffc8';
  ctx.font=`bold 17px 'Courier New'`; ctx.fillText(label,cx,cy+6);
}

function drawStart(){
  const w=canvas.width, h=canvas.height;
  ctx.textAlign='center';
  ctx.font=`bold ${Math.min(w*0.08,52)}px 'Courier New'`;
  ctx.shadowColor='#00ffc8'; ctx.shadowBlur=28; ctx.fillStyle='#00ffc8';
  ctx.fillText('BEAT RUNNER',w/2,h/2-90);
  ctx.shadowBlur=0;
  ctx.font=`${Math.min(w*0.031,16)}px 'Courier New'`;
  ctx.fillStyle='rgba(200,255,240,0.8)';
  ctx.fillText('Um presente pra quem faz o beat acontecer 🎧',w/2,h/2-46);
  ctx.fillStyle='rgba(0,255,200,0.5)';
  ctx.font=`${Math.min(w*0.027,13)}px 'Courier New'`;
  ctx.fillText('ESPAÇO / TOQUE = pular  •  Duplo pulo disponível',w/2,h/2-14);
  _btn(w/2,h/2+30,220,50,'COMEÇAR');
  ctx.textAlign='left';
}

function drawDead(){
  const w=canvas.width, h=canvas.height;
  ctx.fillStyle='rgba(0,0,0,0.62)'; ctx.fillRect(0,0,w,h);
  ctx.textAlign='center';
  ctx.font=`bold ${Math.min(w*0.09,54)}px 'Courier New'`;
  ctx.shadowColor='#ff4466'; ctx.shadowBlur=26; ctx.fillStyle='#ff4466';
  ctx.fillText('GAME OVER',w/2,h/2-90);
  ctx.shadowBlur=0;
  ctx.fillStyle='#fff'; ctx.font=`${Math.min(w*0.04,20)}px 'Courier New'`;
  ctx.fillText('Score: '+score,w/2,h/2-44);
  ctx.fillStyle='rgba(255,220,80,0.9)'; ctx.font=`${Math.min(w*0.032,16)}px 'Courier New'`;
  ctx.fillText('Melhor: '+highScore,w/2,h/2-14);
  _btn(w/2,h/2+30,240,50,'JOGAR DE NOVO');
  ctx.textAlign='left';
}

/* ================================================================
   LOOP
================================================================ */
function gameLoop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  player.x=Math.min(150,canvas.width*0.17);
  drawBackground();
  drawTrail();
  drawPlayer();
  drawBeats();
  drawParticles();
  drawComboTexts();
  if     (STATE==='start')   drawStart();
  else if(STATE==='playing') update();
  else                       drawDead();
  requestAnimationFrame(gameLoop);
}

/* polyfill roundRect Safari */
if(!CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){
    if(typeof r==='number')r=[r,r,r,r];
    this.beginPath();
    this.moveTo(x+r[0],y);
    this.arcTo(x+w,y,  x+w,y+h,r[1]);
    this.arcTo(x+w,y+h,x,  y+h,r[2]);
    this.arcTo(x,  y+h,x,  y,  r[3]);
    this.arcTo(x,  y,  x+w,y,  r[0]);
    this.closePath();
  };
}

gameLoop();
