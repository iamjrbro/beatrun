import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const sources=['character.js','stage-art.js','game.js','shop.js','soundtrack.js'].map(file=>readFileSync(new URL('../'+file,import.meta.url),'utf8'));
function fixture({width=390,height=844,blockedStorage=false,cachedArt=false}={}) {
  const events={},elements=new Map(),storage=new Map([['beat-runner-character',JSON.stringify({hair:'pink',outfit:'white',view:'front'})]]);
  const gradient={addColorStop(){}};
  const context=new Proxy({}, {get:(target,key)=>key in target?target[key]:key==='createLinearGradient'?()=>gradient:()=>{},set:(target,key,value)=>{target[key]=value;return true;}});
  function element(id) {
    if(!elements.has(id)) elements.set(id,{tagName:id==='game'?'CANVAS':'BUTTON',textContent:'',innerHTML:'',hidden:false,value:0,volume:.24,attributes:{},
      getContext:()=>context,addEventListener:(type,fn)=>{events[id+':'+type]=fn;},play:()=>Promise.resolve(),pause(){},focus(){},
      setAttribute(key,value){this.attributes[key]=value;},getBoundingClientRect:()=>({x:20,y:150,width:300,height:210,top:150,bottom:360})});
    return elements.get(id);
  }
  const document={hidden:false,getElementById:element,addEventListener:(type,fn)=>{events[type]=fn;}};
  let rngSeed=123456;const fixtureMath=Object.create(Math);fixtureMath.random=()=>{rngSeed=(rngSeed*1664525+1013904223)>>>0;return rngSeed/4294967296;};
  const scope=vm.createContext({console,Math:fixtureMath,URL,setTimeout,clearTimeout,performance:{now:()=>0},document,
    window:{innerWidth:width,innerHeight:height,matchMedia:()=>({matches:false}),addEventListener:(type,fn)=>{events[type]=fn;}},
    localStorage:{getItem:key=>{if(blockedStorage)throw Error('blocked');return storage.get(key)??null;},setItem:(key,value)=>{if(blockedStorage)throw Error('blocked');storage.set(key,value);}},
    OffscreenCanvas:cachedArt?class {constructor(w,h){this.width=w;this.height=h;}getContext(){return context;}}:undefined,
    CanvasRenderingContext2D:function(){},requestAnimationFrame(){}});
  for(const source of sources) vm.runInContext(source,scope);
  const run=code=>vm.runInContext(code,scope);
  const quiet=()=>run("world.tutorial=false;world.nextObstacle=Infinity;world.nextRecord=Infinity;world.nextBonus=Infinity;");
  return {run,events,element,storage,document,quiet};
}
{
  const {run,events,element,storage}=fixture();
  assert.equal(run('characterChoice.hair'),'blond'); assert.equal(run('characterChoice.view'),'profile');
  assert.equal(run('characterChoice.outfit'),'white');
  events['hair-pink:click']();events['pants-camo:click']();events['outfit-orange:click']();events['shoes-nike:click']();
  assert.deepEqual(JSON.parse(storage.get('beat-runner-character')),{outfit:'orange',hair:'pink',pants:'camo',shoes:'nike',view:'profile'});
  assert.equal(element('hair-pink').attributes['aria-pressed'],'true');
  run("selectCharacter('hair','invalid');");assert.equal(run('characterChoice.hair'),'pink');
  run(`for(const outfit of choiceOptions.outfit) for(const hair of choiceOptions.hair) for(const pants of choiceOptions.pants)
    for(const shoes of choiceOptions.shoes) for(const view of choiceOptions.view) for(const pose of ['idle','celebrate','hurt','land'])
    drawDJ(ctx,{x:0,y:0,outfit,hair,pants,shoes,view,pose,phase:5,running:true});`);
  events['play:click']();assert.equal(run('world.lives'),3);assert.equal(element('menu-screen').hidden,true);
  events['sound:click']();assert.equal(element('music').muted,true);assert.equal(element('sound').textContent,'SOM OFF');
}
{
  const f=fixture(); f.events['play:click']();f.quiet();
  f.run('doJump();update();doJump();doJump();');assert.equal(f.run('player.jumpCount'),2);
  f.run('for(let i=0;i<200;i++)update();');assert.equal(f.run('player.onGround'),true);assert.equal(f.run('player.jumpCount'),0);
  f.run('doJump();update();');const before=f.run('getGround()-player.y');
  f.run("records=[{x:220,y:getFloor()-120,lift:120,r:13}];obstacles=[{x:250,y:getBeatY(36),w:48,h:36,type:'case'}];window.innerHeight=600;");
  f.events.resize();assert.equal(f.run('getGround()-player.y'),before);assert.equal(f.run('records[0].y'),f.run('getFloor()-120'));
}
// Regression: one consistent jump clears a hazard even at the slow opening pace.
let scenarios=0;
for(const width of [390,1024])for(const distanceRun of [0,9000,30000])for(const size of [34,48])for(const gap of [60,100,150]) {
  const f=fixture({width});f.events['play:click']();f.quiet();
  f.run(`world.distance=${distanceRun};obstacles=[{x:player.x+${gap},y:getBeatY(${size}),w:${size},h:${size},type:'case',passed:false}];doJump();
    for(let i=0;i<220;i++){update();if(player.onGround)break;}`);
  assert.equal(f.run('world.hits'),0,`clearance width=${width} run=${distanceRun} size=${size} gap=${gap}`);
  assert.equal(f.run('player.onGround'),true);assert.ok(f.run('obstacles.length===0||obstacles[0].x+obstacles[0].w<player.x-16'));
  scenarios++;
}
{
  const f=fixture();f.events['play:click']();f.quiet();
  const addVinyl="records.push({x:player.x,y:player.y,lift:getFloor()-player.y,r:13});update();";
  f.run(addVinyl);assert.equal(f.run('world.vinyls'),1);assert.equal(f.run('world.lives'),3);assert.equal(f.run('score'),15);
  f.run('update();');assert.equal(f.run('score'),15,'a record is collected only once');
  assert.ok(JSON.parse(f.storage.get('beat-runner-achievements')).includes('record'));
  for(let i=0;i<7;i++)f.run(addVinyl);
  assert.equal(f.run('world.drops'),1);assert.equal(f.run('world.dropFrames'),480);assert.equal(f.run('world.energy'),0);
  f.run("obstacles=[{x:player.x,y:getBeatY(48),w:42,h:48,type:'speaker'}];update();");
  assert.equal(f.run('world.lives'),3,'drop protects against contact');assert.equal(f.run('obstacles.length'),0);
  f.run('for(let i=0;i<479;i++)update();');assert.equal(f.run('world.dropFrames'),0,'protection expires after 8 seconds');
  f.run("obstacles=[{x:player.x,y:getBeatY(48),w:42,h:48,type:'speaker'}];update();");assert.equal(f.run('world.lives'),2);
  f.run("obstacles=[{x:player.x,y:getBeatY(36),w:48,h:36,type:'case'}];update();");assert.equal(f.run('world.lives'),2,'recovery period prevents repeated damage');
  f.run("world.invulnerable=0;obstacles=[{x:player.x,y:getBeatY(20),w:54,h:20,type:'cable'}];update();");assert.equal(f.run('world.lives'),1);
  f.run("world.invulnerable=0;obstacles=[{x:player.x,y:getBeatY(48),w:42,h:48,type:'speaker'}];update();");assert.equal(f.run('STATE'),'dead');
  assert.equal(JSON.parse(f.storage.get('beat-runner-best')),f.run('score'));
  f.events['retry:click']();assert.equal(f.run('world.lives'),3);assert.equal(f.run('world.vinyls'),0);assert.equal(f.run('world.dropFrames'),0);
  assert.ok(f.run("earned.has('record')&&earned.has('drop')"),'achievements survive retry');
}
{
  const f=fixture();f.events['play:click']();f.quiet();
  f.run('world.distance=4199;update();');assert.equal(f.run('getStage().id'),'party');assert.equal(f.run('level'),3);
  f.run('world.distance=10499;update();');assert.equal(f.run('getStage().id'),'festival');assert.equal(f.run('level'),4);
  f.run('world.elapsed=89.99;update();');assert.ok(f.run("earned.has('clean')"));
  f.events['change-look:click']();assert.equal(f.run('STATE'),'start');assert.equal(f.element('menu-screen').hidden,false);
}
{
  const f=fixture();f.events['play:click']();
  f.run('for(let i=0;i<470;i++)update();');assert.equal(f.run('obstacles.length'),0,'opening training gives time to learn');
  f.run('world.dodged=1;world.vinyls=1;world.jumps=1;update();');assert.equal(f.run('world.tutorial'),false);
  assert.equal(JSON.parse(f.storage.get('beat-runner-training-v2')),true);
  f.events['retry:click']();assert.equal(f.run('world.tutorial'),false);
  f.events['replay-tutorial:click']();assert.equal(f.run('world.tutorial'),true);
}
// Jump trails must be out of standing reach, and a drop must not refill itself.
{
  const f=fixture();f.events['play:click']();f.quiet();
  assert.equal(f.run('recordTouchesPlayer({x:player.x,y:getFloor()-150,r:13},playerBounds())'),false);
  f.run('world.energy=100;activateDrop();');
  for(let i=0;i<8;i++)f.run('records.push({x:player.x,y:player.y,lift:getFloor()-player.y,r:13});update();');
  assert.equal(f.run('world.energy'),0);assert.equal(f.run('world.drops'),1);
  f.run("const renderer = drawDJ; let dropLook; drawDJ = (ctx, look) => {dropLook=look;}; drawPlayer(); drawDJ=renderer;");
  assert.equal(f.run('dropLook.view'),'profile','drop keeps the selected running angle');
  assert.equal(f.run('dropLook.running'),true,'runner keeps moving naturally during a drop');
  assert.notEqual(f.run('dropLook.pose'),'perform');
  assert.ok(f.run('score')>=240,'collecting during a drop rewards points');
  f.run('for(let i=0;i<480;i++)update();');assert.equal(f.run('world.dropFrames'),0);assert.equal(f.run('world.drops'),1);
}
{
  const f=fixture();f.events['play:click']();
  f.run("for(let i=0;i<12000&&STATE==='playing';i++)update();");
  assert.equal(f.run('STATE'),'dead','idle ground collecting cannot sustain an automatic endless shield');
}
// Same fixed-step simulation at both refresh rates; no extra per-render update.
const pacing=[];
for(const fps of [20,30,60,144]) {
  const f=fixture();f.events['play:click']();f.quiet();
  for(let i=0;i<=fps*2;i++) f.run(`gameLoop(${i*1000/fps});`);
  assert.equal(f.run('frame'),120);pacing.push(f.run('world.distance'));
  const before=f.run('world.distance');f.events['pause:click']();f.run('gameLoop(90000);');assert.equal(f.run('world.distance'),before);
  f.events['resume:click']();f.run('gameLoop(100000);');assert.equal(f.run('world.distance'),before,'resume never fast-forwards the set');
  f.document.hidden=true;f.events.visibilitychange();assert.equal(f.run('STATE'),'paused');
}
assert.ok(pacing.every(value=>value===pacing[0]));
{
  const f=fixture({cachedArt:true});f.events['play:click']();f.quiet();
  assert.equal(f.run('getRunSpeed()'),4.2);
  f.run('gameLoop(0);const firstCache=backdropSurface;gameLoop(8);');
  assert.equal(f.run('backdropSurface===firstCache'),true,'static artwork reused between renders');
  assert.equal(f.run('frame'),0,'intermediate renders never advance physics');
  f.run('const originalDJ=drawDJ;let visualPhase;drawDJ=(ctx,look)=>{visualPhase=look.phase;};drawPlayer(.5);drawDJ=originalDJ;');
  assert.ok(f.run('visualPhase>player.runFrame'),'stride renders between simulation steps');
  f.run('drawRecord(ctx,{x:200,y:200,r:13},0,false);const recordCache=vinylSurface;drawRecord(ctx,{x:300,y:200,r:13},1,false);');
  assert.equal(f.run('vinylSurface===recordCache'),true,'record artwork reused');
  f.run('world.distance=5000;gameLoop(17);');assert.equal(f.run('backdropSurface===firstCache'),false,'new stage refreshes artwork');
  f.run('const offsets=[];ctx.fillRect=(...args)=>offsets.push(args);drawStageObstacle(ctx,{x:100,y:200,w:40,h:30,type:"cable"},2);');
  assert.equal(f.run('offsets[0][0]'),102,'hazards follow interpolated world movement');
}

