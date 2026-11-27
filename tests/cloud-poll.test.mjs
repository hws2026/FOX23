import assert from 'node:assert/strict';
import {test} from 'node:test';
globalThis.location={origin:'https://example.test'};
const {createSharedRPC}=await import('../cloud/sync.js');
const {applyChanges}=await import('../cloud/delta.js');
const clone=structuredClone;

function fixture({owner='A',controllerId='A',readOnly=false}={}){
 const initial={state:{revision:1,teams:{},game:{score:0},program:{graphic:{type:'intro'}},cloudControl:{id:owner}},library:{logo:'unchanged'}};
 const store={version:1,snapshot:clone(initial),saves:0,failSave:false,loseResponse:false};
 const engine={snapshot:clone(initial),loads:0,states:0,actions:0,expire:false,failAction:false,throwAction:false,forced204:false};
 const db={
  async head(){return{version:store.version};},
  async read(){return{version:store.version,snapshot:clone(store.snapshot)};},
  async save(version,next,edits){
   if(store.failSave){store.failSave=false;throw Error('Save unavailable');}
   if(version!==store.version)return null;
   assert.deepEqual(applyChanges(store.snapshot,edits),next);
   store.snapshot=clone(next);store.version++;store.saves++;
   if(store.loseResponse){store.loseResponse=false;throw Error('Response lost');}
   return store.version;
  }
 };
 async function local(request){
  if(request.endpoint==='cloud_load'){engine.loads++;engine.snapshot=clone(request.snapshot);return{status:200};}
  if(request.endpoint==='cloud_snapshot')return clone(engine.snapshot);
  if(request.endpoint==='state'){
   engine.states++;
   if(engine.expire){engine.expire=false;engine.snapshot.state.revision++;engine.snapshot.state.program.graphic={type:'none'};}
   if(engine.forced204||Number(request.query?.since)===engine.snapshot.state.revision)return{status:204};
   return{status:200,data:clone(engine.snapshot.state)};
  }
  if(request.endpoint==='action'){
   engine.actions++;
   engine.snapshot.state.game.score++;engine.snapshot.state.revision++;
   if(engine.throwAction){engine.throwAction=false;throw Error('Worker failure');}
   if(engine.failAction){engine.failAction=false;return{status:400,data:{error:'Rejected action'}};}
   return{status:200,data:clone(engine.snapshot.state)};
  }
  throw Error('Unexpected endpoint');
 }
 return{store,engine,rpc:createSharedRPC(local,db,{controllerId,readOnly})};
}
const poll=since=>({endpoint:'state',query:{since}});
const action={endpoint:'action',body:{action:'score',payload:{},revision:1}};

test('confirmed unchanged polls reuse loaded worker state',async()=>{
 const {rpc,engine,store}=fixture();
 for(let i=0;i<4;i++)assert.equal((await rpc(poll('1'))).status,204);
 assert.equal(engine.loads,1);assert.equal(engine.states,4);assert.equal(store.saves,0);
});
test('failed cloud save reloads and discards speculative action',async()=>{
 const {rpc,engine,store}=fixture();await rpc(poll(1));store.failSave=true;
 await assert.rejects(rpc(action),/Action not confirmed/);assert.equal(engine.snapshot.state.game.score,1);
 assert.equal((await rpc(poll(1))).status,204);assert.equal(engine.loads,2);assert.equal(engine.snapshot.state.game.score,0);assert.equal(store.saves,0);
 await rpc(poll(1));assert.equal(engine.loads,2);
});
test('explicit action rejection reloads any local side effects',async()=>{
 const {rpc,engine,store}=fixture();await rpc(poll(1));engine.failAction=true;
 assert.equal((await rpc(action)).status,400);await rpc(poll(1));
 assert.equal(engine.loads,2);assert.equal(engine.snapshot.state.game.score,0);assert.equal(store.saves,0);
});
test('worker exception retains rollback on next request',async()=>{
 const {rpc,engine,store}=fixture();await rpc(poll(1));engine.throwAction=true;
 await assert.rejects(rpc(action),/Worker failure/);await rpc(poll(1));
 assert.equal(engine.loads,2);assert.equal(engine.snapshot.state.game.score,0);assert.equal(store.saves,0);
});
test('lost save response reloads confirmed result without replay',async()=>{
 const {rpc,engine,store}=fixture();await rpc(poll(1));store.loseResponse=true;
 await assert.rejects(rpc(action),/Response lost/);const result=await rpc(poll(1));
 assert.equal(result.data.game.score,1);assert.equal(engine.loads,2);assert.equal(engine.actions,1);assert.equal(store.saves,1);
});
test('timer expiry from state read still commits',async()=>{
 const {rpc,engine,store}=fixture();await rpc(poll(1));engine.expire=true;
 const result=await rpc(poll(1));assert.equal(result.status,200);assert.equal(result.data.program.graphic.type,'none');
 assert.equal(store.saves,1);assert.equal(store.snapshot.state.revision,2);
 await rpc(poll(2));await rpc(poll(2));assert.equal(engine.loads,1);
});
test('unfamiliar 204 revision does not clear dirty recovery',async()=>{
 const {rpc,engine}=fixture();await rpc(poll(1));engine.forced204=true;
 await rpc(poll(99));await rpc(poll(1));assert.equal(engine.loads,2);
});
test('watching controller remains passive and cannot send actions',async()=>{
 const {rpc,engine,store}=fixture({owner:'B'});
 for(let i=0;i<3;i++)assert.equal((await rpc(poll(1))).status,200);
 assert.equal((await rpc(action)).status,423);assert.equal(rpc.hasControl,false);
 assert.equal(engine.loads,1);assert.equal(engine.states,0);assert.equal(engine.actions,0);assert.equal(store.saves,0);
});
test('read-only output polling and action rejection remain unchanged',async()=>{
 const {rpc,engine,store}=fixture({readOnly:true,controllerId:null});
 await rpc(poll(1));await rpc(poll(1));await assert.rejects(rpc(action),/read-only/);
 assert.equal(engine.loads,1);assert.equal(engine.actions,0);assert.equal(store.saves,0);
});
