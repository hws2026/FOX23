export const base=new URL('.',import.meta.url);
export const channel=new BroadcastChannel('gridiron-pages:'+base.pathname);
const originalFetch=globalThis.fetch.bind(globalThis);let worker,sequence=0,pending=new Map(),current,readyResolve;
export const ready=new Promise(r=>readyResolve=r);
export function rpc(request){return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});worker.postMessage({id,request});});}
function publish(state){current=state;channel.postMessage({kind:'state',state});dispatchEvent(new CustomEvent('gridiron-state',{detail:state}));}
export async function startController(){
 let acquired;
 await new Promise(resolve=>navigator.locks.request('gridiron-controller:'+base.pathname,{ifAvailable:true},async lock=>{
  acquired=!!lock;resolve();if(!lock)return;
  worker=new Worker(new URL('runtime-worker.js?v=deck2',base));
  worker.onmessage=({data})=>{const p=pending.get(data.id);if(!p)return;pending.delete(data.id);data.error?p.reject(Error(data.error)):p.resolve(data.result);};
  worker.onerror=e=>{for(const p of pending.values())p.reject(Error(e.message));pending.clear();};
  readyResolve();await new Promise(()=>{});
 }));
 if(!acquired)throw Error('A control panel is already open for this site. Use that tab, or close it before opening another.');
 await ready;
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
   try{const {commands}=await import('./commands.js?v=deck2');const command=commands[data.command];if(!command)throw Error('Unknown button');
    let result;for(let attempt=0;attempt<3;attempt++){const first=await rpc({endpoint:'state'});result=await rpc({endpoint:'action',body:{action:command[0],payload:command[1],revision:first.data.revision}});if(result.status!==409)break;}
    if(result.status!==200)throw Error(result.data.error);publish(result.data);channel.postMessage({kind:'ack',id:data.id});
   }catch(e){channel.postMessage({kind:'ack',id:data.id,error:e.message});}
  }
 };
 const initial=await rpc({endpoint:'state'});if(initial.status!==200)throw Error(initial.data.error);publish(initial.data);
}
export function subscribe(fn){channel.addEventListener('message',({data})=>{if(data.kind==='state')fn(data.state);});channel.postMessage({kind:'hello'});}
export const latest=()=>current;
