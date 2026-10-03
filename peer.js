export function encode(desc){return btoa(JSON.stringify(desc));}
export function decode(text){if(!text.trim())throw Error('Paste a pairing code first.');let d;try{d=JSON.parse(atob(text.trim()));}catch{throw Error('Invalid pairing code. Copy the full code again.');}if(!['offer','answer'].includes(d.type)||typeof d.sdp!=='string')throw Error('Invalid pairing code');return d;}
export async function gather(pc){if(pc.iceGatheringState==='complete')return;await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{if(/a=candidate:/.test(pc.localDescription?.sdp||''))resolve();else reject(Error('No network route found. Check browser network permission or configure TURN.'));},12000);pc.addEventListener('icegatheringstatechange',()=>{if(pc.iceGatheringState==='complete'){clearTimeout(timer);resolve();}});});}
export function connection(){
 let relay={};try{relay=JSON.parse(sessionStorage.getItem('wld-relay')||'{}');}catch{}
 const iceServers=[{urls:'stun:stun.l.google.com:19302'}];
 if(/^turns?:/.test(relay.url))iceServers.push({urls:relay.url,username:relay.username,credential:relay.credential});
 return new RTCPeerConnection({iceServers});
}
export async function applyAnswer(pc,answer){
 if(answer.type!=='answer')throw Error('Paste the answer code, not the offer.');
 if(pc.signalingState==='stable'){
  if(pc.remoteDescription?.sdp===answer.sdp)return;
  throw Error('This connection already has an answer. Create a new pairing for a different device.');
 }
 if(pc.signalingState!=='have-local-offer')throw Error('Create a new offer before connecting.');
 await pc.setRemoteDescription(answer);
}
export function relayFields(container){
 const box=document.createElement('details');box.innerHTML='<summary>Internet relay settings (TURN)</summary><p>Needed when a network blocks direct connections. Enter your relay provider’s temporary credentials on both devices. Kept for this tab only.</p><label>TURN URL<input data-relay="url" placeholder="turns:relay.example.com:443"></label><label>Username<input data-relay="username"></label><label>Credential<input data-relay="credential" type="password"></label>';
 let saved={};try{saved=JSON.parse(sessionStorage.getItem('wld-relay')||'{}');}catch{}
 box.querySelectorAll('input').forEach(input=>{input.value=saved[input.dataset.relay]||'';input.onchange=()=>{saved[input.dataset.relay]=input.value.trim();sessionStorage.setItem('wld-relay',JSON.stringify(saved));};});container.append(box);
}
export function messages(dc,receive){
 let parts=[],size=0,queue=Promise.resolve();
 dc.addEventListener('message',({data})=>{try{const p=JSON.parse(data);if(p.start){parts=[];size=0;}else if(typeof p.chunk==='string'){size+=p.chunk.length;if(size>40000000)throw Error('Too large');parts.push(p.chunk);}else if(p.end){const value=JSON.parse(parts.join(''));parts=[];receive(value);}}catch{parts=[];}});
 return value=>{const text=JSON.stringify(value);const task=queue.then(async()=>{if(dc.readyState!=='open')throw Error('Remote connection is closed');dc.send(JSON.stringify({start:true}));for(let i=0;i<text.length;i+=8000){while(dc.bufferedAmount>262144&&dc.readyState==='open')await new Promise(r=>setTimeout(r,20));if(dc.readyState!=='open')throw Error('Remote connection closed');dc.send(JSON.stringify({chunk:text.slice(i,i+8000)}));}dc.send(JSON.stringify({end:true}));});queue=task.catch(()=>{});return task;};
}
export function stateSender(dc){let latest,busy=false,lastRevision;return async state=>{if(state.revision!==undefined&&state.revision===lastRevision)return;lastRevision=state.revision;latest=state;if(busy)return;busy=true;try{while(latest&&dc.readyState==='open'){const text=JSON.stringify(latest);latest=null;dc.send(JSON.stringify({start:true}));for(let i=0;i<text.length;i+=8000){while(dc.bufferedAmount>262144&&dc.readyState==='open')await new Promise(r=>setTimeout(r,20));if(dc.readyState!=='open')break;dc.send(JSON.stringify({chunk:text.slice(i,i+8000)}));}if(dc.readyState==='open')dc.send(JSON.stringify({end:true}));}}finally{busy=false;}};}
export function stateReceiver(dc,accept){let chunks=[],size=0;dc.onmessage=({data})=>{try{const part=JSON.parse(data);if(part.start){chunks=[];size=0;}else if(typeof part.chunk==='string'){size+=part.chunk.length;if(size>40000000)throw Error('State too large');chunks.push(part.chunk);}else if(part.end){const state=JSON.parse(chunks.join(''));chunks=[];if(state.game&&state.program&&state.teams)accept(state);}}catch(e){console.error('Pairing data rejected',e);chunks=[];}};}
