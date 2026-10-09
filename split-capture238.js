// Display capture belongs to this controller session, never to serialized show data.
// Same-origin outputs use a local WebRTC link; paired OBS uses the existing peer.
const unavailable='Capture is not connected here. Keep its controller open and pair this OBS output with that controller; cloud show sync does not carry screen video.';
export function createSplitCaptureHub(options={}){
 const env=options.env||globalThis,media=options.mediaDevices||env.navigator?.mediaDevices;
 const uid=options.uid||(()=>env.crypto.randomUUID()),picks=new Map(),retirements=new Map(),instance=uid(),owned=new Map(),received=new Map(),watchers=new Map(),changes=new Set(),links=new Map();
 const channel=Object.hasOwn(options,'channel')?options.channel:(env.BroadcastChannel?new env.BroadcastChannel('gridiron-split-capture238'):null);
 let disposed=false;
 const streamFor=id=>owned.get(id)?.stream||received.get(id)?.stream||null;
 const notify=id=>{for(const fn of watchers.get(id)||[])fn(streamFor(id),streamFor(id)?'':unavailable);};
 const changed=()=>{for(const fn of changes)fn();env.dispatchEvent?.(new env.CustomEvent('gridiron-capture238-change'));};
 const send=value=>channel?.postMessage({...value,from:instance});
 function closeLink(key,announce=false){const link=links.get(key);if(!link)return;links.delete(key);link.pc.close();if(announce)send({type:'release',request:key,target:link.remote});if(!link.serving&&received.get(link.capture)?.link===key){received.delete(link.capture);notify(link.capture);}}
 function stop(id){clearTimeout(retirements.get(id));retirements.delete(id);const entry=owned.get(id);if(!entry)return false;owned.delete(id);for(const track of entry.stream.getTracks())track.stop();for(const[key,link]of links)if(link.serving&&link.capture===id)closeLink(key);send({type:'ended',capture:id});notify(id);changed();return true;}
 async function choose(slot){
  slot=Number(slot);if(![1,2].includes(slot))throw Error('Choose feed 1 or 2.');
  if(disposed)throw Error('Capture controller is closed.');
  if(!media?.getDisplayMedia)throw Error('This browser cannot share a tab or window. Open the HTTPS control panel in a browser with screen sharing.');
  // Must be reached directly from the explicit Choose button, never from render.
  const pick=(picks.get(slot)||0)+1;picks.set(slot,pick);
  let stream;try{stream=await media.getDisplayMedia({video:{frameRate:30},audio:false});}catch(error){if(['NotAllowedError','AbortError'].includes(error.name))return null;throw error;}
  const track=stream.getVideoTracks()[0];if(!track){stream.getTracks().forEach(t=>t.stop());throw Error('No video was shared. Choose a browser tab or window.');}
  if(disposed||picks.get(slot)!==pick){stream.getTracks().forEach(t=>t.stop());return null;}
  const id='capture-'+uid(),entry={id,slot,stream,label:track.label||'Shared tab / window'};
  owned.set(id,entry);track.addEventListener('ended',()=>stop(id),{once:true});notify(id);changed();return {id,slot,label:entry.label};
 }
 function makeLink(key,capture,remote,serving){
  const pc=new env.RTCPeerConnection({iceServers:[]}),link={pc,capture,remote,serving,candidates:[],queue:Promise.resolve()};links.set(key,link);
  pc.onicecandidate=event=>{if(event.candidate)send({type:'ice',request:key,capture,target:remote,candidate:event.candidate.toJSON?.()||event.candidate});};
  pc.onconnectionstatechange=()=>{if(['closed','failed'].includes(pc.connectionState))closeLink(key);};
  if(!serving)pc.ontrack=event=>{if(links.get(key)!==link)return;const stream=event.streams?.[0]||new env.MediaStream([event.track]);received.set(capture,{stream,link:key});notify(capture);};
  return link;
 }
 function request(id){
  if(disposed||!channel||!env.RTCPeerConnection||streamFor(id)||[...links.values()].some(l=>!l.serving&&l.capture===id))return;
  const key=uid();makeLink(key,id,'',false);send({type:'request',request:key,capture:id});
 }
 async function signal(message){
  const m=message?.data||message;if(!m||m.from===instance||(m.target&&m.target!==instance))return;
  if(m.type==='request'){
   const entry=owned.get(m.capture);if(!entry||links.has(m.request))return;
   const link=makeLink(m.request,m.capture,m.from,true);for(const track of entry.stream.getVideoTracks())link.pc.addTrack(track,entry.stream);
   try{await link.pc.setLocalDescription(await link.pc.createOffer());send({type:'offer',request:m.request,capture:m.capture,target:m.from,description:{type:link.pc.localDescription.type,sdp:link.pc.localDescription.sdp}});}catch{closeLink(m.request);}return;
  }
  if(m.type==='ended'){for(const[key,link]of links)if(!link.serving&&link.capture===m.capture)closeLink(key);return;}
  const link=links.get(m.request);if(!link)return;
  if(m.type==='release'){closeLink(m.request);return;}
  link.remote=m.from;
  link.queue=link.queue.then(async()=>{
   if(links.get(m.request)!==link)return;
   if(m.type==='ice'){if(link.pc.remoteDescription)await link.pc.addIceCandidate(m.candidate);else link.candidates.push(m.candidate);return;}
   if(m.type==='offer'||m.type==='answer'){
    await link.pc.setRemoteDescription(m.description);for(const candidate of link.candidates.splice(0))await link.pc.addIceCandidate(candidate);
    if(m.type==='offer'){await link.pc.setLocalDescription(await link.pc.createAnswer());send({type:'answer',request:m.request,capture:m.capture,target:m.from,description:{type:link.pc.localDescription.type,sdp:link.pc.localDescription.sdp}});}
   }
  }).catch(()=>closeLink(m.request));
 }
 if(channel)channel.onmessage=signal;
 function subscribe(id,callback){
  if(!id){callback(null,'Choose a browser tab or window in the control panel.');return()=>{};}
  let set=watchers.get(id);if(!set)watchers.set(id,set=new Set());set.add(callback);callback(streamFor(id),streamFor(id)?'':unavailable);request(id);
  return()=>{set.delete(callback);if(set.size)return;watchers.delete(id);for(const[key,link]of links)if(!link.serving&&link.capture===id)closeLink(key,true);};
 }
 function setRemote(id,stream,owner){if(stream)received.set(id,{stream,owner});else if(received.get(id)?.owner===owner)received.delete(id);notify(id);}
 function clearRemote(owner){for(const[id,entry]of received)if(entry.owner===owner){received.delete(id);notify(id);}}
 function dispose(){if(disposed)return;disposed=true;for(const id of [...owned.keys()])stop(id);for(const key of [...links.keys()])closeLink(key,true);channel?.close();received.clear();for(const id of watchers.keys())notify(id);watchers.clear();changes.clear();}
 const pagehide=()=>dispose();env.addEventListener?.('pagehide',pagehide,{once:true});
 return {choose,stop,subscribe,dispose,streamFor,setRemote,clearRemote,get disposed(){return disposed;},retain(ids,delay=0){const keep=new Set(ids);for(const id of owned.keys()){if(keep.has(id)){clearTimeout(retirements.get(id));retirements.delete(id);}else if(!retirements.has(id)){if(delay)retirements.set(id,setTimeout(()=>stop(id),delay));else stop(id);}}},onChange(fn){changes.add(fn);return()=>changes.delete(fn);},entries:()=>[...owned.values()],status(id){const entry=owned.get(id);return entry?{active:true,label:entry.label,slot:entry.slot}: {active:!!received.get(id),label:received.has(id)?'Received capture':'No active capture'};}};
}
let singleton;
export const splitCaptureHub=()=>!singleton||singleton.disposed?(singleton=createSplitCaptureHub()):singleton;
export const chooseSplitCapture=slot=>splitCaptureHub().choose(slot);
export const stopSplitCapture=id=>splitCaptureHub().stop(id);
export const splitCaptureStatus=id=>splitCaptureHub().status(id);
export function releaseUnusedSplitCaptures(state,delay=0){const ids=[];for(const cue of [state.preview,state.program?.graphic])if(cue?.type==='splitview')for(const slot of [1,2])if(cue['splitSource'+slot]==='capture')ids.push(cue['splitCapture'+slot]);splitCaptureHub().retain(ids,delay);}
export function bindSplitCapture(video,id){
 let active=true;const hub=splitCaptureHub();
 const display=(stream,error)=>{if(!active)return;if(video.srcObject!==stream)video.srcObject=stream;const message=video.parentElement?.querySelector('[data-capture-message="'+video.dataset.splitSlot+'"]');if(message){message.textContent=stream?'':error;message.style.display=stream?'none':'grid';}if(stream){delete video.dataset.error;video.muted=true;video.play().catch(error=>video.dataset.error=error.message);}else{video.pause();video.dataset.error=error;}};
 const unsubscribe=hub.subscribe(id,display),release=()=>{active=false;unsubscribe();video.pause();video.srcObject=null;};
 release.refresh=()=>display(hub.streamFor(id),id?unavailable:'Choose a browser tab or window in the control panel.');return release;
}
// Reserve four video senders in the original manual offer: two program and
// two preview captures. Tokens remain pinned to a sender until retired, so
// choosing a new preview never replaces an on-air RTP stream before Take.
export function attachPairedCaptureHost(pc,dc,hub=splitCaptureHub()){
 const rows=Array.from({length:4},()=>({capture:'',transceiver:pc.addTransceiver('video',{direction:'sendonly'})}));let closed=false,queue=Promise.resolve();
 const sync=()=>{queue=queue.then(async()=>{
  if(closed)return;const entries=hub.entries(),ids=new Set(entries.map(e=>e.id)),items=[];
  for(const row of rows)if(!ids.has(row.capture))row.capture='';
  for(const entry of entries)if(!rows.some(row=>row.capture===entry.id)){const free=rows.find(row=>!row.capture);if(free)free.capture=entry.id;}
  for(const row of rows){const entry=entries.find(e=>e.id===row.capture),track=entry?.stream.getVideoTracks()[0]||null;try{await row.transceiver.sender.replaceTrack(track);items.push({slot:entry?.slot||0,id:entry?.id||'',mid:row.transceiver.mid,label:entry?.label||''});}catch(error){items.push({slot:entry?.slot||0,id:entry?.id||'',mid:row.transceiver.mid,error:'Capture transport failed: '+error.message});}}
  if(!closed&&dc.readyState==='open')dc.send(JSON.stringify({type:'captures',items}));
 }).catch(()=>{});return queue;};
 const off=hub.onChange(sync);dc.addEventListener('open',sync);
 const close=()=>{if(closed)return;closed=true;off();queue=queue.then(()=>Promise.all(rows.map(row=>row.transceiver.sender.replaceTrack(null).catch(()=>{}))));};
 dc.addEventListener('close',close);pc.addEventListener('connectionstatechange',()=>{if(['closed','failed'].includes(pc.connectionState))close();});sync();return close;
}
export function attachPairedCaptureOutput(pc,dc,hub=splitCaptureHub(),env=globalThis){
 const owner={},tracks=new Map();let items=[],previous=new Set(),closed=false;
 const sync=()=>{if(closed)return;const next=new Set(items.filter(item=>item.id).map(item=>item.id));for(const id of previous)if(!next.has(id))hub.setRemote(id,null,owner);for(const item of items){const stream=tracks.get(item.mid);if(item.id&&stream&&!item.error)hub.setRemote(item.id,stream,owner);}previous=next;};
 const track=event=>{tracks.set(event.transceiver.mid,event.streams?.[0]||new env.MediaStream([event.track]));sync();};
 for(const transceiver of pc.getTransceivers?.()||[])if(transceiver.receiver?.track?.kind==='video')tracks.set(transceiver.mid,new env.MediaStream([transceiver.receiver.track]));
 pc.addEventListener('track',track);dc.addEventListener('message',({data})=>{try{const value=JSON.parse(data);if(value.type==='captures'&&Array.isArray(value.items)){items=value.items;sync();}}catch{}});
 const close=()=>{if(closed)return;closed=true;hub.clearRemote(owner);pc.removeEventListener('track',track);};dc.addEventListener('close',close);pc.addEventListener('connectionstatechange',()=>{if(['closed','failed'].includes(pc.connectionState))close();});return close;
}
