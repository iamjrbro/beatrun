// Local-only vinyl wallet and cosmetic shop. No account, purchases or external storage.
(()=>{
  const saved=readStored('beat-runner-shop',{});
  const clamp=n=>Number.isSafeInteger(n)&&n>=0?Math.min(n,1000000):0;
  let balance=clamp(saved.balance),shields=clamp(saved.shields);
  const products={blue:{label:'Aura azul',price:30,color:'#91dbff'},pink:{label:'Aura rosa',price:45,color:'#f2a8d0'},trail:{label:'Rastro neon',price:60},shield:{label:'Pulseira para o próximo set',price:25}};
  const owned=new Set(Array.isArray(saved.owned)?saved.owned.filter(id=>['blue','pink','trail'].includes(id)):[]);
  let equipped=owned.has(saved.equipped)?saved.equipped:null,trail=Boolean(saved.trail)&&owned.has('trail');
  const persist=()=>saveStored('beat-runner-shop',{balance,shields,owned:[...owned],equipped,trail});
  function render(){
    setText('shop-balance',balance+' VINIS');setText('shop-shields',shields+' pulseiras guardadas para próximos sets');
    for(const[id,p]of Object.entries(products)){
      const bought=owned.has(id),active=id==='trail'?trail:equipped===id;
      setText('shop-'+id,p.label+' · '+(bought?(active?'EQUIPADO · tirar':'EQUIPAR'):p.price+' VINIS'));
      el('shop-'+id).disabled=!bought&&(balance<p.price||(id==='shield'&&shields>=3));
      el('shop-'+id).setAttribute('aria-pressed',String(bought&&active));
    }
  }
  function buy(id){
    if(STATE!=='start')return false;
    const p=products[id];if(!p)return false;
    if(owned.has(id)){if(id==='trail')trail=!trail;else equipped=equipped===id?null:id;}
    else{
      if(balance<p.price||(id==='shield'&&shields>=3))return false;
      balance-=p.price;if(id==='shield')shields++;else{owned.add(id);if(id==='trail')trail=true;else equipped=id;}
    }
    persist();render();return true;
  }
  for(const id of Object.keys(products))el('shop-'+id).addEventListener('click',()=>buy(id));
  window.GameShop={render,buy,get balance(){return balance;},earnVinyl(){balance=Math.min(1000000,balance+1);persist();},
    consumeShield(){if(world.mode==='chill'||shields===0)return false;shields--;persist();return true;},
    aura:()=>products[equipped]?.color||'#81f7d4',hasTrail:()=>trail};
  render();
})();
