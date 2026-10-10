import {bindSplitCapture} from './split-capture238.js?v=update239';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function db(){return new Promise((resolve,reject)=>{const r=indexedDB.open('gridiron-local-split-media',1);r.onupgradeneeded=()=>r.result.createObjectStore('videos');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function saveSplitVideo(file,slot){if(!file)return null;if(!file.type.startsWith('video/'))throw Error('Choose a video file.');const d=await db(),key='slot-'+slot+'-'+Date.now();await new Promise((resolve,reject)=>{const tx=d.transaction('videos','readwrite');tx.objectStore('videos').put(file,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});d.close();return key;}
async function readVideo(key){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction('videos').objectStore('videos').get(key);r.onsuccess=()=>{d.close();resolve(r.result)};r.onerror=()=>{d.close();reject(r.error)};});}
export function splitUrl(value,base=globalThis.location?.href||'https://example.invalid/'){
 const text=String(value||'').trim();if(!text)return '';
 try{const url=new URL(text,base);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password?url.href:'';}catch{return '';}
}
export function splitGraphic(s,c){return `<section class="split192"><div class="split192-shell"></div><div class="split192-info"><h1>${esc(c.title||'GAME UPDATE')}</h1><h2>${esc(c.subtitle||'')}</h2><p>${esc(c.featureText||'')}</p><small>${esc(c.featureFooter||'')}</small></div><div class="split192-feeds">${[1,2].map(i=>{
 const mode=c['splitSource'+i]||'none',url=splitUrl(c['splitUrl'+i]);
 const media=mode==='browser'?`<iframe data-split-slot="${i}" title="${esc(c['splitLabel'+i]||'Browser feed '+i)}" ${url?`src="${esc(url)}"`:''} sandbox="allow-scripts allow-same-origin allow-presentation" allow="autoplay; fullscreen" referrerpolicy="no-referrer"></iframe>`:`<video muted playsinline autoplay loop data-split-slot="${i}" data-mode="${esc(mode)}" data-camera="${esc(c['splitCamera'+i]||'')}" data-file="${esc(c['splitVideo'+i]||'')}" data-url="${esc(url)}" data-capture="${esc(c['splitCapture'+i]||'')}"></video>${mode==='capture'?`<small data-capture-message="${i}" style="position:absolute;inset:25% 8%;display:grid;place-items:center;text-align:center;font:24px/1.4 Arial;color:white;background:#142230e6;padding:20px"></small>`:''}`;
 return `<div class="split192-feed">${media}<span>${esc(c['splitLabel'+i]||'')}</span></div>`;
 }).join('')}</div></section>`;}
// Runtime video src is absent from renderer markup; preserve it on text-only morphs.
export function preserveSplitSource(node,next,name){return name==='src'&&node.nodeName==='VIDEO'&&node.dataset.splitSlot&&['mode','camera','file','url','capture'].every(k=>(node.dataset[k]||'')===(next.dataset[k]||''));}

const sources=new Set(),bindings=new WeakMap();
const sourceKey=video=>JSON.stringify([video.dataset.mode,video.dataset.camera,video.dataset.file,video.dataset.url,video.dataset.capture]);
function clearMedia(entry){
 entry.captureObserver?.disconnect();entry.captureObserver=null;entry.releaseCapture?.();entry.releaseCapture=null;
 entry.stream?.getTracks().forEach(track=>track.stop());entry.stream=null;
 if(entry.url)URL.revokeObjectURL(entry.url);entry.url=null;
 if(bindings.get(entry.video)===entry){entry.video.onerror=null;entry.video.pause();entry.video.srcObject=null;entry.video.removeAttribute('src');}
}
function release(entry){
 if(entry.released)return;entry.released=true;clearMedia(entry);sources.delete(entry);
 if(bindings.get(entry.video)===entry){bindings.delete(entry.video);delete entry.video.dataset.bound;}
}
const current=entry=>!entry.released&&bindings.get(entry.video)===entry&&entry.video.isConnected&&(entry.video.dataset.mode==='capture'||!entry.video.closest('.leaving'))&&sourceKey(entry.video)===entry.key;
export function syncSplitMedia(root){
 for(const entry of sources)if(!current(entry))release(entry);
 for(const video of root.querySelectorAll('.graphics-layer:not(.leaving) video[data-split-slot], .graphics-layer video[data-split-slot][data-mode="capture"]')){
  const key=sourceKey(video),existing=bindings.get(video);
  if(existing?.key===key){video.dataset.bound='true';existing.releaseCapture?.refresh?.();continue;}
  if(existing)release(existing);
  if(!['camera','video','video_url','capture'].includes(video.dataset.mode))continue;
  const entry={video,key};bindings.set(video,entry);sources.add(entry);video.dataset.bound='true';delete video.dataset.error;
  if(video.dataset.mode==='capture'){entry.releaseCapture=bindSplitCapture(video,video.dataset.capture);if(globalThis.MutationObserver){entry.captureObserver=new MutationObserver(()=>{if(!current(entry))release(entry);});entry.captureObserver.observe(video.ownerDocument.body,{childList:true,subtree:true});}continue;}
  (async()=>{try{
   if(video.dataset.mode==='camera'){
    const stream=await navigator.mediaDevices.getUserMedia({video:video.dataset.camera?{deviceId:{exact:video.dataset.camera}}:true,audio:false});
    if(!current(entry)){stream.getTracks().forEach(track=>track.stop());release(entry);return;}
    entry.stream=stream;video.srcObject=stream;
   }else if(video.dataset.mode==='video_url'){
    const url=splitUrl(video.dataset.url);if(!url)throw Error('Enter a direct HTTP(S) video URL accessible from OBS.');
    video.src=url;
   }else{
    const blob=await readVideo(video.dataset.file);
    if(!current(entry)){release(entry);return;}
    if(!blob)throw Error('This video is saved in another browser. Select Video URL and use a shared MP4/WebM address for OBS.');
    entry.url=URL.createObjectURL(blob);video.src=entry.url;
   }
   video.onerror=()=>{if(current(entry)){const channel=new BroadcastChannel('gridiron-split-status');channel.postMessage({slot:video.dataset.splitSlot,error:'Video could not load. Check its shared URL and codec in OBS.'});channel.close();}};
   video.muted=true;await video.play();
  }catch(error){
   if(!current(entry)){release(entry);return;}
   clearMedia(entry);video.dataset.error=error.message;
   const channel=new BroadcastChannel('gridiron-split-status');channel.postMessage({slot:video.dataset.splitSlot,error:error.message});channel.close();
  }})();
 }
}
