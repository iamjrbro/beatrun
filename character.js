/* Original Canvas artwork, inspired by the reference photos. No photo assets required. */
function characterColors(outfit, hair) {
  const shirts = {
    black: ['#24252d', '#50525d', '#24252d'],
    white: ['#f4f3ef', '#bfc1c1', '#dedfdb'],
    neon: ['#c1ef35', '#789b24', '#addb2e'],
    orange: ['#ff7625', '#b54512', '#e85d17'],
    jeweled: ['#123d32', '#28594a', '#123d32'],
    vetements: ['#171820','#3e414b','#171820'],
    racer: ['#f0eee3','#c4c2b6','#e5e2d5'],
    majestic: ['#f5f1e9','#c5c7cc','#e8e4df'],
    blueflame: ['#171b26','#3c4659','#171b26'],
    crown: ['#21232c','#555562','#181b24'],
    vethood: ['#171820','#41434d','#13151d'],
  };
  const [shirt, seam, hood] = shirts[outfit] || shirts.black;
  const hairPalette = {
    blond: ['#c2ae7e', '#e3cf9b', '#f2e1b7', '#b59c6b'],
    pink: ['#c66e96', '#f19fc8', '#ffd1e8', '#ae557f'],
    turquoise: ['#239d9f', '#54d9cf', '#b2fff0', '#177578'],
    green: ['#419a46', '#7cdb63', '#c5f7a2', '#2b7037'],
  };
  const [hairBase, hairLight, hairHighlight, hairShadow] = hairPalette[hair] || hairPalette.blond;
  return { shirt, seam, hood, hairBase, hairLight, hairHighlight, hairShadow };
}

// Forest-green crewneck with dark tonal print and small floral rhinestone clusters.
function drawSpikedHair(ctx,hair,profile){
  const {hairBase,hairLight,hairHighlight,hairShadow}=characterColors('black',hair);
  const points=profile?[[-18,-48],[-18,-59],[-15,-64],[-11,-62],[-7,-67],[-3,-63],[2,-68],[6,-63],[11,-66],[14,-62],[18,-63],[19,-53],[12,-51],[5,-50],[-4,-46]]
    :[[-21,-50],[-20,-59],[-17,-64],[-14,-62],[-10,-67],[-6,-63],[-1,-68],[3,-63],[8,-67],[11,-62],[17,-65],[20,-59],[21,-50],[12,-49],[0,-50],[-12,-49]];
  ctx.save();ctx.fillStyle=hairBase;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
  ctx.lineCap='round';
  for(let i=0;i<13;i++){
    const x=-16+i*2.6,tip=(i<2||i>10?-61:-64)-(i*5%3);
    ctx.strokeStyle=i%3?hairLight:hairShadow;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x,-53-(i%3));ctx.quadraticCurveTo(x-1,-59,x+1,tip);ctx.stroke();
    if(i%2===0){ctx.strokeStyle=hairHighlight;ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(x,-58);ctx.lineTo(x+.6,tip+2);ctx.stroke();}
  }
  ctx.restore();
}

function drawJeweledFabric(ctx,x,y,w,h) {
  ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,4);ctx.clip();
  ctx.strokeStyle='#082a23';ctx.lineWidth=1.5;
  for(let row=0;row<2;row++){
    ctx.beginPath();ctx.moveTo(x+w*.12,y+h*(.52+row*.21));
    ctx.bezierCurveTo(x+w*.35,y+h*(.25+row*.2),x+w*.55,y+h*(.8+row*.1),x+w*.87,y+h*(.48+row*.21));ctx.stroke();
  }
  for(let i=0;i<5;i++){
    const cx=x+w*(.16+(i*37%68)/100),cy=y+h*(.18+(i*23%67)/100);
    for(let petal=0;petal<4;petal++){
      const angle=petal*Math.PI/2+.4;
      ctx.fillStyle=petal%2?'#d4cbae':'#e0e9e5';
      ctx.beginPath();ctx.ellipse(cx+Math.cos(angle)*2,cy+Math.sin(angle)*2,.7,1.5,angle-Math.PI/2,0,Math.PI*2);ctx.fill();
    }
    ctx.fillStyle='#fff9df';ctx.fillRect(cx-.45,cy-.45,.9,.9);
  }
  for(let i=0;i<15;i++){
    const px=x+2+(i*13%Math.max(1,w-4)),py=y+2+(i*19%Math.max(1,h-4));
    ctx.fillStyle=i%3?'#b9c6bc':'#e4dcc6';ctx.fillRect(px,py,.7,.9);
  }
  ctx.restore();
}