{
  const f=fixture({blockedStorage:true});f.events['play:click']();f.quiet();f.run('unlock("record");update();');
  assert.equal(f.run('STATE'),'playing','game works when browser storage is unavailable');
  f.events['change-look:click']();f.run('gameLoop(0);');
}

// Special pickups apply once, remain independent from vinyl energy, and reset on retry.
{
  const f=fixture({cachedArt:true});f.events['play:click']();f.quiet();
  for(const type of ['usb','chain','backstage','heart','energy','lean'])f.run(`drawBonus(ctx,{type:'${type}',x:200,y:200},.5);`);
  assert.equal(f.run('bonusSprites.size'),6);
  f.run("bonuses=[{type:'usb',x:player.x,y:player.y,lift:55,r:18}];update();");
  assert.equal(f.run('score'),100);assert.equal(f.run('bonuses.length'),0);
  f.run('update();');assert.equal(f.run('score'),100);
  f.run("collectBonus({type:'chain',x:0,y:0});");assert.equal(f.run('score'),250);
  assert.equal(f.run('world.vinyls'),0);assert.equal(f.run('world.energy'),0);
  f.run("collectBonus({type:'backstage',x:0,y:0});hitObstacle({x:0,y:0});");
  assert.equal(f.run('world.shield'),0);assert.equal(f.run('world.lives'),3);assert.equal(f.run('world.hits'),0);
  f.run("world.invulnerable=0;hitObstacle({x:0,y:0});");assert.equal(f.run('world.lives'),2);
  f.run("collectBonus({type:'heart',x:0,y:0});collectBonus({type:'heart',x:0,y:0});");
  assert.equal(f.run('world.lives'),3,'hearts cannot exceed three lives');
  f.run("world.lives=2;world.bonusSerial=0;const kinds=[];for(let i=0;i<4;i++)kinds.push(spawnBonus().type);");
  assert.ok(f.run("kinds.every(type=>['usb','chain','backstage','heart','energy','lean'].includes(type))"));
  f.run('window.innerHeight=600;');f.events.resize();assert.equal(f.run('bonuses[0].y'),f.run('getFloor()-bonuses[0].lift'));
  f.run("collectBonus({type:'backstage',x:0,y:0});world.dropFrames=1;hitObstacle({x:0,y:0});");
  assert.equal(f.run('world.shield'),1,'drop does not spend the backstage protection');
  f.events['retry:click']();assert.equal(f.run('bonuses.length'),0);assert.equal(f.run('world.shield'),0);
  f.run('world.nextBonus=0;world.elapsed=0;update();');assert.equal(f.run('bonuses.length'),0,'training opening stays simple');
  f.run('world.tutorial=false;update();');assert.equal(f.run('bonuses.length'),1);
}


