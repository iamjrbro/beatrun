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
    // Audience silhouettes stay behind the playable floor.
    const crowdY = floor - 20;
    for (let i = 0; i < Math.ceil(w / 26) + 2; i++) {
      const x = i * 26 - (scroll * 0.18 % 26), bounce = reducedMotion ? 0 : Math.sin(time * 2.5 + i) * 2;
      const y = crowdY - 30 - i * 7 % 20 + bounce;
      artCircle(ctx, x, y, 6, '#182337'); artBox(ctx, x - 7, y + 5, 14, 29, '#182337', 6);
      if (i % 4 === 0) {
        ctx.strokeStyle = '#24324c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y + 14);
        ctx.lineTo(x + 14, y - 8 - bounce); ctx.stroke();
      }
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
  if (type === 'speaker') {
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
  const {w,h,floor,stage,time,scroll,pulse,drop,reducedMotion}=options;
  const key=[w,h,floor,stage.id].join(':');
  if (!backdropSurface || backdropSurface.key!==key) {
    const cached=createArtSurface(w,h);
    backdropSurface=cached?{...cached,key}:null;
    if(cached) drawStageBackdrop(cached.paint,{...options,time:0,scroll:0,pulse:0,drop:false,reducedMotion:true});
  }
  if(backdropSurface) ctx.drawImage(backdropSurface.surface,0,0);
  else drawStageBackdrop(ctx,{...options,time:0,scroll:0,pulse:0,drop:false,reducedMotion:true});
  ctx.save();
  const accent=drop?'#f6ce78':stage.accent;
  ctx.fillStyle=accent;ctx.globalAlpha=.32;
  for(let x=-(scroll%100);x<w;x+=100)ctx.fillRect(x,floor+16,32,2);
  ctx.globalAlpha=drop ? 0.85 : 0.6;ctx.fillRect(0,floor-1,w,2);
  if(stage.id!=='studio'&&!reducedMotion){
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
// Four small cached sprites keep rare pickups distinct without extra per-frame artwork.
const bonusSprites=new Map();
function paintBonus(ctx,type){
  ctx.save();ctx.translate(26,26);ctx.lineWidth=2;
  const color={usb:'#f6d58b',diamond:'#b6e9ff',backstage:'#91dbff',heart:'#ffafc6'}[type];
  artCircle(ctx,0,0,23,'#132737');ctx.strokeStyle=color;ctx.fillStyle=color;
  if(type==='usb'){
    ctx.rotate(-.35);artBox(ctx,-9,-4,18,23,color,3);artBox(ctx,-6,-15,12,12,'#e6edf1',1);
    ctx.fillStyle='#354859';ctx.fillRect(-3,-12,2,5);ctx.fillRect(1,-12,2,5);ctx.fillRect(-5,5,10,2);
  }else if(type==='diamond'){
    ctx.beginPath();ctx.moveTo(-16,-6);ctx.lineTo(-9,-15);ctx.lineTo(9,-15);ctx.lineTo(16,-6);ctx.lineTo(0,17);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#43849e';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-16,-6);ctx.lineTo(16,-6);ctx.moveTo(-9,-15);ctx.lineTo(-5,-6);ctx.lineTo(0,17);ctx.lineTo(5,-6);ctx.lineTo(9,-15);ctx.stroke();
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
