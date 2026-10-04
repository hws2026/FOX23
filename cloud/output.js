import {connectCloud} from './sync.js?v=cloud226';
// This reader never executes controller actions or writes show snapshots.
export function snapshotReader(){
 let snapshot;
 return async request=>{
  if(request.endpoint==='cloud_load'){snapshot=request.snapshot;return {status:200};}
  if(request.endpoint==='state'&&snapshot)return {status:200,data:{...snapshot.state,serverTime:Date.now()/1000}};
  throw Error('Cloud output is read-only.');
 };
}
export function followShow(rpc,accept,{schedule=setTimeout,cancel=clearTimeout,onStatus=()=>{},onAuthRequired=()=>{}}={}){
 let stopped=false,timer,failures=0;
 async function tick(){
  try{const result=await rpc({endpoint:'state'});if(stopped)return;if(result.status!==200)throw Error('Show unavailable');accept(result.data);failures=0;onStatus('Connected');}
  catch(error){
   if(stopped)return;
   if(error.code==='CLOUD_AUTH_REQUIRED'){stopped=true;onStatus('Sign in required');onAuthRequired(error);return;}
   failures++;onStatus('Reconnecting: '+error.message);
  }
  if(!stopped)timer=schedule(tick,failures?Math.min(10000,1000*2**Math.min(failures,4)):500);
 }
 tick();return ()=>{stopped=true;cancel(timer);};
}
export async function startCloudOutput(accept){
 let active=true,stop;
 const status=message=>{document.title='WLD Cloud Output — '+message;};
 async function signIn(){
  if(!active)return;
  const box=document.createElement('main');box.id='cloud-output-login';
  box.style.cssText='position:fixed;inset:20px;overflow:auto;z-index:9999;background:#111927;color:white;padding:24px;font:18px Arial;border-radius:12px';
  box.innerHTML='<h1 id="page-title">Cloud OBS output</h1><p id="connection">Sign in using OBS → Interact</p><p>Use your control panel’s show account. This output receives graphics across internet connections without pairing codes. Keep this source off air until sign-in completes.</p><section id="controls"></section>';
  document.body.append(box);
  let rpc;
  try{rpc=await connectCloud(snapshotReader(),{readOnly:true});}
  catch(error){box.querySelector('#connection').textContent=error.message;throw error;}
  box.remove();
  if(!active)return;
  stop=followShow(rpc,accept,{onStatus:status,onAuthRequired:()=>{
   // The old follower stops before displaying a fresh, explicit sign-in form.
   signIn().catch(error=>status(error.message));
  }});
 }
 addEventListener('pagehide',()=>{active=false;stop?.();},{once:true});
 await signIn();
}