// Missions reward once, perfect jumps require an actual near-clearance, and chill scores stay separate.
{
  const f=fixture({cachedArt:true});f.events['play:click']();f.quiet();
  f.run("world.missions=[{id:'usb',label:'Encontre 2 sets secretos',target:2,done:false}];collectBonus({type:'usb',x:0,y:0});updateMissions();");
  assert.equal(f.run('score'),100);assert.equal(f.run('world.missions[0].done'),false);
  f.run("collectBonus({type:'usb',x:0,y:0});updateMissions();updateMissions();");
  assert.equal(f.run('score'),275,'mission reward applies exactly once');
  f.run("const near={};player.onGround=false;trackClearance(near,{x:100,y:100,w:32,h:100},{x:100,y:210,w:40,h:36});passObstacle(near);passObstacle(near);");
  assert.equal(f.run('world.perfect'),1);assert.equal(f.run('world.clean'),1);assert.equal(f.run('score'),305);
  f.run("const far={};trackClearance(far,{x:100,y:50,w:32,h:100},{x:100,y:210,w:40,h:36});passObstacle(far);");
  assert.equal(f.run('world.perfect'),1,'high safe jump is not a near miss');
  f.run('world.invulnerable=0;hitObstacle({x:0,y:0});');assert.equal(f.run('world.clean'),0);
  f.run("renderStageFrame(ctx,{w:390,h:844,floor:760,stage:STAGES[1],time:2,scroll:400,pulse:1,drop:false,reducedMotion:false,crowd:.5});");
  f.run("drawCrowd(ctx,{w:390,floor:760,stage:STAGES[2],time:2,crowd:1,reducedMotion:true});");
  f.run("world.lives=1;collectBonus({type:'heart',x:0,y:0});const firstLove=world.announcement;collectBonus({type:'heart',x:0,y:0});");
  assert.notEqual(f.run('world.announcement'),f.run('firstLove'),'hearts rotate personal messages');
  f.events['change-look:click']();f.events['mode-chill:click']();f.events['play:click']();f.quiet();
  assert.equal(f.run('world.mode'),'chill');assert.equal(f.element('lives').textContent,'∞');
  f.run('for(let i=0;i<8;i++){world.invulnerable=0;hitObstacle({x:0,y:0});}');
  assert.equal(f.run('STATE'),'playing');assert.equal(f.run('world.lives'),3);
  f.run('score=9999;');f.events['pause:click']();f.events['end-set:click']();
  assert.equal(f.run('STATE'),'dead');assert.equal(f.element('pause-screen').hidden,true);
  assert.equal(JSON.parse(f.storage.get('beat-runner-chill-best')),9999);
  assert.equal(f.storage.has('beat-runner-best'),false,'chill cannot replace challenge record');
  assert.ok(f.element('result-details').textContent.includes('sets secretos'));
  assert.equal(f.element('result-heading').textContent,'Seu som, no seu tempo.');
  f.events['retry:click']();assert.equal(f.run('world.mode'),'chill');assert.equal(f.run('world.usb'),0);
  assert.equal(f.run('world.missions.length'),3);assert.equal(f.run('new Set(world.missions.map(m=>m.id)).size'),3);
  f.events['change-look:click']();f.events['mode-challenge:click']();f.events['play:click']();
  assert.equal(f.run('world.mode'),'challenge');assert.equal(f.run('world.lives'),3);
}


