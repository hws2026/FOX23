const status=document.querySelector('#connection');
status.textContent=new URLSearchParams(location.search).has('remote')?'Waiting for host pairing…':'Loading browser engine…';
// Import inside the error boundary: a missing transitive module must not leave
// the page forever showing its untouched "Connecting / Loading show" placeholders.
try{
 const {startController}=await import('./bridge.js?v=update239');
 await startController();
 await import('./ar-link.js?v=update239');await import('./panel.js?v=update239');
 if(!new URLSearchParams(location.search).has('remote'))await import('./pair-controller.js?v=update239');
 await import('./plugin-download.js?v=update239');await import('./deck-connect.js?v=update239');await import('./stream-playlist208.js?v=update239');
}catch(e){
 status.textContent='Setup failed';status.className='connection offline';
 const error=document.createElement('div');error.className='card';error.setAttribute('role','alert');
 const detail=document.createElement('p');detail.textContent=e.message;
 const recovery=document.createElement('p');recovery.textContent='Checking required startup files…';
 const retry=document.createElement('button');retry.type='button';retry.textContent='Reload controller';retry.onclick=()=>location.reload();
 error.append(detail,recovery,retry);document.querySelector('#controls').replaceChildren(error);
 if(e.code==='SECURE_CONTEXT_REQUIRED'){
  recovery.textContent='This HTTP address cannot start the show engine. If you just connected a custom domain, wait for its HTTPS certificate to finish, then enable Enforce HTTPS in your hosting settings. No saved show data was changed.';
  const secure=new URL(location.href);secure.protocol='https:';
  const link=document.createElement('a');link.href=secure.href;link.textContent='Open secure controller';link.className='button primary';error.append(link);
 }else if(e.code==='LOCAL_SERVER_REQUIRED'){
  recovery.textContent='Use your published HTTPS site, or serve this folder through localhost for local testing. Opening index.html directly cannot run the controller. No saved show data was changed.';
 }else if(e.code==='WEB_LOCKS_REQUIRED'){
  recovery.textContent='Open the HTTPS site in an up-to-date browser with Web Locks support. The controller has stopped before loading the show engine to prevent competing control tabs. No saved show data was changed.';
 }else{
 // Diagnostic GETs are read-only and never clear storage or initialize a show.
 const required=['bridge.js?v=update239','cloud/sync.js','cloud/config.js','cloud/delta.js'];
 const checked=await Promise.all(required.map(async path=>{
  try{const response=await fetch(new URL(path,import.meta.url),{method:'HEAD',cache:'no-store',signal:AbortSignal.timeout(5000)});return response.status===404?path:null;}catch{return null;}
 }));
 const missing=checked.filter(Boolean);
 if(missing.length){detail.textContent='Required files are missing: '+missing.join(', ')+'.';recovery.textContent='Copy all files and the complete cloud folder from the latest update ZIP into FOX23, then publish your update and hard-refresh this page. Keep the other project files. Your saved show has not been replaced.';}
 else recovery.textContent='Reload to retry. If this followed an update, make sure every file from the ZIP was copied. Your saved show has not been replaced.';
 }
}
