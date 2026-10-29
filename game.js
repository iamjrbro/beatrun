/* Beat Runner — LUKETA's set. Static files only; no account or server required. */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const uiNodes = new Map();
const el = id => { if (!uiNodes.has(id)) uiNodes.set(id,document.getElementById(id)); return uiNodes.get(id); };
const music = el('music');
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
const choiceOptions = {outfit:['black','white','neon','orange'],hair:['blond','pink'],pants:['sparkle','plain','camo'],shoes:['sneakers','boots','nike'],view:['front','profile']};
const characterChoice = {outfit:'black',hair:'blond',pants:'sparkle',shoes:'sneakers',view:'profile'};
function readStored(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function saveStored(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
const savedChoice = readStored('beat-runner-character', {});
for (const key of Object.keys(choiceOptions)) {
  if (key !== 'hair' && key !== 'view' && choiceOptions[key].includes(savedChoice?.[key])) characterChoice[key] = savedChoice[key];
}
function selectCharacter(key, value) {
  if (!choiceOptions[key]?.includes(value)) return;
  characterChoice[key] = value;
  for (const option of choiceOptions[key]) el(key + '-' + option).setAttribute('aria-pressed', String(option === value));
  saveStored('beat-runner-character', characterChoice);
}
for (const [key, values] of Object.entries(choiceOptions)) {
  for (const value of values) el(key + '-' + value).addEventListener('click', () => selectCharacter(key, value));
  selectCharacter(key, characterChoice[key]);
}
const STAGES = [
  {id:'studio',name:'ESTÚDIO',next:'PRIMEIRA PISTA',at:0,accent:'#81f7d4',sky:'#080f1b',grid:'#25413755',bpm:88,volume:0.24},
  {id:'ap213',name:'213',scene:'apartment',at:2100,accent:'#e3bc8d',sky:'#251e2c',grid:'#70585055',bpm:92,volume:.26,announcement:'APÊ 213. POUCO ESPAÇO, MUITO SONHO.'},
  {id:'party',name:'PRIMEIRA PISTA',next:'FESTIVAL',at:4200,accent:'#79d2ef',sky:'#0c1228',grid:'#2b527155',bpm:108,volume:0.33},
  {id:'festival',name:'FESTIVAL',at:10500,accent:'#c7a7f4',sky:'#160f2a',grid:'#57457055',bpm:126,volume:0.42},
  {id:'cena2k',name:'CENA2K FESTIVAL',scene:'cena',at:16500,accent:'#ec92d1',sky:'#18142b',grid:'#734c7855',bpm:128,volume:.42,announcement:'DO APÊ 213 PRA CENA. SOLTA O TRAP!'},
  {id:'rooftop',name:'TERRAÇO LUNAR',scene:'rooftop',at:23000,accent:'#e8a5ce',sky:'#19162d',grid:'#754b7255',bpm:120,volume:.36,announcement:'O SOM CHEGOU AO TOPO DA CIDADE.'},
  {id:'metro',name:'ÚLTIMO METRÔ',scene:'metro',at:30000,accent:'#8fdfe2',sky:'#0b2029',grid:'#42666d55',bpm:116,volume:.34,announcement:'ÚLTIMO TREM. MAIS UM SET.'},
  {id:'forest',name:'BOSQUE DOS ECOS',scene:'forest',at:38000,accent:'#a4d793',sky:'#091d1b',grid:'#42614b55',bpm:104,volume:.29,announcement:'TEM UM SOM ESCONDIDO ENTRE AS ÁRVORES.'},
  {id:'lake',name:'LAGO DO SILÊNCIO',scene:'lake',at:47000,accent:'#99cfe8',sky:'#102235',grid:'#42688a55',bpm:100,volume:.28,announcement:'ATÉ A ÁGUA ENTROU NO RITMO.'},
  {id:'desert',name:'DUNAS DO CREPÚSCULO',scene:'desert',at:57000,accent:'#eac28f',sky:'#302037',grid:'#986e5655',bpm:112,volume:.32,announcement:'O GRAVE ATRAVESSA AS DUNAS.'},
  {id:'temple',name:'SALÃO DAS HORAS',scene:'temple',at:68000,accent:'#d6cc9f',sky:'#1c202d',grid:'#6d6b6555',bpm:108,volume:.30,announcement:'AQUI O TEMPO SEGUE A SUA BATIDA.'},
  {id:'dawn',name:'AMANHECER',scene:'dawn',at:79000,accent:'#f0c7a4',sky:'#343047',grid:'#8e726855',bpm:118,volume:.35,announcement:'A NOITE VIROU DIA. O SOM É SEU.'},
];
const ACHIEVEMENTS = [
  {id:'record',name:'Esse som é seu',description:'Colete seu primeiro vinil.'},
  {id:'drop',name:'Solta o Trap',description:'Solte seu primeiro drop.'},
  {id:'party',name:'Da sala pra pista',description:'Chegue à Primeira Pista.'},
  {id:'festival',name:'LUKETA no topo',description:'Chegue ao Festival.'},
  {id:'dawn',name:'Até o sol nascer',description:'Complete a turnê dos doze cenários.'},
  {id:'clean',name:'Para sempre o DJ',description:'Toque 90 segundos sem perder chances.'},
];
const earned = new Set(readStored('beat-runner-achievements', []).filter?.(id => ACHIEVEMENTS.some(a => a.id === id)) || []);
let playMode = 'challenge';
let chillBest = Math.max(0,Number(readStored('beat-runner-chill-best',0))||0);
let cheerBuffer = null;
const HEART_MESSAGES = ['A produção mandou avisar que te ama.','Um salve do seu amor.','Seu maior fã tá torcendo por você.','Meu DJ favorito merece mais um set.'];
let heartMessageIndex = Math.floor(Math.random()*HEART_MESSAGES.length);
const MISSION_POOL = [
  {id:'vinyls',label:'Colete 8 vinis',target:8},
  {id:'usb',label:'Encontre 2 sets secretos',target:2},
  {id:'clean',label:'Desvie de 5 obstáculos seguidos',target:5},
  {id:'perfect',label:'Faça 2 pulos perfeitos',target:2},
  {id:'drops',label:'Solte um drop',target:1}
];
function chooseMissions(){
  const pool=MISSION_POOL.map(m=>({...m,done:false}));
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool.slice(0,3);
}
let highScore = Math.max(0, Number(readStored('beat-runner-best', 0)) || 0);
let STATE = 'start', score = 0, combo = 0, level = 1, frame = 0;
let forceTutorial = false, audioCtx = null, muted = false;
let hudDirty = true, hudLives = null;
let bonuses = [];
let obstacles = [], records = [], particles = [], comboTexts = [];
let toastQueue = [], toastFrames = 0, obstacleSerial = 0;
let world = freshWorld();
const player = {x:0,y:0,vy:0,w:54,h:110,jumpCount:0,maxJumps:2,onGround:true,squish:1,squishV:0,runFrame:0,poseFrames:0,pose:'idle'};
const GRAVITY = 0.65, JUMP_FORCE = -13.5, FIXED_STEP = 1000 / 60;
function freshWorld() {
  return {mode:playMode,missions:chooseMissions(),perfect:0,clean:0,usb:0,diamonds:0,hearts:0,backstage:0,crowdFrames:0,shield:0,bonusSerial:0,nextBonus:1500,nextDrink:900,speedEffect:'',speedFrames:0,speedFactor:1,impactFrames:0,lives:3,vinyls:0,energy:0,dropFrames:0,invulnerable:0,distance:0,elapsed:0,stageIndex:0,
    hits:0,drops:0,jumps:0,doubleJumps:0,dodged:0,beatClock:0,pulse:0,nextObstacle:420,nextRecord:100,
    tutorial:forceTutorial || !readStored('beat-runner-training-v2', false),announcement:'',announcementFrames:0};
}
function getGround() { return canvas.height - 145; }
function getFloor() { return getGround() + player.h / 2 + 6; }
function getBeatY(height) { return getFloor() - height; }
function getRunSpeed() { return Math.min(7.2, 4.2 + world.distance / 7000) * world.speedFactor; }
function getStrideStep() { return Math.min(1.65, Math.max(.6, 0.92 + (getRunSpeed()-4.2)*0.14)); }
function randomBetween(min,max) { return min + Math.random()*(max-min); }
function getStage() { return STAGES[world.stageIndex]; }
function setText(id, text) { if (el(id).textContent !== String(text)) el(id).textContent = String(text); }
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resize();
player.x = Math.min(168, Math.max(62, canvas.width * 0.18)); player.y = getGround();
window.addEventListener('resize', () => {
  const previousGround = getGround(); resize(); player.y += getGround() - previousGround;
  player.x = Math.min(168, Math.max(62, canvas.width * 0.18));
  obstacles.forEach(o => { o.y = getBeatY(o.h); }); records.forEach(r => { r.y = getFloor() - r.lift; });
  bonuses.forEach(b => { b.y = getFloor() - b.lift; });
});
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}
function playTone(freq, type, duration, volume = 0.08) {
  if (muted) return;
  try {
    const audio = getAudio(), oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(freq, audio.currentTime);
    gain.gain.setValueAtTime(volume, audio.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration);
  } catch {}
}
function startMusic() {
  try { getAudio(); } catch {}
  music.volume = getStage().volume; music.play().catch(() => {});
}
function playBeat() {
  const boost = world.dropFrames > 0 ? 1.3 : 1;
  playTone(60, 'sine', 0.13, (0.035 + Math.min(2,world.stageIndex) * 0.012) * boost);
  if (world.stageIndex >= 1) playTone(1800, 'triangle', 0.025, 0.009 * boost);
  if (world.stageIndex >= 2 && frame % 2 === 0) playTone(160, 'triangle', 0.05, 0.025 * boost);
}
function renderAchievements() {
  el('achievements').innerHTML = ACHIEVEMENTS.map(a => `<div class="achievement ${earned.has(a.id) ? 'unlocked' : ''}" title="${a.description}"><span aria-hidden="true">${earned.has(a.id) ? '◆' : '◇'}</span>${a.name}<small style="display:block;font-size:8px;margin-top:5px">${earned.has(a.id) ? 'CONQUISTADO' : a.description}</small></div>`).join('');
  setText('achievement-count', `${earned.size} / ${ACHIEVEMENTS.length}`);
}
function unlock(id) {
  if (world.mode==='chill' || earned.has(id)) return;
  const achievement = ACHIEVEMENTS.find(a => a.id === id); if (!achievement) return;
  earned.add(id); saveStored('beat-runner-achievements', [...earned]); renderAchievements();
  toastQueue.push('◆ ' + achievement.name);
}
function refreshMenu() {
  setText('start-best', (playMode==='chill'?'MELHOR SET DE BOA: '+chillBest:'SEU MELHOR SET: '+highScore) + ' PTS');
  setText('training-label', readStored('beat-runner-training-v2', false) && !forceTutorial
    ? 'Doze cenários, do estúdio ao amanhecer. Até onde vai o seu set?'
    : 'Seu primeiro set tem treino guiado e três chances.');
  renderAchievements();
}
function returnToMenu() {
  STATE = 'start'; music.pause();
  bonuses = []; obstacles = []; records = []; particles = []; comboTexts = []; toastQueue = []; toastFrames = 0;
  el('menu-screen').hidden = false; el('result-screen').hidden = true; el('pause-screen').hidden = true;
  el('hud').hidden = true; el('pause').hidden = true; el('coach').hidden = true; el('toast').hidden = true;
  refreshMenu(); el('play').focus();
}
function selectMode(mode){
  if(STATE!=='start'||!['challenge','chill'].includes(mode))return;
  playMode=mode;
  setText('mode-badge',mode==='chill'?'SEM PERDER VIDAS':'3 CHANCES POR SET');
  el('mode-challenge').setAttribute('aria-pressed',String(mode==='challenge'));
  el('mode-chill').setAttribute('aria-pressed',String(mode==='chill'));
  setText('mode-description',mode==='chill'?'Sem perder vidas. Pause para encerrar seu set quando quiser.':'Três chances. Colete, desvie e tente bater seu recorde.');
  refreshMenu();
}
function resetGame() {
  world = freshWorld(); forceTutorial = false; score = 0; combo = 0; level = 1; frame = 0;
  bonuses = []; obstacles = []; records = []; particles = []; comboTexts = []; toastQueue = []; toastFrames = 0;
  Object.assign(player, {x:Math.min(168,Math.max(62,canvas.width*0.18)),y:getGround(),vy:0,jumpCount:0,onGround:true,squish:1,squishV:0,runFrame:0,poseFrames:0,pose:'idle'});
  STATE = 'playing'; lastTime = null; accumulator = 0;hudLives=null;
  el('menu-screen').hidden = true; el('result-screen').hidden = true; el('pause-screen').hidden = true;
  el('hud').hidden = false; el('pause').hidden = false; el('toast').hidden = true;
  updateHud(); updateCoach(); startMusic(); canvas.focus();
}
function finishGame() {
  if(!['playing','paused'].includes(STATE))return;
  STATE = 'dead'; music.pause();el('pause-screen').hidden=true;
  if(world.mode==='chill' && score>chillBest){chillBest=score;saveStored('beat-runner-chill-best',chillBest);}
  if (world.mode!=='chill' && score > highScore) { highScore = score; saveStored('beat-runner-best', highScore); }
  setText('result-score', score); setText('result-vinyls', world.vinyls); setText('result-drops', world.drops);
  setText('result-best', (world.mode==='chill'?'MELHOR SET DE BOA: '+chillBest:'MELHOR SET: '+highScore) + ' PTS');
  setText('result-heading',world.mode==='chill'?'Seu som, no seu tempo.':'Até os brabos erram o cue. Solta outra!');
  setText('result-details',`${world.vinyls} vinis · ${world.usb} sets secretos · ${world.diamonds} diamantes · ${world.perfect} pulos perfeitos. ${world.stageIndex} ${world.stageIndex===1?'pista conquistada':'pistas conquistadas'}. ${world.missions.filter(m=>m.done).length}/3 missões concluídas.`);
  setText('result-message', `${getStage().name} · ${Math.floor(world.elapsed)}s no comando. ${world.drops ? 'O drop foi seu.' : 'O próximo drop está logo ali.'}`);
  el('result-screen').hidden = false; el('coach').hidden = true; el('toast').hidden = true; el('pause').hidden = true;
  el('retry').focus();
}
function togglePause() {
  if (STATE === 'playing') {
    STATE = 'paused'; music.pause(); el('pause-screen').hidden = false; el('coach').hidden = true; el('resume').focus();
  } else if (STATE === 'paused') {
    STATE = 'playing'; lastTime = null; accumulator = 0; el('pause-screen').hidden = true; startMusic(); canvas.focus(); updateCoach();
  }
}
function doJump() {
  if (STATE !== 'playing' || player.jumpCount >= player.maxJumps) return;
  player.vy = JUMP_FORCE; player.jumpCount++; player.onGround = false; player.squish = 1.14;
  world.jumps++; if (player.jumpCount === 2) world.doubleJumps++;
  playTone(player.jumpCount === 2 ? 520 : 330, 'sine', 0.12, 0.055);
  emitParticles(player.x, player.y + 55, '#81f7d4', 6); updateCoach();
}
function emitParticles(x, y, color, count = 12) {
  for (let i = 0; i < (reducedMotion ? Math.ceil(count / 3) : count); i++) particles.push({x,y,vx:(Math.random()-.5)*5,vy:-Math.random()*3-1,life:1,color,r:1+Math.random()*2});
}
function floatText(text, color = '#f5d892') { comboTexts.push({text,color,x:player.x+65,y:player.y-55,life:1}); }
function activateDrop() {
  if (STATE !== 'playing' || world.dropFrames > 0 || world.energy < 100) return;
  hudDirty = true;
  world.energy = 0; world.dropFrames = 480; world.drops++;reactCrowd();
  floatText('SOLTA O TRAP!', '#fff0bc'); emitParticles(player.x,player.y,'#f4d68c',24);
  playTone(95,'sine',0.4,0.13); playTone(48,'sine',0.55,0.1); unlock('drop');
}
function collectRecord(record) {
  hudDirty = true;
  world.vinyls++; combo++; const bonus = 15 + Math.min(45, Math.floor(combo / 4) * 5);
  score += world.dropFrames > 0 ? bonus * 2 : bonus;
  // Protected collecting earns extra points, never a self-sustaining shield.
  if (world.dropFrames === 0) world.energy = Math.min(100, world.energy + 12.5);
  emitParticles(record.x, record.y, '#f4d68c', 8); floatText('+' + (world.dropFrames > 0 ? bonus * 2 : bonus) + (combo >= 4 ? ' · x' + combo : ''));
  playTone(440 + (combo % 5) * 65,'sine',0.08,0.055); unlock('record');
  if (world.energy >= 100 && world.dropFrames === 0) activateDrop();
}
function hitObstacle(obstacle) {
  hudDirty = true;
  if (world.dropFrames > 0) {
    score += 5; emitParticles(obstacle.x, obstacle.y, '#f1d491', 12); floatText('NO DROP!', '#f3df9e'); return;
  }
  if (world.invulnerable > 0) { floatText('RECUPERAÇÃO', '#91dbff'); return; }
  if (world.shield > 0) {
    world.shield=0;world.invulnerable=60;
    emitParticles(player.x,player.y,'#91dbff',12);floatText('BACKSTAGE SALVOU!', '#91dbff');
    world.announcement='PULSEIRA USADA. O SET CONTINUA!';world.announcementFrames=120;
    return;
  }
  world.hits++;world.clean=0;combo=0;world.impactFrames=24;
  player.pose='hurt';player.poseFrames=40;player.squish=.84;
  floatText(world.mode==='chill'?'BATEU! MODO DE BOA':'BATEU! −1 CHANCE','#ffafc6');
  if(world.mode==='chill'){
    world.invulnerable=90;world.announcement='TÁ DE BOA. SEGUE O SOM!';world.announcementFrames=130;
    emitParticles(player.x,player.y,'#91dbff',6);return;
  }
  world.lives--; combo = 0; world.energy = Math.max(0, world.energy - 12.5);
  world.invulnerable = 150; player.pose = 'hurt'; player.poseFrames = 40;
  emitParticles(player.x, player.y, '#f1a1b5', 14); playTone(130,'triangle',0.22,0.12);
  if (world.lives <= 0) finishGame();
  else { world.announcement = `OPA! ${world.lives} ${world.lives === 1 ? 'CHANCE' : 'CHANCES'}. O SET CONTINUA.`; world.announcementFrames = 140; }
}
function spawnObstacle(type) {
  const options = ['speaker','case','cable'];
  type ||= options[Math.floor(Math.random() * (world.tutorial ? 2 : 3))];
  const dimensions = {speaker:[42,48],case:[48,36],cable:[54,20]};
  const [w,h] = dimensions[type];
  const obstacle = {id:++obstacleSerial,x:canvas.width+64,y:getBeatY(h),w,h,type,passed:false};
  obstacles.push(obstacle);
  // A visible rising vinyl trail hints at where to jump without disguising hazards.
  const top=randomBetween(175,205);
  const trail=[[-randomBetween(150,205),55],[-randomBetween(60,115),randomBetween(125,155)],[randomBetween(-15,20),top],[randomBetween(70,130),randomBetween(115,150)]];
  for (const [offset,lift] of trail) {
    if(Math.random()<.3)continue;
    records.push({x:obstacle.x+offset,y:getFloor()-lift,lift,r:13});
  }
  return obstacle;
}
function spawnRecord() {
  const count=world.tutorial?1:1+Math.floor(Math.random()*4);
  const base=[55,110,150][Math.floor(Math.random()*3)];
  let span=0;
  for(let i=0;i<count;i++){
    const lift=i===0?base:Math.max(55,Math.min(170,base+randomBetween(-30,30)));
    records.push({x:canvas.width+35+span,y:getFloor()-lift,lift,r:13});
    if(i<count-1)span+=randomBetween(50,125);
  }
  return span;
}
// Rare pickups are separate from vinyls: they never charge the drop.
function spawnBonus(type) {
  const cycle=['usb','diamond','backstage','heart'];
  type ||= cycle[world.bonusSerial++ % cycle.length];
  if(type==='heart' && world.lives>=3 && world.mode!=='chill') type='diamond';
  if(type==='backstage' && world.shield>0) type='usb';
  const lift=105;
  const item={type,x:canvas.width+45,y:getFloor()-lift,lift,r:18};
  bonuses.push(item);return item;
}
function collectBonus(item) {
  hudDirty=true;
  let label='',color='#f7d88d';
  if(item.type==='usb'){world.usb++;score+=100;label='SET SECRETO +100';}
  else if(item.type==='diamond'){world.diamonds++;score+=150;label='BRILHOU! +150';color='#b6e9ff';}
  else if(item.type==='backstage'){world.backstage++;
    if(world.shield){score+=50;label='BACKSTAGE +50';}
    else {world.shield=1;label='BACKSTAGE: 1 PROTEÇÃO';}color='#91dbff';
  } else if(item.type==='lean'||item.type==='energy'){
    world.speedEffect=item.type;world.speedFrames=300;
    color=item.type==='lean'?'#c7a3e8':'#91caff';
    label=item.type==='lean'?'LEAN: MAIS DEVAGAR · 5s':'RED BULL: MAIS RÁPIDO · 5s';
  } else if(item.type==='heart'){
    color='#ffafc6';world.hearts++;
    if(world.mode!=='chill'&&world.lives<3){world.lives++;label='UM SALVE DO SEU AMOR: +1 CHANCE';}
    else {score+=50;label='UM SALVE DO SEU AMOR: +50';}
  }
  floatText(label,color);emitParticles(item.x,item.y,color,10);playTone(660,'sine',.14,.06);
  world.announcement=item.type==='heart'?HEART_MESSAGES[heartMessageIndex++%HEART_MESSAGES.length]+' '+(world.mode!=='chill'&&label.includes('+1')?'+1 CHANCE':'+50 PONTOS'):label;world.announcementFrames=item.type==='heart'?250:160;
  reactCrowd();
}
function reactCrowd(){
  world.crowdFrames=100;
  if(muted||world.stageIndex===0||getStage().scene==='apartment')return;
  try{
    const audio=getAudio();
    if(!cheerBuffer){cheerBuffer=audio.createBuffer(1,Math.floor(audio.sampleRate*.38),audio.sampleRate);const data=cheerBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(Math.sin(i/audio.sampleRate*70)**8);}
    const source=audio.createBufferSource(),gain=audio.createGain();source.buffer=cheerBuffer;
    gain.gain.setValueAtTime(.025,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.38);
    source.connect(gain);gain.connect(audio.destination);source.start();
  }catch{}
}
function updateMissions(){
  for(const mission of world.missions){
    if(mission.done||world[mission.id]<mission.target)continue;
    mission.done=true;score+=75;hudDirty=true;
    toastQueue.push('MISSÃO CONCLUÍDA · '+mission.label+' · +75');reactCrowd();
  }
}
function renderMissions(){
  for(let i=0;i<world.missions.length;i++){
    const mission=world.missions[i];
    setText('mission-'+i,(mission.done?'✓ ':'' )+mission.label+' · '+Math.min(mission.target,world[mission.id])+'/'+mission.target);
  }
}
function trackClearance(obstacle,bounds,hitbox){
  if(player.onGround||world.dropFrames>0||world.invulnerable>0)return;
  const horizontal=bounds.x<hitbox.x+hitbox.w&&bounds.x+bounds.w>hitbox.x;
  const gap=hitbox.y-(bounds.y+bounds.h);
  if(horizontal&&gap>=0&&gap<=18)obstacle.nearMiss=true;
}
function passObstacle(obstacle){
  if(obstacle.passed)return;
  obstacle.passed=true;world.dodged++;world.clean++;score+=5;hudDirty=true;
  if(obstacle.nearMiss){world.perfect++;score+=25;floatText('NO TEMPO! +25','#b8f5df');reactCrowd();}
}
function playerBounds() { return {x:player.x-16,y:player.y-54,w:32,h:100}; }
function overlaps(a,b) { return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }
function recordTouchesPlayer(record, bounds) {
  const nx = Math.max(bounds.x, Math.min(record.x, bounds.x+bounds.w));
  const ny = Math.max(bounds.y, Math.min(record.y, bounds.y+bounds.h));
  return (record.x-nx)**2 + (record.y-ny)**2 <= record.r**2;
}
function completeTutorial() {
  world.tutorial = false; saveStored('beat-runner-training-v2', true);
  world.announcement = 'SEU SOM. SEU TEMPO. AGORA O SET É SEU.'; world.announcementFrames = 210;
}
function updateCoach() {
  let hint = '';
  if (world.dropFrames > 0) hint = `SOLTA O TRAP · ${Math.ceil(world.dropFrames/60)}s DE PROTEÇÃO`;
  else if (world.announcementFrames > 0) hint = world.announcement;
  else if(world.invulnerable>0)hint=`RECUPERAÇÃO · ${Math.ceil(world.invulnerable/60)}s SEM PERDER CHANCES`;
  else if(world.shield>0)hint='PULSEIRA BACKSTAGE · PROTEGE A PRÓXIMA BATIDA';
  else if(world.mode==='chill'&&!world.tutorial)hint='MODO DE BOA · BATIDAS NÃO TIRAM VIDAS';
  else if (world.tutorial) {
    if (world.vinyls === 0) hint = '01 / PEGUE OS VINIS DOURADOS. ELES SÃO PARA COLETAR.';
    else if (world.jumps === 0) hint = '02 / ESPAÇO, ↑ OU TOQUE PARA PULAR.';
    else if (world.doubleJumps === 0) hint = '03 / MAIS UM TOQUE NO AR = PULO DUPLO.';
    else hint = 'BOA! AGORA PULE AS CAIXAS, CASES E CABOS.';
  }
  if (el('coach').hidden !== !hint) el('coach').hidden = !hint; if (hint) setText('coach', hint);
}
function updateHud() {
  setText('score',score); setText('vinyl-count',world.vinyls); setText('combo','x'+combo);
  setText('lives',world.mode==='chill'?'∞':Array.from({length:3},(_,i)=>i<world.lives?'♥':'♡').join(' '));
  if (hudLives !== world.lives) { el('lives').setAttribute('aria-label',world.mode==='chill'?'Modo de boa, sem perder vidas':world.lives+' chances'); hudLives=world.lives; }
  setText('stage-label',`SET ${String(world.stageIndex+1).padStart(2,'0')} · ${getStage().name}`);
  const next = STAGES[world.stageIndex+1];
  setText('stage-progress',next ? `${Math.floor(Math.min(100, (world.distance-getStage().at)/(next.at-getStage().at)*100))}% → ${next.name}` : 'LUKETA · O PALCO É SEU');
  const energyValue = world.dropFrames > 0 ? world.dropFrames/480*100 : world.energy;
  if (el('energy').value !== energyValue) el('energy').value = energyValue;
  setText('drop-label',world.speedFrames>0 ? `${world.speedEffect==='lean'?'LEAN · LENTO':'RED BULL · TURBO'} ${Math.ceil(world.speedFrames/60)}s` : world.dropFrames > 0 ? 'DROP · PROTEGIDO' : world.invulnerable>0 ? 'RECUPERAÇÃO · PROTEGIDO' : world.shield ? 'BACKSTAGE · PROTEGIDO' : world.mode==='chill' ? 'DE BOA · SEM DANO' : 'PRÓXIMO DROP');
  renderMissions();
  hudDirty = false;
}
function update() {
  if (STATE !== 'playing') return;
  frame++; world.elapsed += 1/60;
  if(world.crowdFrames>0)world.crowdFrames--;
  if(world.speedFrames>0){world.speedFrames--;if(world.speedFrames===0){world.speedEffect='';hudDirty=true;}}
  const target=world.speedFrames>0?(world.speedEffect==='lean'?.72:1.28):1;
  world.speedFactor+=(target-world.speedFactor)*.08;
  if(Math.abs(target-world.speedFactor)<.0001)world.speedFactor=target;
  if(world.impactFrames>0)world.impactFrames--;
  const speed = getRunSpeed(), jumpStep = speed/6;
  world.distance += speed; player.runFrame += getStrideStep();
  world.pulse *= 0.9; world.beatClock += 1/60;
  if (world.beatClock >= 60/getStage().bpm) { world.beatClock -= 60/getStage().bpm; world.pulse = 1; playBeat(); }
  let next = STAGES[world.stageIndex+1];
  while (next && world.distance >= next.at) {
    hudDirty = true;
    world.stageIndex++; level = world.stageIndex+1; unlock(next.id);reactCrowd();
    world.announcement = next.announcement || (next.id === 'party' ? 'DA SALA PRA PISTA. A NOITE É SUA.' : 'LUKETA NO PALCO. PARA SEMPRE O DJ.');
    world.announcementFrames = 240;
    next=STAGES[world.stageIndex+1];
  }
  if (world.elapsed >= 90 && world.hits === 0) unlock('clean');
  if (world.dropFrames > 0) { world.dropFrames--; if (world.dropFrames === 0 && world.energy >= 100) activateDrop(); }
  if (world.invulnerable > 0) world.invulnerable--;
  if (world.announcementFrames > 0) world.announcementFrames--;
  if (player.poseFrames > 0) player.poseFrames--;
  player.vy += GRAVITY * jumpStep; player.y += player.vy * jumpStep;
  if (player.y >= getGround()) {
    if (!player.onGround) { player.squish = 0.88; if (player.poseFrames === 0) {player.pose='land';player.poseFrames=12;} }
    player.y = getGround(); player.vy = 0; player.onGround = true; player.jumpCount = 0;
  } else player.onGround = false;
  player.squishV = (player.squishV+(1-player.squish)*0.28)*0.62; player.squish += player.squishV;
  const trainingGate = world.tutorial && (world.elapsed < 8 || (world.jumps === 0 && world.elapsed < 18));
  if (world.distance >= world.nextObstacle && !trainingGate) {
    spawnObstacle(); world.nextObstacle = world.distance + randomBetween(Math.max(390,620-world.distance/120),Math.max(700,950-world.distance/150));
  }
  if (world.distance >= world.nextRecord) { const span=spawnRecord(); world.nextRecord = world.distance+span+randomBetween(180,680); }
  if(world.distance>=world.nextBonus && !trainingGate) {
    spawnBonus();world.nextBonus=world.distance+2100;
  }
  if(world.distance>=world.nextDrink&&!trainingGate){
    spawnBonus(Math.random()<.5?'lean':'energy');
    world.nextDrink=world.distance+randomBetween(1500,2600);
  }
  const bounds = playerBounds();
  for(let i=bonuses.length-1;i>=0;i--){
    const item=bonuses[i];item.x-=speed;
    if(recordTouchesPlayer(item,bounds)){collectBonus(item);bonuses.splice(i,1);}
    else if(item.x < -40)bonuses.splice(i,1);
  }
  for (let i=records.length-1;i>=0;i--) {
    const record=records[i]; record.x -= speed;
    if (recordTouchesPlayer(record,bounds)) { collectRecord(record); records.splice(i,1); }
    else if (record.x < -30) { records.splice(i,1); combo = 0; }
  }
  for (let i=obstacles.length-1;i>=0;i--) {
    const obstacle=obstacles[i]; obstacle.x -= speed;
    const hitbox={x:obstacle.x+4,y:obstacle.y+4,w:obstacle.w-8,h:obstacle.h-4};
    trackClearance(obstacle,bounds,hitbox);
    if (overlaps(bounds,hitbox)) { hitObstacle(obstacle); obstacles.splice(i,1); if (STATE==='dead') break; }
    else if (!obstacle.passed && obstacle.x+obstacle.w < bounds.x) {
      passObstacle(obstacle);
    }
    if (obstacle.x < -90) obstacles.splice(i,1);
  }
  if(STATE==='playing')updateMissions();
  if (STATE === 'playing' && world.tutorial && ((world.dodged>0 && world.vinyls>0 && world.jumps>0) || world.elapsed>30)) completeTutorial();
  for (const p of particles) {p.x+=p.vx;p.y+=p.vy;p.vy+=0.12;p.life-=0.035;}
  particles=particles.filter(p=>p.life>0);
  for (const text of comboTexts) {text.y-=0.65;text.life-=0.02;}
  comboTexts=comboTexts.filter(t=>t.life>0);
  if (toastFrames>0) toastFrames--;
  else if (toastQueue.length) {setText('toast',toastQueue.shift());toastFrames=180;}
  const hideToast=toastFrames===0 || STATE!=='playing';
  if (el('toast').hidden !== hideToast) el('toast').hidden=hideToast;
  if (hudDirty || frame % 6 === 0) {
    const volumeTarget=world.dropFrames>0?0.48:getStage().volume;
    if(Math.abs(volumeTarget-music.volume)>0.005) music.volume+=(volumeTarget-music.volume)*0.15;
    updateHud();if(STATE==='playing')updateCoach();
  }
}
function drawPlayer(alpha = 0) {
  if (STATE==='start') return;
  ctx.save();
  const renderY = player.onGround ? player.y : Math.min(getGround(),player.y+player.vy*(getRunSpeed()/6)*alpha);
  const foot = renderY+player.h/2+6;
  if(world.impactFrames>0){
    ctx.fillStyle='#ffafc6';ctx.font='bold 12px monospace';ctx.textAlign='center';
    ctx.fillText('BATEU!',player.x,renderY-90);
    if(!reducedMotion)ctx.translate(Math.sin(world.impactFrames*1.8)*world.impactFrames*.22,0);
  }
  artCircle(ctx,player.x,getFloor()+2,21,'#81f7d40c');
  if (world.dropFrames>0 || world.shield>0) {
    ctx.strokeStyle=world.dropFrames>0?'#e8ce86':'#91dbff'; ctx.lineWidth=1.8; ctx.globalAlpha=.65;
    ctx.beginPath(); ctx.ellipse(player.x,renderY-4,46,74,0,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1;
  }
  if (world.invulnerable>0 && !reducedMotion) ctx.globalAlpha=.58+Math.sin(frame*.15)*.13;
  const pose = player.poseFrames>0?player.pose:'idle';
  ctx.translate(player.x,foot); ctx.scale(1/player.squish,player.squish);
  drawDJ(ctx,{...characterChoice,view:characterChoice.view,x:0,y:-54,phase:player.runFrame+getStrideStep()*alpha,
    running:STATE==='playing'&&player.onGround,airborne:!player.onGround,pose});
  ctx.restore();
}
function drawMenuPortrait() {
  const rect=el('portrait-anchor').getBoundingClientRect();
  if (rect.bottom<0 || rect.top>canvas.height || rect.height<=0) return;
  const scale=Math.min(2.05,(rect.height-28)/146,(rect.width-25)/146);
  const x=rect.x+rect.width/2, y=rect.y+rect.height/2+7;
  ctx.save();ctx.beginPath();ctx.rect(rect.x,rect.y,rect.width,rect.height);ctx.clip();
  ctx.fillStyle='#153b3a66';ctx.strokeStyle='#477a6b88';ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(x,y-7,scale*73,0,Math.PI*2);ctx.fill();ctx.stroke();
  // Front portrait makes the face and jewelry readable; view buttons set the run angle.
  drawDJ(ctx,{...characterChoice,view:'front',x,y,scale,phase:performance.now()/20,pose:'idle'});ctx.restore();
}
function drawEffects() {
  ctx.save();
  for (const p of particles) {ctx.globalAlpha=p.life;artCircle(ctx,p.x,p.y,p.r,p.color);}
  ctx.textAlign='center';ctx.font='bold 12px monospace';
  for (const text of comboTexts) {ctx.globalAlpha=text.life;ctx.fillStyle=text.color;ctx.fillText(text.text,Math.max(70,Math.min(canvas.width-70,text.x)),text.y);}
  ctx.restore();
}
let lastTime=null,accumulator=0;
function gameLoop(now) {
  const elapsed=lastTime===null?0:Math.max(0,Math.min(now-lastTime,250));lastTime=now;
  if (STATE==='playing') {
    accumulator+=elapsed;
    while(accumulator+0.00001>=FIXED_STEP && STATE==='playing') {update();accumulator-=FIXED_STEP;}
  } else accumulator=0;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const alpha=STATE==='playing'?Math.max(0,Math.min(1,accumulator/FIXED_STEP)):0;
  const renderAhead=getRunSpeed()*alpha;
  renderStageFrame(ctx,{w:canvas.width,h:canvas.height,floor:getFloor(),stage:STATE==='start'?STAGES[0]:getStage(),
    time:STATE==='start'?performance.now()/1000:world.elapsed+alpha/60,scroll:STATE==='start'?0:world.distance+renderAhead,pulse:world.pulse,drop:world.dropFrames>0&&STATE!=='start',reducedMotion,crowd:STATE==='start'?0:world.crowdFrames/100});
  if(STATE==='start') { ctx.fillStyle='#080c1899';ctx.fillRect(0,0,canvas.width,canvas.height);drawMenuPortrait(); }
  else {
    for(const record of records) drawRecord(ctx,record,world.elapsed+alpha/60,reducedMotion,renderAhead);
    for(const item of bonuses) drawBonus(ctx,item,renderAhead);
    for(const obstacle of obstacles) drawStageObstacle(ctx,obstacle,renderAhead);
    drawPlayer(alpha);drawEffects();
  }
  requestAnimationFrame(gameLoop);
}
el('play').addEventListener('click',resetGame);el('retry').addEventListener('click',resetGame);
el('change-look').addEventListener('click',returnToMenu);
el('replay-tutorial').addEventListener('click',()=>{forceTutorial=true;resetGame();});
el('mode-challenge').addEventListener('click',()=>selectMode('challenge'));
el('mode-chill').addEventListener('click',()=>selectMode('chill'));
el('end-set').addEventListener('click',finishGame);
el('pause').addEventListener('click',togglePause);el('resume').addEventListener('click',togglePause);
el('sound').addEventListener('click',()=>{muted=!muted;music.muted=muted;setText('sound',muted?'SOM OFF':'SOM ON');el('sound').setAttribute('aria-pressed',String(muted));});
canvas.addEventListener('pointerdown',doJump);
document.addEventListener('keydown',event=>{
  if(event.code==='Escape'&&!event.repeat) {togglePause();return;}
  if(event.target.tagName==='BUTTON') return;
  if(['Space','ArrowUp'].includes(event.code)) {event.preventDefault();if(!event.repeat) doJump();}

});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&STATE==='playing') togglePause();});
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){
    if(typeof r==='number') r=[r,r,r,r];this.moveTo(x+r[0],y);this.arcTo(x+w,y,x+w,y+h,r[1]);
    this.arcTo(x+w,y+h,x,y+h,r[2]);this.arcTo(x,y+h,x,y,r[3]);this.arcTo(x,y,x+w,y,r[0]);this.closePath();
  };
}
refreshMenu();requestAnimationFrame(gameLoop);