// The full twelve-scene tour keeps ordered milestones, bounded art caching and a correct twelfth-set label.
{
  for(const [width,height]of [[390,844],[1280,720]]){
    const f=fixture({width,height,cachedArt:true});f.events['play:click']();f.quiet();
    assert.equal(f.run('STAGES.length'),12);assert.equal(f.run('new Set(STAGES.map(s=>s.id)).size'),12);
    for(let i=0;i<12;i++){
      if(i>0){f.run(`world.distance=STAGES[${i}].at;update();`);assert.equal(f.run('world.stageIndex'),i);}
      assert.equal(f.run('getStage().id'),f.run(`STAGES[${i}].id`));
      f.run('updateHud();gameLoop(0);var cachedStage=backdropSurface;gameLoop(8);');
      assert.equal(f.run('backdropSurface===cachedStage'),true);
      f.run('renderStageFrame(ctx,{w:canvas.width,h:canvas.height,floor:getFloor(),stage:getStage(),time:3,scroll:world.distance,pulse:1,drop:true,reducedMotion:true,crowd:.5});');
    }
    assert.equal(f.element('stage-label').textContent,'SET 12 · AMANHECER');
    assert.ok(f.run("earned.has('dawn')"));
    assert.ok(f.run('STAGES.every((s,i)=>s.volume>=0&&s.volume<=.42&&(i===0||s.at>STAGES[i-1].at))'));
    assert.equal(f.run('getRunSpeed()'),7.2,'long tour keeps the existing speed cap');
    f.run('world.distance+=99999;update();');assert.equal(f.run('world.stageIndex'),11);
  }
}

