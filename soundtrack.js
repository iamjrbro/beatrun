// Spotify's official Embed API is requested only after the player chooses a Spotify link.
function parseSpotifyLink(input){
  const text=String(input).trim(),uri=text.match(/^spotify:(track|album|playlist):([A-Za-z0-9]{22})$/);
  if(uri)return 'spotify:'+uri[1]+':'+uri[2];
  try{
    const link=new URL(text);if(link.protocol!=='https:'||link.hostname!=='open.spotify.com'||link.username||link.password)return null;
    const match=link.pathname.match(/^\/(?:intl-[a-z]{2}\/)?(track|album|playlist)\/([A-Za-z0-9]{22})\/?$/);
    return match?'spotify:'+match[1]+':'+match[2]:null;
  }catch{return null;}
}
(()=>{
  let controller=null,api=null,apiLoading=null,selected=false,request=0,external=false;
  let silent=false,started=false;
  function pauseEmbed(){if(started)controller?.pause();}
  function status(text){setText('spotify-status',text);}
  function getApi(){
    if(api)return Promise.resolve(api);if(apiLoading)return apiLoading;
    apiLoading=new Promise((resolve,reject)=>{
      const script=document.createElement('script');let done=false;
      const fail=()=>{if(done)return;done=true;apiLoading=null;script.remove();reject(Error('Spotify indisponível'));};
      const timeout=setTimeout(fail,15000);
      window.onSpotifyIframeApiReady=ready=>{if(done)return;done=true;clearTimeout(timeout);api=ready;resolve(ready);};
      script.src='https://open.spotify.com/embed/iframe-api/v1';script.async=true;
      script.onerror=()=>{clearTimeout(timeout);fail();};document.head.appendChild(script);
    });return apiLoading;
  }
  async function load(){
    const uri=parseSpotifyLink(el('spotify-url').value);if(!uri){status('Cole um link de música, álbum ou playlist de open.spotify.com.');return false;}
    const token=++request;status('Carregando player do Spotify…');el('spotify-load').disabled=true;
    try{
      const ready=await getApi();if(token!==request)return false;
      music.pause();selected=true;external=false;
      if(controller){pauseEmbed();started=false;controller.loadEntity(uri);}
      else await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Player indisponível')),12000);ready.createController(el('spotify-embed'),{uri,width:'100%',height:152},value=>{clearTimeout(timeout);controller=value;controller.addListener?.('playback_started',()=>{started=true;});controller.addListener?.('playback_update',event=>{if(event?.data?.position>0)started=true;});resolve();});});
      if(token!==request){pauseEmbed();return false;}
      if(silent)pauseEmbed();
      status('Player pronto. Dê play nele e comece o set. Se aparecer Prévia, use Tocar no Spotify para ouvir pela sua conta.');return true;
    }catch{if(token!==request)return false;selected=false;status('Não consegui carregar o Spotify. Tente novamente ou use a trilha do jogo.');return false;}
    finally{el('spotify-load').disabled=false;}
  }
  el('spotify-load').addEventListener('click',load);
  el('spotify-default').addEventListener('click',()=>{request++;selected=false;external=false;pauseEmbed();status('Trilha original selecionada.');if(STATE==='playing')startMusic();});
  function useExternal(){request++;selected=true;external=true;music.pause();pauseEmbed();status('Trilha do jogo desligada. Controle a música no app ou na aba do Spotify; os sons do jogo continuam separados.');}
  el('spotify-external').addEventListener('click',useExternal);el('spotify-open-link').addEventListener('click',useExternal);
  window.GameMusic={load,isSpotify:()=>selected,
    pause(){pauseEmbed();},resume(){if(selected&&!silent&&!external&&started)controller?.resume();},
    setMuted(value){silent=value;if(value)pauseEmbed();else if(selected&&!external&&started&&STATE==='playing')controller?.resume();}};
})();
