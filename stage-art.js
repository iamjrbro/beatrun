/* Original lightweight Canvas stage art. All coordinates use CSS pixels. */
function artBox(ctx, x, y, w, h, color, radius = 4) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
}
function artCircle(ctx, x, y, r, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
function drawStageBackdrop(ctx, {w, h, floor, stage, time, scroll, pulse, drop, reducedMotion}) {
  ctx.save();
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, stage.sky); sky.addColorStop(1, '#101c2a');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  const accent = drop ? '#f6ce78' : stage.accent;
  const horizon = Math.min(floor - 30, h * 0.58);
  const spacing = 86;
  // Scrolling wall panels are deliberately quieter behind the runner.
  ctx.strokeStyle = stage.grid; ctx.lineWidth = 1;
  for (let x = -(scroll * 0.14 % spacing); x < w; x += spacing) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, horizon); ctx.stroke();
  }
  ctx.fillStyle = '#070d1740'; ctx.fillRect(0, horizon - 10, w, floor - horizon + 10);
  if (stage.id === 'studio') {
    for (let i = 0; i < Math.ceil(w / 210) + 1; i++) {
      const x = i * 210 - scroll * 0.08 % 210;
      artBox(ctx, x + 20, horizon - 125, 95, 82, '#182936', 5);
      ctx.strokeStyle = '#3b655c'; ctx.strokeRect(x + 29, horizon - 116, 77, 64);
      for (let j = 0; j < 8; j++) artBox(ctx, x + 36 + j * 8, horizon - 68 - (j * 13 % 27), 4, 10 + j * 13 % 27, '#3a6d62', 1);
      artBox(ctx, x + 137, horizon - 100, 31, 66, '#1b2b3b', 3);
      artCircle(ctx, x + 152.5, horizon - 76, 10, '#0d1420'); artCircle(ctx, x + 152.5, horizon - 51, 6, '#405e6c');
    }
    ctx.fillStyle = '#a3cdb9'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('ESTÚDIO', w * 0.66, horizon - 143);
  } else if(stage.scene) {
    drawTourScene(ctx,{w,h,floor,horizon,stage});
  } else {
    // Soft moving light cones, never abrupt full-screen flashes.
    for (let i = 0; i < 4; i++) {
      const x = w * (i + 0.5) / 4;
      const sway = reducedMotion ? 0 : Math.sin(time * 0.38 + i * 1.8) * w * 0.12;
      ctx.fillStyle = stage.id === 'festival' ? '#ad8beb0b' : '#6bdac60b';
      ctx.beginPath(); ctx.moveTo(x, 24); ctx.lineTo(x - 70 + sway, horizon + 55);
      ctx.lineTo(x + 70 + sway, horizon + 55); ctx.closePath(); ctx.fill();
      artCircle(ctx, x, 25, 3, accent);
    }
    if (stage.id === 'festival') {
      artBox(ctx, w * 0.36, horizon - 130, w * 0.35, 84, '#26304c', 5);
      ctx.strokeStyle = '#806daf'; ctx.strokeRect(w * 0.36 + 6, horizon - 124, w * 0.35 - 12, 72);
      ctx.textAlign = 'center'; ctx.font = `bold ${Math.min(28, w * 0.04)}px monospace`;
      ctx.fillStyle = '#d8c5f8'; ctx.fillText('LUKETA', w * 0.535, horizon - 79);
      ctx.fillStyle = '#a9a4cd'; ctx.font = '9px monospace'; ctx.fillText('PARA SEMPRE O DJ', w * 0.535, horizon - 57);
    }

  }
  // Floor depth and evenly spaced passing markers convey real movement.
  ctx.fillStyle = '#0c1423'; ctx.fillRect(0, floor, w, h - floor);
  ctx.strokeStyle = stage.grid; ctx.lineWidth = 1;
  for (let i = -12; i <= 12; i++) {
    ctx.beginPath(); ctx.moveTo(w / 2, horizon); ctx.lineTo(w / 2 + i * 100, h); ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    const y = floor + (i * 22 + scroll * 0.2 % 22);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.strokeStyle = accent; ctx.lineWidth = 2;
  ctx.shadowColor = accent; ctx.shadowBlur = reducedMotion ? 4 : 10 + pulse * 5;
  ctx.beginPath(); ctx.moveTo(0, floor); ctx.lineTo(w, floor); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#ccd9df'; ctx.globalAlpha = 0.12;
  for (let x = -(scroll % 100); x < w; x += 100) ctx.fillRect(x, floor + 16, 28, 2);
  ctx.restore();
}
function drawStageObstacle(ctx, obstacle, offsetX = 0) {
  const {y, w, h, type} = obstacle;
  const x = obstacle.x-offsetX;
  ctx.save();
  // Warm warning stripe and a solid, grounded silhouette distinguish hazards.
  artBox(ctx, x, y, w, h, '#253044', 4);
  if(type==='rig'){
    ctx.strokeStyle='#e6bd77';ctx.lineWidth=2;ctx.strokeRect(x+3,y+3,w-6,h-6);
    for(let i=0;i<3;i++){artCircle(ctx,x+15+i*22,y+h/2,7,'#101e2c');artCircle(ctx,x+15+i*22,y+h/2,3,'#dbaa6b');}
    ctx.strokeStyle='#7d8795';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+8,y);ctx.lineTo(x+8,y-30);ctx.moveTo(x+w-8,y);ctx.lineTo(x+w-8,y-30);ctx.stroke();
    ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillStyle='#f9d99b';ctx.fillText('↓ ABAIXE',x+w/2,y-36);
  }else if (type === 'speaker') {
    artBox(ctx, x + 4, y + 4, w - 8, h - 8, '#121b2a', 2);
    artCircle(ctx, x + w / 2, y + h * 0.64, w * 0.29, '#44546b');
    artCircle(ctx, x + w / 2, y + h * 0.64, w * 0.17, '#192335');
    artCircle(ctx, x + w / 2, y + h * 0.24, w * 0.12, '#8493a8');
  } else if (type === 'case') {
    ctx.strokeStyle = '#8793a6'; ctx.lineWidth = 2; ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
    artBox(ctx, x + w * 0.35, y + 6, w * 0.3, 5, '#0e1725', 1);
    artBox(ctx, x + 7, y + h - 8, 5, 4, '#afbac5', 1); artBox(ctx, x + w - 12, y + h - 8, 5, 4, '#afbac5', 1);
  } else {
    artBox(ctx, x, y, w, h, '#172230', 4);
    ctx.strokeStyle = '#a2aabb'; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(x + 5, y + h - 6); ctx.bezierCurveTo(x + w * 0.25, y - 7, x + w * 0.7, y + h + 5, x + w - 4, y + 6); ctx.stroke();
  }
  ctx.fillStyle = '#e8ad76';
  for (let i = 0; i < w - 8; i += 10) ctx.fillRect(x + 4 + i, y + h - 4, 5, 2);
  ctx.restore();
}
function paintRecord(ctx, record, time, reducedMotion) {
  const {x, y, r} = record;
  ctx.save(); ctx.translate(x, y);
  if (!reducedMotion) ctx.rotate(Math.sin(time * 2 + x * 0.01) * 0.12);
  artCircle(ctx, 0, 0, r + 4, '#f4d28616');
  ctx.shadowColor = '#e8cd87'; ctx.shadowBlur = 9;
  artCircle(ctx, 0, 0, r, '#1a2634'); ctx.shadowBlur = 0;
  ctx.strokeStyle = '#e9d498'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#667476'; ctx.lineWidth = 0.8;
  for (const ratio of [0.48, 0.67, 0.81]) { ctx.beginPath(); ctx.arc(0, 0, r * ratio, 0, Math.PI * 2); ctx.stroke(); }
  artCircle(ctx, 0, 0, r * 0.3, '#f0d68c'); artCircle(ctx, 0, 0, 1.3, '#162030');
  ctx.strokeStyle = '#fff5ca'; ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.6); ctx.lineTo(-r * 0.2, -r * 0.8); ctx.stroke();
  ctx.restore();
}