function drawPhotoPrint(ctx,outfit,x,y,w,h){
  if(!['vetements','racer','blueflame','crown','vethood','majestic'].includes(outfit))return;
  ctx.save();ctx.translate(x,y);ctx.scale(w/40,h/36);ctx.beginPath();ctx.rect(0,0,40,36);ctx.clip();
  const text=(value,yy,color,size=5)=>{ctx.fillStyle=color;ctx.font=`bold ${size}px Arial`;ctx.textAlign='center';ctx.fillText(value,20,yy,37);};
  if(outfit==='vetements'||outfit==='vethood'){
    text('VETEMENTS',12,outfit==='vetements'?'#e2e4e9':'#64646f',5);
    if(outfit==='vetements')for(let i=0;i<20;i++){ctx.fillStyle='#fff';ctx.fillRect(3+i*7%34,8+i%4,.45,.45);}
  }else if(outfit==='majestic'){
    ctx.textAlign='center';ctx.font='bold 6.5px Georgia';ctx.strokeStyle='#d7b84e';ctx.lineWidth=.7;
    ctx.strokeText('Majestic',20,7,37);ctx.fillStyle='#367ec9';ctx.fillText('Majestic',20,7,37);
    for(let i=0;i<20;i++){ctx.strokeStyle=i%2?'#afc9df':'#dae1e9';ctx.lineWidth=.45;ctx.beginPath();ctx.moveTo(i*13%40,10+i*7%21);ctx.lineTo(i*13%40+2,13+i*7%21);ctx.stroke();}
    for(const [px,py,size]of [[7,18,.8],[20,13,1],[33,19,.8]]){
      ctx.save();ctx.translate(px,py);ctx.scale(size,size);
      // Blue-cloaked skeleton cowboys and orange horses recall the reference print.
      ctx.fillStyle='#b77c32';ctx.beginPath();ctx.ellipse(0,1,5,1.2,-.15,0,Math.PI*2);ctx.fill();ctx.fillRect(-2,-1,4,2);
      ctx.fillStyle='#e9e1c9';ctx.beginPath();ctx.arc(0,3,1.7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#253948';ctx.fillRect(-1,2.5,.65,.65);ctx.fillRect(.4,2.5,.65,.65);
      ctx.fillStyle='#2c77bb';ctx.beginPath();ctx.moveTo(-3,5);ctx.lineTo(3,5);ctx.lineTo(5,15);ctx.lineTo(-4,15);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#e3e7dc';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(0,6);ctx.lineTo(0,13);for(let r=0;r<4;r++){ctx.moveTo(-2,7+r*1.5);ctx.lineTo(2,7+r*1.5);}ctx.stroke();
      ctx.fillStyle='#c96d38';ctx.beginPath();ctx.ellipse(1,19,5,5,-.3,0,Math.PI*2);ctx.fill();ctx.fillRect(-4,13,3,6);ctx.fillStyle='#252c36';ctx.fillRect(-4,13,1,7);
      ctx.strokeStyle='#edbd5a';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(-1,17);ctx.lineTo(2,22);ctx.moveTo(-2,22);ctx.lineTo(-3,28);ctx.moveTo(4,22);ctx.lineTo(5,28);ctx.stroke();ctx.restore();
    }
  }else if(outfit==='racer'){
    text('GALLERY',7,'#757a80',6);text('RACING',34,'#757a80',6);
    ctx.strokeStyle='#717982';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(7,14);ctx.bezierCurveTo(34,5,38,18,12,25);ctx.bezierCurveTo(7,22,26,19,30,14);ctx.stroke();
    for(const [px,py]of [[5,9],[33,12],[6,28],[31,29]]){for(let i=0;i<5;i++){ctx.fillStyle='#f6f2dc';ctx.beginPath();ctx.ellipse(px+Math.cos(i*1.26)*2,py+Math.sin(i*1.26)*2,1,2,i*1.26,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#e7ba44';ctx.fillRect(px-.7,py-.7,1.4,1.4);}
  }else if(outfit==='blueflame'){
    text('VALE DREAMS',7,'#8dbbee',5);
    ctx.fillStyle='#267fc5';ctx.beginPath();ctx.moveTo(3,31);ctx.lineTo(5,14);ctx.lineTo(12,21);ctx.lineTo(16,11);ctx.lineTo(24,20);ctx.lineTo(36,13);ctx.lineTo(33,34);ctx.closePath();ctx.fill();
    ctx.fillStyle='#162c48';ctx.beginPath();ctx.ellipse(21,23,10,9,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#b1cce5';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#08131f';ctx.fillRect(13,19,15,5);
    ctx.fillStyle='#c6957e';ctx.beginPath();ctx.ellipse(21,29,4,3,0,0,Math.PI*2);ctx.fill();
  }else if(outfit==='crown'){
    ctx.fillStyle='#9e7350';ctx.beginPath();ctx.moveTo(8,15);ctx.lineTo(5,4);ctx.lineTo(14,8);ctx.lineTo(20,1);ctx.lineTo(26,8);ctx.lineTo(35,4);ctx.lineTo(32,15);ctx.closePath();ctx.fill();
    ctx.fillStyle='#b6abb0';ctx.beginPath();ctx.ellipse(20,25,13,10,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#39353e';ctx.beginPath();ctx.ellipse(11,21,6,6,-.4,0,Math.PI*2);ctx.ellipse(29,21,6,6,.4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#6c5050';ctx.beginPath();ctx.ellipse(20,28,8,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#191923';ctx.fillRect(17,25,6,3);
    ctx.strokeStyle='#bd685d';ctx.lineWidth=1;ctx.strokeRect(7,12,26,3);
    ctx.strokeStyle='#b9bdc5';ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(20,36);ctx.stroke();
  }
  for(let i=0;i<12&&['racer','blueflame','crown'].includes(outfit);i++){ctx.fillStyle='#eef5ff';ctx.fillRect(3+i*11%34,4+i*7%29,.6,.6);}
  ctx.restore();
}
function drawPhotoSleeve(ctx,outfit){
  if(!['blueflame','crown'].includes(outfit))return;
  ctx.save();ctx.beginPath();ctx.rect(-5,-1,10,26);ctx.clip();
  ctx.strokeStyle=outfit==='blueflame'?'#83bceb':'#a56558';ctx.lineWidth=1.4;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-5,3+i*8);ctx.bezierCurveTo(4,-2+i*8,-4,12+i*8,5,6+i*8);ctx.stroke();}
  ctx.restore();
}
function drawNecklace(ctx,style,profile){
  if(style==='none')return;
  const gold=style==='cubanGold';
  ctx.save();if(profile){ctx.translate(9,-12);ctx.scale(.56,1);}else ctx.translate(0,-13);
  const thick=style==='cuban'||gold||style==='face';
  ctx.strokeStyle=gold?'#b18432':'#9da9bc';ctx.lineWidth=thick?4:1.8;ctx.beginPath();ctx.moveTo(-11,-4);
  if(style==='luketa'){ctx.quadraticCurveTo(-16,7,-12,20);ctx.moveTo(11,-4);ctx.quadraticCurveTo(16,7,12,20);}
  else{ctx.quadraticCurveTo(-14,11,0,17);ctx.quadraticCurveTo(14,11,11,-4);}
  ctx.stroke();
  ctx.strokeStyle=gold?'#f3d17b':'#edf4ff';ctx.lineWidth=thick?2: .7;ctx.stroke();
  if(thick)for(let i=0;i<15;i++){const t=i/14*Math.PI;ctx.strokeStyle=gold?(i%2?'#fff0be':'#d6a84e'):(i%2?'#ffffff':'#b7c5d8');ctx.lineWidth=.9;ctx.beginPath();ctx.ellipse(-11*Math.cos(t),-3+19*Math.sin(t),1.6,2.2,-.5,0,Math.PI*2);ctx.stroke();}
  ctx.fillStyle='#dce6f5';ctx.strokeStyle='#ffffff';ctx.lineWidth=.6;
  if(style==='cross'){ctx.fillRect(-1.7,14,3.4,14);ctx.fillRect(-5,18,10,3.4);}
  if(style==='face'){ctx.beginPath();ctx.ellipse(0,23,5,6.5,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#8898b0';ctx.beginPath();ctx.moveTo(-3,21);ctx.lineTo(-1,21);ctx.moveTo(1,21);ctx.lineTo(3,21);ctx.moveTo(-2,26);ctx.lineTo(2,26);ctx.stroke();}
  if(style==='luketa'){
    // Individual iced letters have no solid plate or rectangular backing.
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 7px Arial';
    ctx.strokeStyle='#8997ac';ctx.lineWidth=.45;ctx.strokeText('LUKETA',0,23);
    ctx.fillStyle='#edf5ff';ctx.fillText('LUKETA',0,23);
    for(const px of [-12,-7,-2,3,8,12]){
      ctx.strokeStyle='#ffffff';ctx.lineWidth=.35;ctx.beginPath();ctx.moveTo(px-.65,21);ctx.lineTo(px+.65,21);ctx.moveTo(px,20.3);ctx.lineTo(px,21.7);ctx.stroke();
    }
  }
  ctx.restore();
}
function drawDiamondStud(ctx,x,y,size=1.8){
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#8f9eb6';ctx.beginPath();ctx.arc(0,0,size+.3,0,Math.PI*2);ctx.fill();
  for(let i=0;i<6;i++){const t=i*Math.PI/3;ctx.fillStyle=i%2?'#ffffff':'#c2d9ef';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(t)*size,Math.sin(t)*size);ctx.lineTo(Math.cos(t+Math.PI/3)*size,Math.sin(t+Math.PI/3)*size);ctx.closePath();ctx.fill();}
  ctx.strokeStyle='#ffffff';ctx.lineWidth=.4;ctx.beginPath();ctx.moveTo(-size-.6,0);ctx.lineTo(size+.6,0);ctx.moveTo(0,-size-.6);ctx.lineTo(0,size+.6);ctx.stroke();ctx.restore();
}
function drawCrossEarring(ctx,x,y,hoop=false){
  ctx.save();
  if(hoop){ctx.strokeStyle='#a7bbd4';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y+1,1.4,2,0,0,Math.PI*2);ctx.stroke();for(let i=0;i<8;i++){const t=i*Math.PI/4;drawDiamondStud(ctx,x+Math.cos(t)*1.4,y+1+Math.sin(t)*2,.28);}y+=3;}
  ctx.fillStyle='#cedbec';ctx.fillRect(x-.6,y,1.2,7);ctx.fillRect(x-2,y+3,4,1.2);
  for(let i=0;i<5;i++)drawDiamondStud(ctx,x,y+.8+i*1.2,.35);
  drawDiamondStud(ctx,x-1.4,y+3.5,.35);drawDiamondStud(ctx,x+1.4,y+3.5,.35);ctx.restore();
}
function drawGrillz(ctx,profile,style='iced'){
  ctx.save();if(profile){ctx.translate(19,-27);ctx.scale(.45,1);}else ctx.translate(0,-26);
  ctx.fillStyle='#895a61';ctx.beginPath();ctx.ellipse(0,0,7,3.3,0,0,Math.PI*2);ctx.fill();
  for(let row=0;row<2;row++)for(let i=0;i<6;i++){
    ctx.fillStyle=style==='gold'?'#dfb34a':style==='icedLower'&&row===0?'#f4e6d5':i%2?'#f7fbff':'#b8c9e0';
    ctx.fillRect(-5.8+i*1.9,-2+row*2,1.6,1.7);
    if(style!=='gold'&&(style!=='icedLower'||row===1)){ctx.fillStyle='#ffffff';ctx.fillRect(-5.4+i*1.9,-1.6+row*2,.4,.4);}
  }
  if(style==='gold'){ctx.strokeStyle='#f5d97d';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(-5,-1.6);ctx.lineTo(5,-1.6);ctx.stroke();ctx.restore();return;}
  const sparkleY=style==='icedLower'?.9:-1.5;
  ctx.strokeStyle='#ffffff';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(-4,sparkleY-1.3);ctx.lineTo(-4,sparkleY+1.3);ctx.moveTo(-5.3,sparkleY);ctx.lineTo(-2.7,sparkleY);ctx.stroke();ctx.restore();
}

function drawDenimWash(ctx,x,y,w,h){
  ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,5);ctx.clip();
  ctx.fillStyle='#c0d5e1';ctx.globalAlpha=.28;
  ctx.beginPath();ctx.ellipse(x+w*.55,y+h*.4,w*.34,h*.35,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=.12;ctx.strokeStyle='#e3edf3';ctx.lineWidth=.35;
  for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(x+3,y+3+i*3);ctx.lineTo(x+w-3,y+2+i*3);ctx.stroke();}
  ctx.globalAlpha=1;ctx.strokeStyle='#b5c5cb';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x+2,y+3);ctx.lineTo(x+2,y+h-2);ctx.stroke();ctx.restore();
}

function drawCamouflage(ctx, x, y, w, h) {
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 5); ctx.clip();
  ctx.fillStyle = '#636b47'; ctx.fillRect(x, y, w, h);
  const colors = ['#323c30', '#8e9268', '#a89a70', '#424d36'];
  for (let i = 0; i < 9; i++) {
    const px = x - 3 + (i * 11 % 24), py = y - 3 + (i * 7 % 32);
    ctx.fillStyle = colors[i % colors.length]; ctx.beginPath();
    ctx.moveTo(px, py); ctx.lineTo(px + 7, py - 1); ctx.lineTo(px + 10, py + 3);
    ctx.lineTo(px + 6, py + 5); ctx.lineTo(px + 5, py + 9);
    ctx.lineTo(px - 1, py + 7); ctx.lineTo(px - 4, py + 3); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawNeckTattoo(ctx, x, y, scale) {
  // Soft abstract ink across the neck; upper strokes tuck beneath the jaw.
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.strokeStyle = '#655a59'; ctx.lineWidth = 0.85; ctx.globalAlpha = 0.65;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.moveTo(-8, -3 + i * 3.4);
    ctx.bezierCurveTo(-4, 2 + i * 2.5, 3, -3 + i * 3, 8, 1 + i * 3.4); ctx.stroke();
  }
  ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.moveTo(-6, -4); ctx.quadraticCurveTo(-1, 5, -5, 14);
  ctx.moveTo(5, -4); ctx.quadraticCurveTo(1, 4, 6, 14); ctx.stroke();
  ctx.restore();
}

function drawBracelet(ctx, x, y, style='cuban') {
  if(style==='none')return;
  if(style==='tennis'||style==='duo'){
    ctx.save();ctx.translate(x,y);
    for(let row=0;row<(style==='duo'?2:1);row++)for(let i=0;i<7;i++){ctx.fillStyle='#dae7fa';ctx.beginPath();ctx.roundRect(-6+i*1.8,-2+row*3,1.5,2,style==='duo'&&row?0:.6);ctx.fill();}
    ctx.restore();return;
  }
  const gold=style==='cubanGold';
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = gold?'#b88b37':'#939eaf'; ctx.beginPath(); ctx.roundRect(-6, -2, 12, 5, 1.5); ctx.fill();
  for (let i = -4; i <= 4; i += 2) {
    ctx.fillStyle = gold?'#efd389':'#e8effb'; ctx.beginPath(); ctx.ellipse(i, 0.5, 1.4, 1.7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(i, 0, 0.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(1, -2); ctx.lineTo(5, -2); ctx.moveTo(3, -4); ctx.lineTo(3, 0); ctx.stroke();
  ctx.restore();
}

function drawShoes(ctx, shoes, x, y) {
  ctx.save(); ctx.translate(x, y);
  const box = (x, y, w, h, r, color) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  };
  if (shoes === 'boots') {
    box(1, -4, 15, 13, 2, '#b47e3d');
    box(0, 2, 26, 9, 3, '#cf9b55');
    box(1, -4, 14, 3, 1, '#4f3e30');
    box(-1, 9, 28, 4, 1, '#6b492c');
    ctx.strokeStyle = '#f2d3a0'; ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(10, i * 2); ctx.lineTo(16, i * 2 + 1); ctx.stroke();
    }
    for (let i = 1; i < 26; i += 4) box(i, 12, 2, 1.3, 0, '#30271f');
  } else if (shoes === 'nike') {
    box(0, 1, 27, 10, 5, '#f6f8fc'); box(0, 9, 27, 3, 1, '#d2d9e3');
    ctx.fillStyle = '#a6b2c3'; ctx.beginPath();
    ctx.moveTo(5, 5); ctx.quadraticCurveTo(4, 10, 11, 7);
    ctx.lineTo(23, 3); ctx.lineTo(10, 6); ctx.quadraticCurveTo(7, 7, 5, 5); ctx.fill();
    ctx.strokeStyle = '#bcc6d3'; ctx.lineWidth = 0.7;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(12 + i * 2, 2); ctx.lineTo(15 + i * 2, 3.5); ctx.stroke();
    }
  } else {
    box(0, 1, 26, 10, 5, '#14151e'); box(0, 9, 26, 3, 1, '#d9dce3');
    ctx.strokeStyle = '#9299a6'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(11, 4); ctx.lineTo(18, 4); ctx.stroke();
  }
  ctx.restore();
}

function drawDJProfile(ctx, { x, y, scale, phase, running, airborne, outfit, pants, shoes, hair, chain=true, earrings=true, pantsAccessory=true, haircut='low', necklace='luketa', earringStyle='stud', braceletStyle='cuban', grillz=false, grillzStyle='iced', pose = 'idle' }) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const { shirt, seam, hood, hairBase, hairLight, hairHighlight, hairShadow } = characterColors(outfit, hair);
  const hoodie = ['neon','orange','crown','vethood'].includes(outfit);
  const longSleeves = hoodie || outfit === 'jeweled' || outfit === 'blueflame';
  const box = (x, y, w, h, r, color) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  };
  const oval = (x, y, rx, ry, color) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  };
  const line = (points, color, width = 1) => {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
  };
  const swing = running ? Math.sin(phase * 0.25) : 0;
  [-1, 1].forEach(side => {
    ctx.save(); ctx.translate(side * 4, 20);
    ctx.rotate(airborne ? side * 0.55 : side * swing * 0.55);
    box(pants==='light'?-12:-11, -1, pants==='light'?26:23, 31, 5, pants==='light'?(side<0?'#83a7bf':'#9bbbd0'):side < 0 ? '#1e2028' : '#30333c');
    if(pants==='light')drawDenimWash(ctx,-12,-1,26,31);
    if (pants === 'camo') drawCamouflage(ctx, -11, -1, 23, 31);
    line([[-7, 4], [-8, 24]], '#5c606a', 0.8);
    line([[1, 7], [8, 8]], '#545861', 1);
    for (let i = 0; pants === 'sparkle' && i < 7; i++) {
      const px = -6 + (i * 5 % 14), py = 3 + (i * 7 % 22);
      line([[px - 0.8, py], [px + 0.8, py]], '#dce7f8', 0.7);
      if (i % 3 === 0) line([[px, py - 1.5], [px, py + 1.5]], '#ffffff', 0.7);
    }
    drawShoes(ctx, shoes, -10, 22); ctx.restore();
  });
  // Right arm on the far side: bracelet follows that wrist in profile as well.
  ctx.save(); ctx.translate(8, -7); ctx.rotate(airborne ? -0.7 : -0.45 + swing * 0.5);
  box(-4, 6, 9, 24, 4, longSleeves ? shirt : '#cf997e');
  box(-6, -3, 12, 16, 4, shirt);
  if(outfit==='jeweled')drawJeweledFabric(ctx,-4,1,8,24);
  drawPhotoSleeve(ctx,outfit);
  oval(0, 29, 5, 6, '#cf997e');
  drawBracelet(ctx, 0, 25, braceletStyle);
  ctx.restore();
  box(-17, -15, 34, 42, 9, shirt);
  if(outfit==='jeweled')drawJeweledFabric(ctx,-16,-13,32,38);
  drawPhotoPrint(ctx,outfit,-15,-10,29,34);
  line([[-13, 2], [-13, 24]], seam);
  line([[-13, 25], [13, 25]], seam);
  if(pantsAccessory){ctx.strokeStyle='#aaa9b5';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(-9,27,5,10,-.2,0,Math.PI);ctx.stroke();}
  // Abstract ink stays on the neck and extends beneath the jaw.
  box(-7, -27, 17, 22, 4, '#d6a084');
  drawNeckTattoo(ctx, 1, -22, 0.7);
  line([[-5, -23], [-2, -16], [-5, -10]], '#595057', 1.2);
  if (outfit === 'black') line([[-4, -10], [6, -4], [12, -10]], seam, 2);
  if (outfit === 'jeweled') line([[-6,-9],[3,-6],[12,-10]],seam,2);
  if (outfit === 'white') line([[-6, -8], [3, -5], [12, -9]], seam, 1.2);
  if (hoodie) {
    box(-19, -17, 13, 17, 6, hood);
    line([[-16, -14], [-14, -4], [-5, -3]], seam, 1.5);
  }
  if(chain)drawNecklace(ctx,necklace,true);
  // Left arm faces the viewer in a right-facing profile.
  ctx.save(); ctx.translate(-7, -7); ctx.rotate(pose === 'celebrate' ? -1.65 : airborne ? -0.65 : -swing * 0.5);
  box(-5, 6, 10, 24, 4, longSleeves ? shirt : '#dfac8d');
  box(-7, -3, 14, 16, 4, shirt); line([[-6, 11], [6, 11]], seam);
  if(outfit==='jeweled'){drawJeweledFabric(ctx,-5,1,10,24);line([[-4,26],[4,26]],seam,2);}
  drawPhotoSleeve(ctx,outfit);
  if (!longSleeves) line([[-3, 16], [2, 19], [-2, 23]], '#6a6369', 1.2);
  oval(0, 29, 5, 6, '#dfac8d');
  ctx.restore();
  // Side silhouette with short crop, forehead, defined nose, lips and rounded chin.
  const skin = ctx.createLinearGradient(-18, -40, 25, -30);
  skin.addColorStop(0, '#cb9479'); skin.addColorStop(0.6, '#e8ba9b'); skin.addColorStop(1, '#eec6a7');
  ctx.fillStyle = skin; ctx.beginPath();
  ctx.moveTo(-16, -43); ctx.bezierCurveTo(-20, -66, 15, -67, 18, -51);
  ctx.lineTo(18, -43); ctx.lineTo(25, -34); ctx.quadraticCurveTo(26, -32, 19, -32);
  ctx.lineTo(19, -29); ctx.lineTo(22, -27); ctx.lineTo(20, -24);
  ctx.quadraticCurveTo(19, -17, 10, -17); ctx.quadraticCurveTo(-1, -17, -8, -27);
  ctx.lineTo(-15, -33); ctx.closePath(); ctx.fill();
  // Tight blond crop follows the skull, with a faded side above the ear.
  ctx.fillStyle = hairBase; ctx.beginPath();
  ctx.moveTo(-17, -40); ctx.bezierCurveTo(-23, -67, 14, -70, 18, -52);
  ctx.lineTo(13, -51); ctx.lineTo(7, -47); ctx.lineTo(-3, -42); ctx.lineTo(-7, -35);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = hairLight; ctx.beginPath();
  ctx.moveTo(-16, -52); ctx.bezierCurveTo(-16, -66, 10, -68, 17, -54);
  ctx.lineTo(6, -54); ctx.lineTo(-10, -49); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 18; i++) {
    const px = -12 + (i * 7 % 25), py = -59 + (i * 3 % 7);
    line([[px, py + 1.5], [px + 1.2, py]], i % 3 ? hairHighlight : hairShadow, 0.8);
  }
  if(haircut==='spiky')drawSpikedHair(ctx,hair,true);
  oval(-6, -36, 4.8, 6.4, '#d29a80');
  line([[-8, -38], [-5, -40], [-3, -36], [-6, -33]], '#ae7b6b', 0.9);
  if(earrings){if(earringStyle==='cross'||earringStyle==='hoopcross')drawCrossEarring(ctx,-5,-32,earringStyle==='hoopcross');else drawDiamondStud(ctx,-5,-31,1.6);}
  line([[6, -45], [12, -46], [16, -44]], '#75624f', 2.3);
  oval(12, -40, 4.1, 2.2, '#f1e4d4'); oval(14, -40, 1.8, 2, '#88946b');
  oval(14.5, -40, 0.9, 1.4, '#303731'); oval(15, -40.7, 0.6, 0.6, '#ffffff');
  line([[8, -41], [12, -42], [16, -41]], '#826a57', 0.8);
  line([[18, -33], [21, -32.5]], '#a77564', 0.9);
  line([[17, -28], [21, -27], [18, -25.5]], '#b77978', 1.5);
  line([[17, -23], [15, -19], [9, -19]], '#796753', 2.2);
  if(grillz)drawGrillz(ctx,true,grillzStyle);
  if (pose === 'hurt') {
    line([[8, -43], [12, -39], [16, -43]], '#675348', 1.4);
    oval(19, -44, 1.4, 2.7, '#a6d5e6');
  }
  ctx.restore();
}

