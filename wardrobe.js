/* Compact fitting room. Choice buttons retain the game's saved catalog IDs. */
function bindWardrobeTabs(ids,prefix,panelPrefix){
  const select=id=>{
    if(!ids.includes(id))return;
    for(const item of ids){
      const active=item===id,button=el(prefix+item);
      button.setAttribute('aria-selected',String(active));button.setAttribute('tabindex',active?'0':'-1');
      el(panelPrefix+item).hidden=!active;
    }
  };
  for(const id of ids){
    const button=el(prefix+id);
    button.addEventListener('click',()=>select(id));
    button.addEventListener('keydown',event=>{
      let index=ids.indexOf(id);
      if(event.key==='ArrowRight')index=(index+1)%ids.length;
      else if(event.key==='ArrowLeft')index=(index+ids.length-1)%ids.length;
      else if(event.key==='Home')index=0;
      else if(event.key==='End')index=ids.length-1;
      else return;
      event.preventDefault();select(ids[index]);el(prefix+ids[index]).focus();
    });
  }
  select(ids[0]);
}
bindWardrobeTabs(['clothes','hair','pants','shoes','jewels'],'tab-','wardrobe-panel-');
bindWardrobeTabs(['blouses','hoodies'],'filter-','filter-panel-');
bindWardrobeTabs(['haircuts','haircolors'],'filter-','filter-panel-');
bindWardrobeTabs(['necklaces','earrings','bracelets','grillzs','extras'],'filter-','filter-panel-');
for(const view of ['front','profile'])el('portrait-'+view).addEventListener('click',()=>{
  menuPreviewView=view;
  for(const other of ['front','profile'])el('portrait-'+other).setAttribute('aria-pressed',String(other===view));
});
function drawWardrobeThumbnail(surface,id){
  const paint=surface.getContext('2d');if(!paint)return;paint.clearRect(0,0,surface.width,surface.height);
  const separator=id.indexOf('-'),key=id.slice(0,separator),value=id.slice(separator+1);
  if((key==='earringStyle'||key==='grillzStyle')&&value==='none'){drawEmptyWardrobeChoice(paint);return;}
  const look={x:64,y:32,scale:1.8,outfit:'black',hair:'blond',pants:'plain',shoes:'sneakers',view:'front',chain:false,earrings:false,pantsAccessory:false,braceletStyle:'none'};
  if(key==='outfit'){look.outfit=value;drawDJ(paint,look);return;}
  if(key==='hair'||key==='haircut'){drawDJ(paint,{...look,hair:key==='hair'?value:characterChoice.hair,haircut:key==='haircut'?value:characterChoice.haircut,y:123,scale:1.7});return;}
  if(key==='pants'){drawDJ(paint,{...look,pants:value,y:-33});return;}
  paint.save();
  if(key==='shoes'){paint.translate(39,28);paint.scale(2,2);drawShoes(paint,value,0,0);}
  else if(key==='necklace'){
    if(value==='none')drawEmptyWardrobeChoice(paint);
    else{paint.translate(64,18);paint.scale(2,2);drawNecklace(paint,value,false);}
  }else if(key==='braceletStyle'){
    if(value==='none')drawEmptyWardrobeChoice(paint);
    else{paint.translate(64,45);paint.scale(3,3);drawBracelet(paint,0,0,value);}
  }else if(key==='earringStyle'){
    paint.translate(64,25);paint.scale(3,3);
    if(value==='hoopcross')drawCrossEarring(paint,0,0,true);
    else drawDiamondStud(paint,0,5,3);
  }else if(key==='grillzStyle'){
    paint.translate(64,122);paint.scale(3,3);drawGrillz(paint,false,value);
  }else if(key==='jewelry'&&value==='airpods'){
    paint.translate(64,26);paint.scale(5,5);drawAirpod(paint,-3,0);drawAirpod(paint,3,0,true);
  }else if(key==='jewelry'&&value==='macbook'){
    paint.translate(60,33);paint.scale(3,3);drawMacbook(paint,0,0);
  }else if(key==='jewelry'&&value==='microphone'){
    paint.translate(64,74);paint.scale(3,3);drawMicrophone(paint,0,0);
  }else if(key==='jewelry'&&value==='pantsAccessory'){
    paint.strokeStyle='#ced9eb';paint.lineWidth=3;paint.beginPath();paint.ellipse(64,33,27,24,0,0,Math.PI);paint.stroke();
    paint.fillStyle='#eff5ff';paint.fillRect(35,27,6,7);paint.fillRect(88,27,6,7);
  }
  paint.restore();
}
function drawEmptyWardrobeChoice(paint){
  paint.strokeStyle='#869b9c';paint.lineWidth=2;paint.beginPath();paint.arc(64,43,16,0,Math.PI*2);paint.moveTo(53,54);paint.lineTo(75,32);paint.stroke();
}
for(const surface of document.querySelectorAll?.('canvas[data-preview]')||[])drawWardrobeThumbnail(surface,surface.dataset.preview);

function refreshWardrobeHairThumbnails(){
  for(const surface of document.querySelectorAll?.('canvas[data-preview^="hair-"] , canvas[data-preview^="haircut-"]')||[])drawWardrobeThumbnail(surface,surface.dataset.preview);
}