// Old saved front-facing choices must not replace the default side-on run.
// Collecting, dropping and stage transitions keep the natural running pose.
{
  const f=fixture();
  assert.equal(f.element('view-profile').attributes['aria-pressed'],'true');
  f.run('const actualDrawer=drawDJ;var drawnLook;drawDJ=(ctx,look)=>{drawnLook=look;};drawMenuPortrait();');
  assert.equal(f.run('drawnLook.view'),'front','selection portrait stays front-facing');
  f.events['play:click']();f.quiet();
  f.run('drawPlayer();');assert.equal(f.run('drawnLook.view'),'profile');
  for(let i=0;i<8;i++){
    f.run('collectRecord({x:0,y:0});drawPlayer();');
    assert.equal(f.run('drawnLook.pose'),'idle','vinyls and automatic drop never raise the arm');
    assert.equal(f.run('drawnLook.running'),true);
  }
  assert.equal(f.run('world.drops'),1);
  for(const type of ['usb','chain','backstage','heart']){
    f.run(`collectBonus({type:'${type}',x:0,y:0});drawPlayer();`);
    assert.equal(f.run('drawnLook.pose'),'idle');assert.equal(f.run('drawnLook.view'),'profile');
  }
  f.run('world.distance=STAGES[1].at;update();drawPlayer();');assert.equal(f.run('drawnLook.pose'),'idle');
  f.events['pause:click']();f.events['resume:click']();f.run('drawPlayer();');assert.equal(f.run('drawnLook.view'),'profile');
  f.run('drawDJ=actualDrawer;');
}


