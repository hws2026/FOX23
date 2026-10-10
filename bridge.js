import {cloudEnabled,connectCloud} from './cloud/sync.js?v=update239';
export const base=new URL('.',import.meta.url);
export const channel=new BroadcastChannel('gridiron-pages:'+base.pathname);
const originalFetch=globalThis.fetch.bind(globalThis);let remoteRPC,cloudRPC,worker,workerFailure,sequence=0,pending=new Map(),current,readyResolve;
export const ready=new Promise(r=>readyResolve=r);
function localRPC(request){if(workerFailure)return Promise.reject(workerFailure);return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});worker.postMessage({id,request});});}
const startupStages239={engine:'Downloading browser engine…',storage:'Opening saved show storage…',runtime:'Starting browser engine…',assets:'Loading show engine files…',show:'Opening show engine…'};
function startRuntime239(){return new Promise((resolve,reject)=>{
 let started=false,stage='Loading browser engine…';
 const status=globalThis.document?.querySelector('#connection');
 const progress=value=>{stage=value;if(status)status.textContent=value;};
 progress(stage);
 const fail=error=>{
  if(workerFailure)return;
  workerFailure=error;clearTimeout(deadline);worker?.terminate();
  for(const p of pending.values())p.reject(error);pending.clear();reject(error);
 };
 const deadline=setTimeout(()=>fail(Object.assign(Error('The show engine did not finish starting within 60 seconds. Last step: '+stage+' Reload controller to retry.'),{code:'RUNTIME_INIT_TIMEOUT'})),60000);
 try{
  worker=new Worker(new URL('runtime-worker.js?v=update239'+(cloudEnabled?'&cloud=1':''),base));
  worker.onmessage=({data})=>{
   if(workerFailure)return;
   if(data.kind==='runtime-startup'){
    if(started)return;
    if(data.error){fail(Object.assign(Error('The show engine could not start: '+data.error),{code:'RUNTIME_INIT_FAILED'}));return;}
    if(data.ready){started=true;clearTimeout(deadline);progress('Show engine ready…');resolve();return;}
    if(startupStages239[data.stage])progress(startupStages239[data.stage]);
    return;
   }
   const p=pending.get(data.id);if(!p)return;pending.delete(data.id);data.error?p.reject(Error(data.error)):p.resolve(data.result);
  };
  worker.onerror=e=>fail(Error(e.message||'Show engine failed to start. Reload to retry.'));
  worker.onmessageerror=()=>fail(Error('The show engine could not communicate with the controller. Reload to retry.'));
 }catch(e){fail(e);}
});}
export const canControl=()=>cloudRPC?.hasControl!==false;
export function rpc(request){if(remoteRPC)return remoteRPC(request);if(cloudRPC)return cloudRPC(request);return localRPC(request);}
export function publish(state){current=state;channel.postMessage({kind:'state',state});dispatchEvent(new CustomEvent('gridiron-state',{detail:state}));}
export async function startController(){
 // Do not start a writer without the browser's cross-tab lock. Public HTTP
 // pages do not expose Web Locks; report the address problem before loading.
 if(location.protocol==='file:')throw Object.assign(Error('Open this project through a web server.'),{code:'LOCAL_SERVER_REQUIRED'});
 if(globalThis.isSecureContext===false)throw Object.assign(Error('This controller needs an HTTPS connection.'),{code:'SECURE_CONTEXT_REQUIRED'});
 const remote=new URLSearchParams(location.search).has('remote');
 if(!remote&&typeof navigator.locks?.request!=='function')throw Object.assign(Error('This browser cannot provide controller locking.'),{code:'WEB_LOCKS_REQUIRED'});
 if(remote){const {connectRemote}=await import('./remote-controller206.js?v=remote207');remoteRPC=await connectRemote(publish);readyResolve();}
 let acquired;
 if(!remote){
 await new Promise((resolve,reject)=>navigator.locks.request('gridiron-controller:'+base.pathname,{ifAvailable:true},async lock=>{
  acquired=!!lock;if(!lock){resolve();return;}
  await startRuntime239();
  readyResolve();resolve();await new Promise(()=>{});
 }).catch(reject));
 if(!acquired)throw Error('A control panel is already open for this site. Use that tab, or close it before opening another.');
 }
 await ready;
 if(!remote&&cloudEnabled)cloudRPC=await connectCloud(localRPC);
 globalThis.fetch=async(input,options={})=>{
  const u=new URL(typeof input==='string'?input:input.url,location.href);
  const endpoint=u.pathname.match(/\/api\/(state|action|export|teams)$/)?.[1];
  if(!endpoint)return originalFetch(input,options);
  const result=await rpc({endpoint,query:Object.fromEntries(u.searchParams),...(options.body?{body:JSON.parse(options.body)}:{})});
  if(result.status===200&&['state','action'].includes(endpoint))publish(result.data);
  return new Response(result.status===204?null:JSON.stringify(result.data),{status:result.status,headers:{'Content-Type':'application/json'}});
 };
 channel.onmessage=async({data})=>{
  if(data.kind==='hello'&&current)channel.postMessage({kind:'state',state:{...current,serverTime:Date.now()/1000}});
  if(data.kind==='command'){
   try{const {commands}=await import('./commands.js?v=tunnel159');const command=commands[data.command];if(!command)throw Error('Unknown button');
    let result;for(let attempt=0;attempt<3;attempt++){const first=await rpc({endpoint:'state'});result=await rpc({endpoint:'action',body:{action:command[0],payload:command[1],revision:first.data.revision}});if(result.status!==409)break;}
    if(result.status!==200)throw Error(result.data.error);publish(result.data);channel.postMessage({kind:'ack',id:data.id});
   }catch(e){channel.postMessage({kind:'ack',id:data.id,error:e.message});}
  }
 };
 const initial=await rpc({endpoint:'state'});if(initial.status!==200)throw Error(initial.data.error);publish(initial.data);
}
export function subscribe(fn){channel.addEventListener('message',({data})=>{if(data.kind==='state')fn(data.state);});channel.postMessage({kind:'hello'});}
export const latest=()=>current;
