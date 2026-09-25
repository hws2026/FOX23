import{base}from'./bridge.js?v=crew111';
import{deckControl}from'./panel.js?v=crew111';
const storageKey='gridiron-deck-key:'+base.pathname;
const button=document.createElement('button');button.className='button subtle';button.textContent='Connect Stream Deck';document.querySelector('.topbar-right').prepend(button);
let socket,timer,enabled=false;const processed=new Map();
export function pairingKey(){let key=localStorage.getItem(storageKey);if(!key){const bytes=crypto.getRandomValues(new Uint8Array(32));key=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');localStorage.setItem(storageKey,key);}return key;}
function connect(){
 clearTimeout(timer);if(socket&&[0,1].includes(socket.readyState))return;
 button.textContent='Connecting Stream Deck…';
 try{socket=new WebSocket('ws://127.0.0.1:18765');}
 catch(e){button.textContent='Stream Deck blocked · retry';button.title=e.message;enabled=false;return;}
 socket.onopen=()=>socket.send(JSON.stringify({type:'hello',key:pairingKey(),site:base.href}));
 socket.onmessage=async({data})=>{try{const message=JSON.parse(data);
  if(message.type==='ready'){button.textContent='Stream Deck connected';button.title='Direct local control · no windows';localStorage.setItem(storageKey+':enabled','1');return;}
  if(message.type!=='command'||typeof message.id!=='string')return;
  if(!processed.has(message.id)){
   const job=deckControl(message.spec).then(()=>({type:'ack',id:message.id}),e=>({type:'ack',id:message.id,error:e.message}));processed.set(message.id,job);
   if(processed.size>512)processed.delete(processed.keys().next().value);
  }
  const reply=await processed.get(message.id);if(socket.readyState===1)socket.send(JSON.stringify(reply));
 }catch(e){console.error('Stream Deck command rejected',e);}};
 socket.onclose=e=>{button.textContent=e.code===1008?'Re-download plugin to pair':'Stream Deck disconnected · retry';if(e.code===1008){enabled=false;return;}if(enabled)timer=setTimeout(connect,3000);};
 socket.onerror=()=>{button.title='Install the new plugin on this PC. Allow local-network access if your browser asks. No fallback window will be opened.';};
}
button.onclick=()=>{enabled=true;connect();};
if(localStorage.getItem(storageKey+':enabled')==='1'){enabled=true;connect();}