// Static scenery and record artwork are rasterized once, then cheaply reused.
let backdropSurface = null, vinylSurface = null;
function createArtSurface(w, h) {
  try {
    const surface = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(w,h) : document.createElement?.('canvas');
    if (!surface) return null;
    surface.width=w;surface.height=h;
    const paint=surface.getContext('2d');
    return paint ? {surface,paint} : null;
  } catch {return null;}
}
function renderStageFrame(ctx, options) {
  const {w,h,floor,stage,time,scroll,pulse,drop,reducedMotion,crowd=0}=options;
  const key=[w,h,floor,stage.id].join(':');
  if (!backdropSurface || backdropSurface.key!==key) {
    const cached=createArtSurface(w,h);
    backdropSurface=cached?{...cached,key}:null;
    if(cached) drawStageBackdrop(cached.paint,{...options,time:0,scroll:0,pulse:0,drop:false,reducedMotion:true});
  }
  if(backdropSurface){
    const shift=reducedMotion?0:Math.max(0,scroll-stage.at)*.075%w;
    ctx.save();ctx.beginPath();ctx.rect(0,0,w,floor);ctx.clip();ctx.drawImage(backdropSurface.surface,-shift,0);if(shift>0)ctx.drawImage(backdropSurface.surface,w-shift,0);ctx.restore();
    ctx.save();ctx.beginPath();ctx.rect(0,floor,w,h-floor);ctx.clip();ctx.drawImage(backdropSurface.surface,0,0);ctx.restore();
  }
  else drawStageBackdrop(ctx,{...options,time:0,scroll:0,pulse:0,drop:false,reducedMotion:true});
  ctx.save();
  const accent=drop?'#f6ce78':stage.accent;
  ctx.fillStyle=accent;ctx.globalAlpha=.32;
  for(let x=-(scroll%100);x<w;x+=100)ctx.fillRect(x,floor+16,32,2);
  ctx.globalAlpha=drop ? 0.85 : 0.6;ctx.fillRect(0,floor-1,w,2);
  if(stage.id==='forest')drawForestLight(ctx,{w,h,floor,time,reducedMotion});
  if(stage.id!=='studio'&&stage.scene!=='apartment')drawCrowd(ctx,{w,floor,stage,time,crowd,reducedMotion});
  if(stage.id!=='studio'&&stage.scene!=='apartment'&&!reducedMotion){
    ctx.globalAlpha=.035+pulse*.012;
    for(let i=0;i<2;i++){
      const x=w*(i+.5)/2,sway=Math.sin(time*.4+i*2)*w*.12;
      ctx.beginPath();ctx.moveTo(x,25);ctx.lineTo(x+sway-65,floor-90);ctx.lineTo(x+sway+65,floor-90);ctx.closePath();ctx.fill();
    }
  }
  ctx.restore();
}
function drawRecord(ctx, record, time, reducedMotion, offsetX = 0) {
  const size=Math.ceil((record.r+7)*2);
  if(!vinylSurface||vinylSurface.size!==size){
    const cached=createArtSurface(size,size);
    vinylSurface=cached?{...cached,size}:null;
    if(cached)paintRecord(cached.paint,{x:size/2,y:size/2,r:record.r},0,true);
  }
  if(!vinylSurface){paintRecord(ctx,{...record,x:record.x-offsetX},time,reducedMotion);return;}
  ctx.save();ctx.translate(record.x-offsetX,record.y);
  if(!reducedMotion)ctx.rotate(Math.sin(time*2+record.x*.01)*.12);
  ctx.drawImage(vinylSurface.surface,-size/2,-size/2);ctx.restore();
}
// Six small cached sprites keep rare pickups distinct without extra per-frame artwork.
const bonusSprites=new Map();
function paintBonus(ctx,type){
  ctx.save();ctx.translate(26,26);ctx.lineWidth=2;
  const color={usb:'#f6d58b',chain:'#b6e9ff',backstage:'#91dbff',heart:'#ffafc6',energy:'#c3f48d',lean:'#c7a3e8'}[type];
  artCircle(ctx,0,0,23,'#132737');ctx.strokeStyle=color;ctx.fillStyle=color;
  if(type==='usb'){
    ctx.rotate(-.35);artBox(ctx,-9,-4,18,23,color,3);artBox(ctx,-6,-15,12,12,'#e6edf1',1);
    ctx.fillStyle='#354859';ctx.fillRect(-3,-12,2,5);ctx.fillRect(1,-12,2,5);ctx.fillRect(-5,5,10,2);
  }else if(type==='chain'){
    ctx.strokeStyle='#dcebf2';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,-1,15,13,0,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#7f9ba9';ctx.lineWidth=1;
    for(let i=0;i<10;i++){const angle=i*Math.PI*2/10;ctx.beginPath();ctx.ellipse(Math.cos(angle)*15,Math.sin(angle)*13-1,3,2,angle,0,Math.PI*2);ctx.stroke();}
    artBox(ctx,-7,9,14,9,'#eff7fa',2);ctx.fillStyle='#6c8b9d';ctx.font='bold 6px monospace';ctx.textAlign='center';ctx.fillText('L',0,16);
  }else if(type==='energy'){
    artBox(ctx,-10,-17,20,34,'#c3f48d',5);ctx.fillStyle='#506753';ctx.fillRect(-7,-14,14,3);ctx.fillRect(-7,12,14,2);
    ctx.fillStyle='#284645';ctx.beginPath();ctx.moveTo(2,-10);ctx.lineTo(-5,2);ctx.lineTo(1,2);ctx.lineTo(-2,10);ctx.lineTo(7,-2);ctx.lineTo(1,-2);ctx.closePath();ctx.fill();
  }else if(type==='lean'){
    ctx.fillStyle='#c7a3e8';ctx.beginPath();ctx.moveTo(-13,-11);ctx.lineTo(13,-11);ctx.lineTo(9,18);ctx.lineTo(-9,18);ctx.closePath();ctx.fill();
    artBox(ctx,-14,-15,28,5,'#ede1f5',2);ctx.strokeStyle='#e7d6f4';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(5,-14);ctx.lineTo(8,-24);ctx.stroke();
    ctx.fillStyle='#64437a';ctx.font='bold 7px monospace';ctx.textAlign='center';ctx.fillText('SLOW',0,6);
  }else if(type==='backstage'){
    ctx.rotate(-.35);ctx.beginPath();ctx.ellipse(0,0,17,11,0,0,Math.PI*2);ctx.stroke();
    artBox(ctx,-11,-6,22,12,color,3);ctx.fillStyle='#12344b';ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillText('VIP',0,3);
  }else{
    ctx.beginPath();ctx.moveTo(0,15);ctx.bezierCurveTo(-29,-3,-12,-26,0,-11);ctx.bezierCurveTo(12,-26,29,-3,0,15);ctx.fill();
  }
  ctx.restore();
}
function drawBonus(ctx,item,offsetX=0){
  if(!bonusSprites.has(item.type)){
    const cached=createArtSurface(52,52);
    if(cached){paintBonus(cached.paint,item.type);bonusSprites.set(item.type,cached.surface);}
  }
  ctx.save();ctx.translate(item.x-offsetX,item.y);
  const sprite=bonusSprites.get(item.type);
  if(sprite)ctx.drawImage(sprite,-26,-26);
  else {ctx.translate(-26,-26);paintBonus(ctx,item.type);}
  ctx.restore();
}