// Powers expire in simulation time, replace each other and keep jump clearance at both speeds.
for(const width of [390,1024])for(const kind of ['energy','lean']){
  const f=fixture({width});f.events['play:click']();f.quiet();
  const base=f.run('getRunSpeed()');f.run(`collectBonus({type:'${kind}',x:0,y:0});`);
  assert.ok(kind==='energy'?f.run('getRunSpeed()')>base:f.run('getRunSpeed()')<base);
  f.run("obstacles=[{x:player.x+100,y:getBeatY(48),w:48,h:48,type:'case'}];doJump();for(let i=0;i<230;i++){update();if(player.onGround)break;}");
  assert.equal(f.run('world.hits'),0,'speed power preserves a clearable jump');
  f.run('obstacles=[];world.distance=0;for(let i=0;i<240;i++)update();');assert.equal(f.run('world.speedFrames'),0);
  f.run("collectBonus({type:'energy',x:0,y:0});collectBonus({type:'lean',x:0,y:0});");
  assert.equal(f.run('world.speedKind'),'lean');assert.equal(f.run('world.speedFrames'),240);
}
{
  const f=fixture();f.events['play:click']();f.quiet();
  f.run("const gaps=new Set();for(let i=0;i<80;i++){const gap=obstacleGap();if(gap<390||gap>900)throw Error('unsafe gap');gaps.add(Math.floor(gap));}const lifts=new Set();for(let i=0;i<40;i++){spawnRecord();lifts.add(Math.floor(records[records.length-1].lift));}");
  assert.ok(f.run('gaps.size')>20);assert.ok(f.run('lifts.size')>10);
  f.run("records=[];const rig=spawnObstacle('rig');rig.x=player.x+520;updateAirObstacle(rig);const highY=rig.y;rig.x=player.x+200;updateAirObstacle(rig);");
  assert.ok(f.run('rig.y>highY'));assert.equal(f.run('rig.y'),f.run('getFloor()-116'));
  f.run('obstacles=[rig];rig.x=player.x+getRunSpeed();update();');assert.equal(f.run('world.lives'),2,'standing contact damages');
  assert.ok(f.run('world.hitText').includes('Porra'));assert.equal(f.element('hit-caption').hidden,false);
  f.events['retry:click']();f.quiet();
  f.run("doDuck();obstacles=[{x:player.x+getRunSpeed(),y:getFloor()-116,w:74,h:38,type:'rig'}];update();");
  assert.equal(f.run('world.lives'),3,'ducking clears overhead structure');assert.equal(f.run('playerBounds().h'),52);
  f.run("player.duckFrames=0;player.duckHeld=false;obstacles=[{x:player.x+getRunSpeed(),y:getFloor()-116,w:74,h:38,type:'rig'}];update();");
  assert.equal(f.run('world.lives'),2,'standing again restores full collision height');
  f.run('world.dropFrames=100;hitObstacle({x:0,y:0});updateHud();');assert.ok(f.element('run-status').textContent.includes('DROP'));
  assert.ok(f.run('world.hitText').includes('PROTEGIDO'));
  f.run('world.dropFrames=0;world.invulnerable=0;world.shield=1;hitObstacle({x:0,y:0});');assert.equal(f.run('world.shield'),0);
  f.run("world.invulnerable=0;collectBonus({type:'usb',x:0,y:0});records=[{x:player.x+100,y:player.y-10,lift:110,r:13}];const magnetStart=records[0].x;update();");
  assert.ok(f.run('records[0].x')<f.run('magnetStart-getRunSpeed()'));
  f.run('records=[];world.magnetFrames=0;world.energy=0;world.chainFrames=0;score=0;combo=0;collectRecord({x:0,y:0});const normalPoints=score;');
  f.run('world.chainFrames=480;score=0;combo=0;collectRecord({x:0,y:0});');assert.equal(f.run('score'),f.run('normalPoints*2'));
}
{
  const f=fixture();assert.equal(f.run('window.GameShop.balance'),0);
  assert.equal(f.run("window.GameShop.buy('blue')"),false,'cannot spend unavailable vinyls');
  f.events['play:click']();f.quiet();f.run('for(let i=0;i<40;i++)window.GameShop.earnVinyl();');
  assert.equal(f.run("window.GameShop.buy('blue')"),false,'shop stays closed during run');
  f.events['change-look:click']();assert.equal(f.run("window.GameShop.buy('blue')"),true);
  assert.equal(f.run('window.GameShop.balance'),10);assert.equal(f.run('window.GameShop.aura()'),'#91dbff');
  f.run("window.GameShop.buy('blue');");assert.equal(f.run('window.GameShop.balance'),10,'equipping owned cosmetics never charges again');
  f.run('for(let i=0;i<15;i++)window.GameShop.earnVinyl();');assert.equal(f.run("window.GameShop.buy('shield')"),true);
  assert.equal(f.run('window.GameShop.balance'),0);f.events['play:click']();assert.equal(f.run('world.shield'),1);
  assert.equal(JSON.parse(f.storage.get('beat-runner-shop')).shields,0,'startup protection consumed once');
  f.events['retry:click']();assert.equal(f.run('world.shield'),0);
}
{
  const f=fixture(),id='4cOdK2wGLETKBW3PvgPWqT';
  assert.equal(f.run(`parseSpotifyLink('https://open.spotify.com/track/${id}?si=test')`),'spotify:track:'+id);
  assert.equal(f.run(`parseSpotifyLink('https://open.spotify.com/intl-pt/playlist/${id}')`),'spotify:playlist:'+id);
  for(const bad of ['javascript:alert(1)','https://open.spotify.com.evil.test/track/'+id,'https://user:pass@open.spotify.com/track/'+id,'http://open.spotify.com/track/'+id,'https://open.spotify.com/track/nope'])assert.equal(f.run(`parseSpotifyLink(${JSON.stringify(bad)})`),null);
  f.element('spotify-url').value='inválido';await f.run('window.GameMusic.load();');
  assert.equal(f.run('window.GameMusic.isSpotify()'),false);
  assert.ok(f.element('spotify-status').textContent.includes('Cole um link'));
}


