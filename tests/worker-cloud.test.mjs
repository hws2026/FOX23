import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync(new URL('../runtime-worker.js',import.meta.url),'utf8');
const clone=structuredClone;

async function worker(cloud){
 const initial={state:{revision:1,teams:{},game:{},program:{},preview:{type:'intro'},asset:'data:image/png;base64,'+'a'.repeat(120000)},library:{team:{logo:'original'}}};
 let current=clone(initial),checkpoint,pendingCheckpoint,globals={};
 const commands=[],messages=[],writes=[],transactions=[];
 const engine={FS:{mkdirTree(){},writeFile(){}},globals:{set(k,v){globals[k]=v}},runPythonAsync:async()=>{},runPython(command){
  commands.push(command);
  if(command==='core.pages_snapshot()')return JSON.stringify(current);
  if(command==='core.pages_request(request_json)'){
   const request=JSON.parse(globals.request_json);
   if(request.fail)return JSON.stringify({status:400,data:{error:'Invalid cue'}});
   if(request.endpoint==='action'){current.state.revision++;current.state.preview={type:request.type};}
   if(request.endpoint==='state'&&request.query?.since===current.state.revision)return JSON.stringify({status:204});
   return JSON.stringify({status:200,data:current.state});
  }
  if(command.startsWith('worker_checkpoint231 = (')){checkpoint=clone(current);return;}
  if(command.startsWith('worker_pending231 = (')){pendingCheckpoint=clone(current);return;}
  if(command.startsWith('worker_checkpoint231 = worker_pending231')){checkpoint=pendingCheckpoint;return;}
  if(command.startsWith('worker_state231, worker_library231, worker_teams231')){current=clone(checkpoint);return;}
  if(command.startsWith('cloud_snapshot =')){current=JSON.parse(globals.cloud_snapshot_json);return;}
  throw Error('Unhandled Python command '+command);
 }};
 const db={transaction(){const tx={objectStore(){return{get(){const r={result:clone(initial)};queueMicrotask(()=>r.onsuccess());return r;},put(value){writes.push(clone(value));transactions.push(tx);}}}};return tx;}};
 const context=vm.createContext({URL,JSON,Promise,Error,console,location:{href:'https://example.test/runtime-worker.js'+(cloud?'?cloud=1':'')},importScripts(){},fetch:async()=>({ok:true,text:async()=>''}),indexedDB:{open(){const r={result:db};queueMicrotask(()=>r.onsuccess());return r;}},loadPyodide:async()=>engine,postMessage(m){if(m.id)messages.push(clone(m));}});
 vm.runInContext(code,context);await vm.runInContext('ready',context);let id=0;
 return{initial,commands,messages,writes,get current(){return current;},
  send(request){context.msg={id:++id,request};vm.runInContext('onmessage({data:msg})',context);return id;},
  async settle(){for(let i=0;i<15;i++)await Promise.resolve();},
  async drain(){await vm.runInContext('queue',context);},
  async commit(error){assert(transactions.length);const tx=transactions.shift();if(error){tx.error=error;tx.onerror();}else tx.oncomplete();await vm.runInContext('queue',context);}
 };
}
let passed=0;
const check=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
const cloud=await worker(true);
cloud.send({endpoint:'state'});await cloud.drain();
check('cloud state returns data without discarded snapshot',()=>{assert.equal(cloud.messages.at(-1).result.data.preview.type,'intro');assert.equal(cloud.commands.filter(c=>c==='core.pages_snapshot()').length,0);});
cloud.send({endpoint:'state',query:{since:1}});await cloud.drain();
check('unchanged cloud poll skips snapshot work',()=>{assert.equal(cloud.messages.at(-1).result.status,204);assert.equal(cloud.commands.filter(c=>c==='core.pages_snapshot()').length,0);});
cloud.send({endpoint:'action',type:'scorebug'});await cloud.drain();
check('cloud action returns edit without discarded snapshot',()=>{assert.equal(cloud.messages.at(-1).result.data.preview.type,'scorebug');assert.equal(cloud.commands.filter(c=>c==='core.pages_snapshot()').length,0);assert.equal(cloud.writes.length,0);});
cloud.send({endpoint:'cloud_snapshot'});await cloud.drain();
check('explicit cloud snapshot retains complete state and library',()=>{assert.deepEqual(cloud.messages.at(-1).result,cloud.current);assert.equal(cloud.messages.at(-1).result.state.asset,cloud.initial.state.asset);assert.equal(cloud.commands.filter(c=>c==='core.pages_snapshot()').length,1);});
cloud.send({endpoint:'action',fail:true});await cloud.drain();
check('cloud validation failure stays a failure without snapshot work',()=>{assert.equal(cloud.messages.at(-1).result.status,400);assert.equal(cloud.commands.filter(c=>c==='core.pages_snapshot()').length,1);});
const replacement=clone(cloud.initial);replacement.state.preview.type='breaking';
cloud.send({endpoint:'cloud_load',snapshot:replacement});await cloud.drain();cloud.send({endpoint:'cloud_snapshot'});await cloud.drain();
check('cloud reload and later snapshot preserve confirmed replacement',()=>assert.deepEqual(cloud.messages.at(-1).result,replacement));

const local=await worker(false);
local.send({endpoint:'state'});await local.settle();
check('local initial state waits for storage confirmation',()=>{assert.equal(local.messages.length,0);assert.equal(local.writes.length,1);});
await local.commit();
local.send({endpoint:'state',query:{since:1}});await local.drain();
check('unchanged local poll preserves no-op persistence',()=>{assert.equal(local.writes.length,1);assert.equal(local.messages.at(-1).result.status,204);});
local.send({endpoint:'action',type:'scorebug'});await local.settle();
check('local action still waits for durable save',()=>{assert.equal(local.messages.length,2);assert.equal(local.writes.at(-1).state.preview.type,'scorebug');});
await local.commit();
check('local committed action publishes saved result',()=>assert.equal(local.messages.at(-1).result.data.preview.type,'scorebug'));
local.send({endpoint:'action',type:'breaking'});await local.settle();await local.commit(Error('quota exceeded'));
check('local save failure still rolls back',()=>{assert.match(local.messages.at(-1).error,/quota/);assert.equal(local.current.state.preview.type,'scorebug');});
const savedCount=local.writes.length;local.send({endpoint:'state'});await local.drain();
check('later poll cannot persist rejected local edit',()=>{assert.equal(local.writes.length,savedCount);assert.equal(local.messages.at(-1).result.data.preview.type,'scorebug');});
console.log(`${passed} worker regression checks passed`);
