const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function db(){return new Promise((resolve,reject)=>{const r=indexedDB.open('gridiron-local-split-media',1);r.onupgradeneeded=()=>r.result.createObjectStore('videos');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function saveSplitVideo(file,slot){if(!file)return null;if(!file.type.startsWith('video/'))throw Error('Choose a video file.');const d=await db(),key='slot-'+slot+'-'+Date.now();await new Promise((resolve,reject)=>{const tx=d.transaction('videos','readwrite');tx.objectStore('videos').put(file,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});d.close();return key;}
async function readVideo(key){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction('videos').objectStore('videos').get(key);r.onsuccess=()=>{d.close();resolve(r.result)};r.onerror=()=>{d.close();reject(r.error)};});}
export function splitGraphic(s,c){return `<section class="split192"><div class="split192-shell"></div><div class="split192-info"><h1>${esc(c.title||'GAME UPDATE')}</h1><h2>${esc(c.subtitle||'')}</h2><p>${esc(c.featureText||'')}</p><small>${esc(c.featureFooter||'')}</small></div><div class="split192-feeds">${[1,2].map(i=>`<div class="split192-feed"><video muted playsinline autoplay loop data-split-slot="${i}" data-mode="${esc(c['splitSource'+i]||'none')}" data-camera="${esc(c['splitCamera'+i]||'')}" data-file="${esc(c['splitVideo'+i]||'')}"></video><span>${esc(c['splitLabel'+i]||'')}</span></div>`).join('')}</div></section>`;}
const sources=new Set(),bindings=new WeakMap();
const sourceKey=video=>JSON.stringify([video.dataset.mode,video.dataset.camera,video.dataset.file]);
function clearMedia(entry){
 entry.stream?.getTracks().forEach(track=>track.stop());entry.stream=null;
 if(entry.url)URL.revokeObjectURL(entry.url);entry.url=null;
 if(bindings.get(entry.video)===entry){entry.video.pause();entry.video.srcObject=null;entry.video.removeAttribute('src');}
}
function release(entry){
 if(entry.released)return;entry.released=true;clearMedia(entry);sources.delete(entry);
 if(bindings.get(entry.video)===entry){bindings.delete(entry.video);delete entry.video.dataset.bound;}
}
const current=entry=>!entry.released&&bindings.get(entry.video)===entry&&entry.video.isConnected&&!entry.video.closest('.leaving')&&sourceKey(entry.video)===entry.key;
export function syncSplitMedia(root){
 for(const entry of sources)if(!current(entry))release(entry);
 for(const video of root.querySelectorAll('.graphics-layer:not(.leaving) video[data-split-slot]')){
  const key=sourceKey(video),existing=bindings.get(video);
  if(existing?.key===key){video.dataset.bound='true';continue;}
  if(existing)release(existing);
  if(!['camera','video'].includes(video.dataset.mode))continue;
  const entry={video,key};bindings.set(video,entry);sources.add(entry);video.dataset.bound='true';delete video.dataset.error;
  (async()=>{try{
   if(video.dataset.mode==='camera'){
    const stream=await navigator.mediaDevices.getUserMedia({video:video.dataset.camera?{deviceId:{exact:video.dataset.camera}}:true,audio:false});
    if(!current(entry)){stream.getTracks().forEach(track=>track.stop());release(entry);return;}
    entry.stream=stream;video.srcObject=stream;
   }else{
    const blob=await readVideo(video.dataset.file);
    if(!current(entry)){release(entry);return;}
    if(!blob)throw Error('Choose a local video for this feed on this computer.');
    entry.url=URL.createObjectURL(blob);video.src=entry.url;
   }
   video.muted=true;await video.play();
  }catch(error){
   if(!current(entry)){release(entry);return;}
   clearMedia(entry);video.dataset.error=error.message;
   const channel=new BroadcastChannel('gridiron-split-status');channel.postMessage({slot:video.dataset.splitSlot,error:error.message});channel.close();
  }})();
 }
}