// The official Spotify controller is mocked here: loading, replacement, pause and mute must stay in sync.
{
  const f=fixture(),id='4cOdK2wGLETKBW3PvgPWqT';
  f.run(`var spotifyCalls={pause:0,resume:0,load:0};document.createElement=()=>({remove(){}});document.head={appendChild(){window.onSpotifyIframeApiReady({createController(node,options,callback){callback({addListener(name,fn){if(name==='playback_started')spotifyCalls.start=fn;},pause(){spotifyCalls.pause++;},resume(){spotifyCalls.resume++;},loadEntity(){spotifyCalls.load++;}});}});}};`);
  f.element('spotify-url').value='https://open.spotify.com/track/'+id;
  assert.equal(await f.run('window.GameMusic.load();'),true);assert.equal(f.run('window.GameMusic.isSpotify()'),true);
  f.run('window.GameMusic.pause();window.GameMusic.setMuted(true);window.GameMusic.setMuted(false);');assert.equal(f.run('spotifyCalls.pause'),0,'unstarted embed never receives pause commands');
  f.run('spotifyCalls.start();');f.events['play:click']();assert.equal(f.run('spotifyCalls.resume'),1);
  f.events['pause:click']();assert.ok(f.run('spotifyCalls.pause')>0);
  await f.run('window.GameMusic.load();');assert.equal(f.run('spotifyCalls.load'),1);
  f.events['sound:click']();const before=f.run('spotifyCalls.resume');f.events['resume:click']();assert.equal(f.run('spotifyCalls.resume'),before,'muted game cannot restart Spotify');
  f.events['spotify-external:click']();f.events['sound:click']();const externalCount=f.run('spotifyCalls.resume');f.run('startMusic();');assert.equal(f.run('spotifyCalls.resume'),externalCount,'external Spotify mode never starts an embedded preview');
  f.events['spotify-default:click']();assert.equal(f.run('window.GameMusic.isSpotify()'),false);
}