function drawDJ(ctx, { x, y, scale = 1, phase = 0, running = false, airborne = false, outfit = 'black', pants = 'sparkle', shoes = 'sneakers', hair = 'blond', view = 'front', chain=true, earrings=true, pantsAccessory=true, haircut='low', necklace='luketa', earringStyle='stud', braceletStyle='cuban', grillz=false, grillzStyle='iced', pose = 'idle' }) {
  if (view === 'profile') return drawDJProfile(ctx, { x, y, scale, phase, running, airborne, outfit, pants, shoes, hair, chain, earrings, pantsAccessory, haircut, necklace, earringStyle, braceletStyle, grillz, grillzStyle, pose });
  const { shirt, seam, hood, hairBase, hairLight, hairHighlight, hairShadow } = characterColors(outfit, hair);
  const hoodie = ['neon','orange','crown','vethood'].includes(outfit);
  const longSleeves = hoodie || outfit === 'jeweled' || outfit === 'blueflame';
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const swing = running ? Math.sin(phase * 0.25) : Math.sin(phase * 0.035) * 0.08;
  const shape = (x, y, w, h, r, color) => {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  };
  const oval = (x, y, rx, ry, color) => {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  };
  const line = (points, color, width = 1) => {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
  };
  const sparkle = (x, y, size = 1) => {
    line([[x - size, y], [x + size, y]], '#ffffff', 0.65);
    line([[x, y - size], [x, y + size]], '#ecf5ff', 0.65);
  };
  // Oversized black denim with a wide leg and subtle rhinestones.
  [-1, 1].forEach(side => {
    ctx.save(); ctx.translate(side * 10, 21);
    ctx.rotate(airborne ? side * -0.35 : swing * side * 0.35);
    shape(pants==='light'?-12:-11, -2, pants==='light'?26:23, 31, 5, pants==='light'?(side<0?'#83a7bf':'#9bbbd0'):side < 0 ? '#20222a' : '#30333c');
    if(pants==='light')drawDenimWash(ctx,-12,-2,26,31);
    if (pants === 'camo') drawCamouflage(ctx, -11, -2, 23, 31);
    line([[2, 5], [1, 22]], '#626670', 0.8);
    line([[-6, 1], [-6, 23]], pants==='light'?'#799fb8':'#14161d', 0.8);
    line([[-4, 5], [4, 6]], '#484c57', 1.5);
    for (let i = 0; pants === 'sparkle' && i < 9; i++) {
      const dx = -5 + (i * 7 % 12), dy = 2 + (i * 11 % 21);
      oval(dx, dy, 0.65, 0.65, '#cbd7e5');
      if (i % 3 === 0) sparkle(dx, dy, 1.4);
    }
    drawShoes(ctx, shoes, -10, 22);
    ctx.restore();
  });
  // Plain black short-sleeve polo, with a folded collar and button placket.
  shape(-23, -15, 46, 42, 10, shirt);
  if(outfit==='jeweled')drawJeweledFabric(ctx,-21,-13,42,38);
  drawPhotoPrint(ctx,outfit,-20,-10,40,35);
  line([[-18, 1], [-18, 22]], seam, 1);
  line([[18, 1], [18, 22]], '#34353e', 1);
  line([[-18, 25], [18, 25]], seam, 1);
  if(pantsAccessory){
  // Wallet chain.
  ctx.strokeStyle = '#aaa9b5'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(15, 25, 7, 11, -0.25, 0, Math.PI); ctx.stroke();
  }
  [-1, 1].forEach(side => {
    ctx.save(); ctx.translate(side * 22, -8);
    ctx.rotate(pose === 'celebrate' && side > 0 ? -2.1 : airborne ? side * -0.65 : -swing * side * 0.38);
    shape(-5, 7, 10, 22, 4, longSleeves ? shirt : '#dfac8d');
    shape(-7, -2, 14, 15, 4, shirt);
    if(outfit==='jeweled'){drawJeweledFabric(ctx,-5,1,10,24);line([[-4,26],[4,26]],seam,2);}
    line([[-6, 11], [6, 11]], seam);
    // Stylized ink on the visible forearms.
    drawPhotoSleeve(ctx,outfit);
  if (!longSleeves) line([[-3, 16], [2, 18], [-2, 21], [3, 23]], '#777177', 1.1);
    oval(0, 28, 5.7, 6.2, '#dfac8d');
    line([[-3, 26], [1, 30], [3, 26]], '#67646b', 1.3);
    // Front view: his anatomical right wrist is on the viewer's left.
    if (side < 0) drawBracelet(ctx, 0, 25, braceletStyle);
    ctx.restore();
  });
  // Neck tattoos remain visible above the collar.
  shape(-9, -25, 18, 20, 4, '#d6a084');
  drawNeckTattoo(ctx, 0, -20, 0.85);
  if (outfit === 'black') {
    shape(-2, -8, 4, 14, 1, '#34353c');
    line([[-11, -11], [-3, -5], [-7, -1], [-14, -8]], '#666771', 1.3);
    line([[11, -11], [3, -5], [7, -1], [14, -8]], '#666771', 1.3);
    oval(0, -2, 0.65, 0.65, '#b7bec9'); oval(0, 2, 0.65, 0.65, '#b7bec9');
  } else if (hoodie) {
    line([[-13, -13], [-17, -5], [-7, -2], [0, -5], [7, -2], [17, -5], [13, -13]], seam, 2.5);
    line([[-5, -2], [-6, 9]], '#e8f8be', 1); line([[5, -2], [6, 9]], '#e8f8be', 1);
  } else {
    // Crew neck for the plain white shirt and the jeweled green sweatshirt.
    ctx.strokeStyle = seam; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(0, -6, 10, 3, 0, 0, Math.PI); ctx.stroke();
  }
  if(chain)drawNecklace(ctx,necklace,false);
  // Ears and softly shaded face: a short blond crop, never a fringe.
  oval(-21, -36, 3.4, 6, '#cf957c'); oval(21, -36, 3.4, 6, '#e4b398');
  const skin = ctx.createLinearGradient(-20, -40, 21, -28);
  skin.addColorStop(0, '#c98e76'); skin.addColorStop(0.55, '#f0c4a4'); skin.addColorStop(1, '#dca68b');
  ctx.fillStyle = skin; ctx.beginPath();
  ctx.moveTo(-21, -46); ctx.bezierCurveTo(-23, -66, 22, -68, 21, -46);
  ctx.lineTo(20, -31); ctx.bezierCurveTo(18, -19, 10, -16, 0, -16);
  ctx.bezierCurveTo(-10, -16, -18, -21, -20, -31); ctx.closePath(); ctx.fill();
  shape(-21, -64, 42, 17, [17, 17, 3, 3], hairBase);
  shape(-18, -65, 36, 12, [14, 14, 2, 2], hairLight);
  for (let i = 0; i < 24; i++) {
    const x = -15 + (i * 7 % 30), y = -60 + (i * 3 % 8);
    line([[x, y + 2], [x + 1.6, y]], i % 3 ? hairHighlight : hairShadow, 0.9);
  }
  if(haircut==='spiky')drawSpikedHair(ctx,hair,false);
  // Strong brows, green irises, small highlights.
  [-1, 1].forEach(side => {
    const ex = side * 8.5;
    line([[ex - 5, -44], [ex, -46], [ex + 4, -44.5]], '#75624f', 2.8);
    oval(ex, -39.8, 5.3, 2.4, '#f5e9dc');
    oval(ex + 0.7, -39.5, 2.4, 2.2, '#8a956f');
    oval(ex + 1, -39.4, 1.2, 1.7, '#333936');
    oval(ex + 1.5, -40.6, 0.8, 0.8, '#ffffff');
    line([[ex - 4.5, -41], [ex, -42], [ex + 4, -40.9]], '#846b5a', 0.9);
  });
  line([[0, -38], [-2.4, -32], [0, -30.5], [3.4, -32]], '#bf876f', 1.1);
  oval(-2.8, -31.6, 1.1, 0.65, '#a77364'); oval(3.2, -31.6, 1.1, 0.65, '#a77364');
  // Goatee, understated smile and silver studs.
  ctx.strokeStyle = '#726455'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(0, -29, 10, 0.22, Math.PI - 0.22); ctx.stroke();
  oval(0, -21.5, 4, 1.7, '#7c6955');
  oval(0, -26, 6.3, 2.5, '#bb7d7c');
  line([[-6, -26.5], [-2, -27], [0, -26.4], [2, -27], [6, -26.5]], '#955e60', 0.7);
  line([[-3, -24.7], [3, -24.7]], '#d99c96', 0.8);
  if(grillz)drawGrillz(ctx,false,grillzStyle);
  if (pose === 'celebrate') {
    ctx.strokeStyle = '#8f6064'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, -29, 6, 0.2, Math.PI - 0.2); ctx.stroke();
  }
  if (pose === 'hurt') {
    line([[-13, -42], [-8, -38], [-4, -42]], '#675348', 1.4);
    line([[4, -42], [8, -38], [13, -42]], '#675348', 1.4);
    oval(20, -43, 1.5, 2.7, '#a6d5e6');
  }
  if(earrings && (earringStyle==='cross'||earringStyle==='hoopcross')){drawCrossEarring(ctx,-21,-33,earringStyle==='hoopcross');drawCrossEarring(ctx,21,-33,earringStyle==='hoopcross');}
  if(earrings && earringStyle==='stud'){
  drawDiamondStud(ctx,-21,-33,1.6);drawDiamondStud(ctx,21,-33,1.8);
  }
  ctx.restore();
}
