const status=document.querySelector('#connection');
status.textContent=new URLSearchParams(location.search).has('remote')?'Waiting for host pairing…':'Loading browser engine…';
// Import inside the error boundary: a missing transitive module must not leave
// the page forever showing its untouched "Connecting / Loading show" placeholders.
try{
 const {startController}=await import('./bridge.js?v=control227');
 await startController();
 await import('./ar-link.js?v=control227');await import('./panel.js?v=control227');
 if(!new URLSearchParams(location.search).has('remote'))await import('./pair-controller.js?v=control227');
 await import('./plugin-download.js?v=control227');await import('./deck-connect.js?v=control227');await import('./stream-playlist208.js?v=control227');
}catch(e){
 status.textContent='Setup failed';status.className='connection offline';
 const error=document.createElement('div');error.className='card';error.setAttribute('role','alert');
 const detail=document.createElement('p');detail.textContent=e.message;
 const recovery=document.createElement('p');recovery.textContent='Checking required startup files…';
 const retry=document.createElement('button');retry.type='button';retry.textContent='Reload controller';retry.onclick=()=>location.reload();
 error.append(detail,recovery,retry);document.querySelector('#controls').replaceChildren(error);
 // Diagnostic GETs are read-only and never clear storage or initialize a show.
 const required=['bridge.js','cloud/sync.js','cloud/config.js','cloud/delta.js'];
 const checked=await Promise.all(required.map(async path=>{
  try{const response=await fetch(new URL(path,import.meta.url),{method:'HEAD',cache:'no-store',signal:AbortSignal.timeout(5000)});return response.status===404?path:null;}catch{return null;}
 }));
 const missing=checked.filter(Boolean);
 if(missing.length){detail.textContent='Required files are missing: '+missing.join(', ')+'.';recovery.textContent='Copy the complete cloud folder from repair ZIP 227 into FOX23, then publish your update and hard-refresh this page. Keep the other project files. Your saved show has not been replaced.';}
 else recovery.textContent='Reload to retry. If this followed an update, make sure every file from the ZIP was copied. Your saved show has not been replaced.';
}