// Aerial obstacles remain dodgeable on desktop/mobile, with every speed modifier.
for(const width of [390,1280])for(const kind of [null,'energy','lean'])for(const duck of [false,true]){
  const f=fixture({width});f.events['play:click']();f.quiet();
  if(kind)f.run(`world.speedKind='${kind}';world.speedFrames=240;`);
  f.run(`world.distance=30000;world.elapsed=30;player.duckHeld=${duck};spawnObstacle('rig');records=[];for(let i=0;i<230;i++)update();`);
  assert.equal(f.run('world.hits'),duck?0:1,`aerial clearance width=${width} speed=${kind} duck=${duck}`);
  f.run('world.hitText="teste";world.hitFrames=80;updateHud();');f.events['pause:click']();
  assert.equal(f.element('hit-caption').hidden,true);f.events['end-set:click']();f.events['change-look:click']();
  assert.equal(f.element('hit-caption').hidden,true);f.events['play:click']();assert.equal(f.run('player.duckHeld'),false);assert.equal(f.run('player.duckFrames'),0);
}
{
  const f=fixture({cachedArt:true});f.run('var blits=[];ctx.drawImage=(surface,x,y)=>blits.push([x,y]);renderStageFrame(ctx,{w:390,h:844,floor:760,stage:STAGES[0],time:1,scroll:100,pulse:0,drop:false,reducedMotion:false});');
  assert.ok(f.run('blits.some(([x])=>x<0)'),'scenery moves at its own depth');
  f.run('blits=[];renderStageFrame(ctx,{w:390,h:844,floor:760,stage:STAGES[0],time:2,scroll:200,pulse:0,drop:false,reducedMotion:true});');
  assert.ok(f.run('blits.every(([x])=>x===0)'),'reduced motion keeps scenery still');
}

console.log(`OK: ${scenarios} jump regressions; all looks and poses; vinyl collection; energy and 8s drop; 3 lives and recovery; stages and achievements; training; resize; mute; pause; identical 20/30/60/144 Hz pacing; cached art and interpolated strides; six pickups; missions; perfect jumps; crowd; chill mode; twelve-scene tour; side-on default and natural pickups; ducking and falling rigs; random spacing; timed powers; shop; Spotify link validation; blocked storage.`);