function drawCrowd(ctx,{w,floor,stage,time,crowd,reducedMotion}){
  ctx.save();
  const count=Math.min(24,Math.ceil(w/32)),spacing=w/(count-1||1);
  for(let i=0;i<count;i++){
    const x=i*spacing;
    const bounce=reducedMotion?0:Math.sin(time*(crowd>0?5:2.5)+i*1.3)*(crowd>0?4:1.5);
    const y=floor-53-(i*7%19)+bounce;
    const color=stage.id==='festival'?'#28314b':'#1c3043';
    artCircle(ctx,x,y,5,color);artBox(ctx,x-6,y+5,12,23,color,5);
    ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-4,y+12);
    ctx.lineTo(x-13,y+(crowd>0?-9:6));ctx.moveTo(x+4,y+12);ctx.lineTo(x+12,y+(crowd>0?-12:1));ctx.stroke();
  }
  // Small, soft camera glints stay in the crowd; reduced motion suppresses them.
  if(crowd>0&&!reducedMotion){
    ctx.globalAlpha=Math.sin(Math.PI*crowd)*.45;
    for(let i=0;i<3;i++){const x=w*(i+.65)/3,y=floor-83-(i%2)*17;ctx.strokeStyle='#d0e9e6';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.moveTo(x,y-4);ctx.lineTo(x,y+4);ctx.stroke();}
  }
  ctx.restore();
}
// Original tour scenery is painted into the existing single-scene cache.
function artRidge(ctx,w,base,color,heights){
  ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,base+100);
  heights.forEach((height,i)=>ctx.lineTo(w*i/(heights.length-1),base-height));
  ctx.lineTo(w,base+100);ctx.closePath();ctx.fill();
}
function tinyTriangle(ctx,x,y,size,color){
  ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y-size);ctx.lineTo(x-size,y+size);ctx.lineTo(x+size,y+size);ctx.closePath();ctx.fill();
}
function drawTourScene(ctx,{w,h,floor,horizon,stage}){
  ctx.save();
  const base=Math.min(floor-50,horizon+45),accent=stage.accent;
  ctx.fillStyle=stage.sky;ctx.fillRect(0,0,w,base+100);
  if(stage.scene==='apartment'){drawApartment213(ctx,{w,base});
  }else if(stage.scene==='cena'){drawCenaStage(ctx,{w,base});
  }else if(stage.scene==='rooftop'){
    artCircle(ctx,w*.77,base-190,28,'#e8d8d8');artCircle(ctx,w*.77+12,base-198,27,stage.sky);
    for(let layer=0;layer<2;layer++)for(let i=0;i<Math.ceil(w/64)+1;i++){
      const x=i*64-layer*24,top=base-45-(i*47%100)-layer*25;
      artBox(ctx,x,top,51,base-top,layer?'#242a43':'#20223a',1);
      ctx.fillStyle='#b2938060';
      for(let r=0;r<4;r++)for(let c=0;c<3;c++)if((i+r+c)%3)ctx.fillRect(x+8+c*12,top+13+r*20,4,7);
    }
    artBox(ctx,0,base,w,10,'#475066',0);ctx.strokeStyle='#77718d';ctx.lineWidth=2;
    for(let x=0;x<w;x+=65){ctx.beginPath();ctx.moveTo(x,base);ctx.lineTo(x,base-33);ctx.stroke();}
    ctx.beginPath();ctx.moveTo(0,base-33);ctx.lineTo(w,base-33);ctx.stroke();
  }else if(stage.scene==='metro'){
    ctx.strokeStyle='#33535b';ctx.lineWidth=12;
    for(let x=20;x<w;x+=115){ctx.beginPath();ctx.moveTo(x,base+15);ctx.lineTo(x,base-128);ctx.quadraticCurveTo(x+50,base-210,x+105,base-128);ctx.stroke();}
    artBox(ctx,-20,base-90,w+40,98,'#29434e',8);
    for(let x=8;x<w;x+=96){artBox(ctx,x,base-75,67,43,'#0f2635',5);ctx.fillStyle='#8bafb855';ctx.fillRect(x+4,base-71,59,3);}
    artBox(ctx,w*.44,base-147,Math.min(170,w*.5),31,'#152e3b',3);
    ctx.fillStyle=accent;ctx.font='10px monospace';ctx.fillText('ÚLTIMO METRÔ',w*.45+8,base-127);
    ctx.strokeStyle='#638b91';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,base+14);ctx.lineTo(w,base+14);ctx.stroke();
  }else if(stage.scene==='forest'){
    artRidge(ctx,w,base,'#183a31',[20,70,35,95,55,75,20]);
    for(let i=0;i<Math.ceil(w/100)+1;i++){
      const x=i*100-15,top=base-150-i%3*26;
      artBox(ctx,x,top,22,base-top+20,'#243e34',5);
      artCircle(ctx,x+10,top,55,'#204f3d');artCircle(ctx,x-10,top-25,39,'#285b43');
      ctx.strokeStyle='#44624c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+12,base);ctx.lineTo(x+9,top+22);ctx.stroke();
    }
    artBox(ctx,w*.37,base-37,Math.min(75,w*.2),35,'#51634a',12);
    ctx.strokeStyle='#91ad71';ctx.lineWidth=2;ctx.beginPath();ctx.arc(w*.43,base-20,8,0,Math.PI*1.6);ctx.stroke();
    for(let i=0;i<8;i++)artCircle(ctx,w*(i+.4)/8,base+15-i%2*8,3,'#719666');
  }else if(stage.scene==='lake'){
    artCircle(ctx,w*.2,base-170,22,'#a4c6d0');
    artRidge(ctx,w,base-35,'#294357',[35,75,15,90,32,65,20]);
    artRidge(ctx,w,base-5,'#20394a',[10,25,18,35,12]);
    artBox(ctx,0,base-2,w,72,'#294c61',0);
    for(let i=0;i<7;i++){ctx.fillStyle='#8ebbc53b';ctx.fillRect(w*.18-i*7,base+i*8,20+i*14,2);}
    artBox(ctx,w*.72,base-39,52,40,'#3c515d',10);
    // A tiny blue wind instrument rests on a rock, away from the collectible path.
    ctx.save();ctx.translate(w*.72+24,base-39);ctx.rotate(-.3);
    ctx.fillStyle='#779dbc';ctx.beginPath();ctx.ellipse(0,0,14,8,0,0,Math.PI*2);ctx.fill();
    ctx.fillRect(6,-8,12,6);for(const [x,y]of[[-6,-1],[0,-3],[5,2]])artCircle(ctx,x,y,1.2,'#24485e');ctx.restore();
  }else if(stage.scene==='desert'){
    artCircle(ctx,w*.76,base-175,31,'#d9a083');
    artRidge(ctx,w,base-35,'#634959',[18,57,25,68,20,50,22]);
    artRidge(ctx,w,base,'#8c625c',[10,34,9,47,12,29,10]);
    artRidge(ctx,w,base+40,'#a57964',[8,20,6,28,4]);
    ctx.strokeStyle='#b19579';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(w*.26,base);ctx.lineTo(w*.26,base-95);ctx.quadraticCurveTo(w*.32,base-155,w*.38,base-95);ctx.lineTo(w*.38,base);ctx.stroke();
    ctx.fillStyle='#d5be8d';ctx.font='12px monospace';ctx.fillText('♪',w*.31,base-112);
    for(let i=0;i<4;i++){artBox(ctx,w*(i+.3)/4,base+19,18,8,'#674d4e',4);}
  }else if(stage.scene==='temple'){
    artBox(ctx,w*.19,base-220,w*.62,225,'#353b4a',3);
    ctx.fillStyle='#171f30';ctx.beginPath();ctx.moveTo(w*.36,base);ctx.lineTo(w*.36,base-125);ctx.quadraticCurveTo(w*.5,base-205,w*.64,base-125);ctx.lineTo(w*.64,base);ctx.closePath();ctx.fill();
    for(const x of [w*.2,w*.29,w*.68,w*.77]){artBox(ctx,x,base-175,Math.max(10,w*.025),175,'#6b6d72',2);artBox(ctx,x-4,base-180,Math.max(18,w*.025+8),9,'#96958b',1);}
    ctx.strokeStyle='#a8ab9c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(w*.5,base-154,25,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<6;i++)artCircle(ctx,w*.5+Math.cos(i*Math.PI/3)*19,base-154+Math.sin(i*Math.PI/3)*19,2,'#a4aaa1');
    // Three small golden lamps sit high above the arch.
    tinyTriangle(ctx,w*.5,base-211,4,'#d7bf77');tinyTriangle(ctx,w*.5-5,base-202,4,'#d7bf77');tinyTriangle(ctx,w*.5+5,base-202,4,'#d7bf77');
    for(let i=0;i<3;i++)artBox(ctx,w*.28-i*12,base+i*7,w*.44+i*24,7,'#77796f',0);
  }else if(stage.scene==='dawn'){
    const sunrise=ctx.createLinearGradient(0,base-230,0,base+80);sunrise.addColorStop(0,'#343047');sunrise.addColorStop(1,'#d2a092');ctx.fillStyle=sunrise;ctx.fillRect(0,0,w,base+80);
    artCircle(ctx,w*.63,base-50,52,'#f4ceaa');
    artRidge(ctx,w,base,'#5d586b',[25,52,27,66,23,48,20]);
    for(let i=0;i<Math.ceil(w/75);i++)artBox(ctx,i*75,base-15-i*11%30,54,70,'#3d4255',2);
    ctx.strokeStyle='#c6aeb0';ctx.lineWidth=1;
    for(let i=0;i<3;i++){const x=w*.34+i*18,y=base-135-i%2*9;ctx.beginPath();ctx.moveTo(x-4,y+2);ctx.quadraticCurveTo(x,y-3,x+4,y+2);ctx.stroke();}
  }
  ctx.fillStyle=accent;ctx.font='10px monospace';ctx.textAlign='center';
  ctx.fillText(stage.name,w*.5,Math.max(145,base-250));
  ctx.restore();
}
function drawForestLight(ctx,{w,h,floor,time,reducedMotion}){
  const horizon=Math.min(floor-30,h*.58),x=w*.61+(reducedMotion?0:Math.sin(time*.55)*7),y=horizon-65+(reducedMotion?0:Math.cos(time*.7)*5);
  ctx.save();ctx.globalAlpha=.55;ctx.fillStyle='#b8dbe2';
  ctx.beginPath();ctx.ellipse(x-4,y-3,5,2,-.5,0,Math.PI*2);ctx.ellipse(x+4,y-3,5,2,.5,0,Math.PI*2);ctx.fill();artCircle(ctx,x,y,2.5,'#cdeaf2');ctx.restore();
}
function drawApartment213(ctx,{w,base}){
  // Imagined room with the supplied door number and personal wall inscription.
  artBox(ctx,0,base-230,w,260,'#473b43',0);
  for(let x=0;x<w;x+=105){ctx.fillStyle='#62505a44';ctx.fillRect(x,base-230,2,255);}
  const doorW=Math.max(47,w*.09),doorX=w*.07;
  artBox(ctx,doorX,base-165,doorW,170,'#634e4e',2);artBox(ctx,doorX+6,base-158,doorW-12,153,'#493b42',1);
  ctx.fillStyle='#f4dcb2';ctx.font='bold 15px monospace';ctx.textAlign='center';ctx.fillText('213',doorX+doorW/2,base-127);
  artCircle(ctx,doorX+doorW-12,base-68,3,'#c7a37b');
  artBox(ctx,w*.75,base-203,w*.15,91,'#a89589',3);artBox(ctx,w*.75+5,base-198,w*.15-10,80,'#263246',1);
  ctx.fillStyle='#717383';for(let i=0;i<3;i++)ctx.fillRect(w*.76+i*w*.045,base-164-i*9,11,45+i*9);
  artBox(ctx,w*.24,base-65,w*.37,10,'#b89475',2);artBox(ctx,w*.26,base-55,6,65,'#766160',1);artBox(ctx,w*.57,base-55,6,65,'#766160',1);
  artBox(ctx,w*.33,base-112,Math.max(38,w*.11),43,'#18252e',3);artBox(ctx,w*.33+4,base-108,Math.max(30,w*.11-8),33,'#42616b',1);
  ctx.strokeStyle='#98b1aa';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(w*.34,base-89);for(let i=0;i<15;i++)ctx.lineTo(w*.34+i*w*.006,base-89+Math.sin(i*2)*7);ctx.stroke();
  for(const x of [w*.27,w*.50]){artBox(ctx,x,base-94,21,29,'#292930',2);artCircle(ctx,x+10,base-80,6,'#777579');}
  artBox(ctx,w*.68,base-51,w*.20,45,'#75616c',8);artBox(ctx,w*.65,base-29,w*.25,28,'#8d747b',5);
  ctx.strokeStyle='#af9a90';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(w*.66,base-6);ctx.lineTo(w*.66,base-98);ctx.lineTo(w*.71,base-125);ctx.stroke();
  artBox(ctx,w*.69,base-138,8,21,'#c1b1a5',4);ctx.strokeStyle='#302c39';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(w*.70+15,base-125,11,17,0,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#282936';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(w*.69,base-115);ctx.bezierCurveTo(w*.55,base+30,w*.25,base-30,w*.29,base+15);ctx.stroke();
  for(let i=0;i<3;i++)artBox(ctx,w*.42+i*13,base+4,11,4,'#b8a795',1);
  ctx.fillStyle='#e7c9a7';ctx.font='bold '+Math.max(12,Math.min(24,w*.025))+'px monospace';ctx.textAlign='center';ctx.fillText('213 tô no memo apê',w*.44,base-175);
  ctx.fillStyle='#d3b69b';ctx.font='8px monospace';ctx.textAlign='left';ctx.fillText('REC ●',w*.35,base-145);
}
function drawCenaStage(ctx,{w,base}){
  // Research: CENA2K site and Marcio Natel's CENA 2K19 stage photographs on Behance.
  // Original drawing: pink header, paired LED panels, truss and central runway.
  const left=w*.13,right=w*.87,top=base-207;
  artBox(ctx,left,top,right-left,198,'#202034',2);ctx.strokeStyle='#75697e';ctx.lineWidth=4;ctx.strokeRect(left,top,right-left,198);
  ctx.lineWidth=1;for(let i=0;i<9;i++){const x=left+i*(right-left)/9;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x+20,top+16);ctx.lineTo(x+40,top);ctx.stroke();}
  artBox(ctx,w*.30,top+63,w*.40,107,'#6b335e',2);
  for(const x of [w*.15,w*.72]){artBox(ctx,x,top+48,w*.13,133,'#58426c',2);for(let i=0;i<7;i++){ctx.fillStyle=i%2?'#c26caf70':'#8a6aab88';ctx.fillRect(x+3,top+51+i*18,w*.13-6,12);}}
  ctx.fillStyle='#efa0d5';ctx.font='bold '+Math.min(58,w*.10)+'px monospace';ctx.textAlign='center';ctx.fillText('CENA',w*.5,top+48);
  ctx.font='bold '+Math.min(22,w*.045)+'px monospace';ctx.fillStyle='#e8c8e4';ctx.fillText('2K',w*.5,top+101);ctx.font='10px monospace';ctx.fillText('FESTIVAL',w*.5,top+125);
  for(let i=0;i<6;i++)artCircle(ctx,left+(i+.5)*(right-left)/6,top+14,3,'#efb3d9');
  ctx.fillStyle='#3b2949';ctx.beginPath();ctx.moveTo(w*.42,base-13);ctx.lineTo(w*.58,base-13);ctx.lineTo(w*.70,base+69);ctx.lineTo(w*.30,base+69);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#ba78a9';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(w*.42,base-13);ctx.lineTo(w*.30,base+69);ctx.moveTo(w*.58,base-13);ctx.lineTo(w*.70,base+69);ctx.stroke();
}
