import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const source=fs.readFileSync(new URL('../panel.js',import.meta.url),'utf8');

// Cue saving and confirmed selection
{
const perform=source.split('\n').find(line=>line.startsWith('async function perform('));
const helpers=source.slice(source.indexOf('function cueValueMatches241('),source.indexOf('\n',source.indexOf('async function saveCue(){')));
const selection=source.split('\n').find(line=>line.startsWith('const selectGraphic='));

function fixture(preview,fields={}){
 const calls=[],toasts=[],deleted=[],form={fields};
 const c={state:{revision:10,preview:structuredClone(preview)},busy:0,canControl:()=>true,toast:(...args)=>toasts.push(args),accept:s=>{c.state=s;},releaseUnusedSplitCaptures:()=>{},FormData:class{constructor(form){this.entries=Object.entries(form.fields)}*[Symbol.iterator](){yield* this.entries}get(key){return this.entries.find(([k])=>k===key)?.[1]??null}},$:selector=>selector==='#cue-form'?form:null,readCampaignImages240:async()=>{},imageFile:async()=>{},editableCueStats:cue=>cue.stats||[],navigationDrafts222:{delete:key=>deleted.push(key)},draftKey222:()=> 'cue-draft',render:()=>calls.push(['render']),act:async(action,payload)=>{calls.push([action,structuredClone(payload)]);Object.assign(c.state.preview,payload);},fetch:async()=>{throw Error('Unexpected fetch');}};
 c.trackPreview241=p=>p;
 vm.createContext(c);vm.runInContext(helpers+'\n'+perform+'\n'+selection+'\nthis.selectGraphic=selectGraphic;',c);
 return{c,calls,toasts,deleted,form};
}

test('watch-only action shows recovery message and balances busy without a network call',async()=>{
 const f=fixture({type:'scorebug'});f.c.canControl=()=>false;
 await assert.rejects(f.c.perform('preview',{type:'breaking'}),/Choose Take control/);
 assert.equal(f.toasts.length,1);assert.match(f.toasts[0][0],/Choose Take control/);assert.equal(f.toasts[0][1],true);assert.equal(f.c.busy,0);
});

test('unchanged confirmed cue avoids a cloud save and clears its retained draft',async()=>{
 const f=fixture({type:'breaking',team:'away',title:'News',transition:'auto'},{title:'News',transition:'auto'});
 await f.c.saveCue();assert.deepEqual(f.calls,[]);assert.deepEqual(f.deleted,['cue-draft']);assert.equal(f.c.state.revision,10);
});

test('numeric, boolean and nested stat form values match their confirmed values',()=>{
 const f=fixture({type:'scorebug'});
 assert.equal(f.c.cuePayloadMatches241({announcerCount:'3',tier1Yellow:'true',stats:[{label:'YARDS',away:'120',home:'96'}]},{announcerCount:3,tier1Yellow:true,stats:[{label:'YARDS',away:120,home:96}]}),true);
 assert.equal(f.c.cuePayloadMatches241({tier1Yellow:'false'},{tier1Yellow:true}),false);
 assert.equal(f.c.cuePayloadMatches241({title:''},{}),false);
 assert.equal(f.c.cuePayloadMatches241({title:''},{title:null}),false);
 assert.equal(f.c.cuePayloadMatches241({stats:[]},{stats:[{label:'YARDS'}]}),false);
});

test('changed form fields still save before clearing their draft',async()=>{
 const f=fixture({type:'scorebug',title:'Old'},{title:'New'});
 await f.c.saveCue();assert.deepEqual(f.calls,[['preview',{title:'New'}]]);assert.equal(f.c.state.preview.title,'New');assert.equal(f.deleted.length,1);
});

test('new default fields and uploaded campaign images are not skipped',async()=>{
 const f=fixture({type:'scorebug'},{title:''});await f.c.saveCue();assert.deepEqual(f.calls,[['preview',{title:''}]]);
 const g=fixture({type:'inspirechange',campaignImage:'old.png'},{campaignImage:'old.png'});
 g.c.readCampaignImages240=async(form,payload)=>{payload.campaignImage='data:image/png;base64,new';};
 await g.c.saveCue();assert.deepEqual(g.calls,[['preview',{campaignImage:'data:image/png;base64,new'}]]);
});

test('selecting Scorebug from an unchanged form makes one committed preview action',async()=>{
 const f=fixture({type:'breaking',title:'News'},{title:'News'});
 await f.c.selectGraphic('scorebug');assert.deepEqual(f.calls,[['preview',{type:'scorebug'}],['render']]);assert.equal(f.c.state.preview.type,'scorebug');
});

test('changed form is saved before new selection and neither is presented optimistically',async()=>{
 const f=fixture({type:'breaking',title:'Old'},{title:'New'});let release;
 f.c.act=(action,payload)=>new Promise(resolve=>{f.calls.push([action,structuredClone(payload)]);release=()=>{Object.assign(f.c.state.preview,payload);resolve();};});
 const pending=f.c.selectGraphic('scorebug');await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(f.calls,[['preview',{title:'New'}]]);assert.equal(f.c.state.preview.title,'Old');assert.equal(f.c.state.preview.type,'breaking');
 release();await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(f.calls,[['preview',{title:'New'}],['preview',{type:'scorebug'}]]);assert.equal(f.c.state.preview.type,'breaking');
 release();await pending;assert.equal(f.c.state.preview.type,'scorebug');assert.deepEqual(f.calls.at(-1),['render']);
});

test('failed save prevents selection and retains form draft',async()=>{
 const f=fixture({type:'breaking',title:'Old'},{title:'New'});f.c.act=async(action,payload)=>{f.calls.push([action,structuredClone(payload)]);throw Error('Cloud unavailable');};
 await f.c.selectGraphic('scorebug');assert.deepEqual(f.calls,[['preview',{title:'New'}]]);assert.equal(f.c.state.preview.type,'breaking');assert.deepEqual(f.deleted,[]);
});
}


// Manual playlist actions and timed playback cancellation
{
const lines=source.split('\n');
const wiring=lines.find(line=>line.startsWith('const playlist=createPlaylist('));
const act=lines.find(line=>line.startsWith('function act('));
const stop=lines.find(line=>line.startsWith('function stopLineup('));

function fixture(){
 let release;const calls=[],pending=new Promise(resolve=>release=resolve);
 const context={queue:pending,lineupRun:4,lineupTimer:null,state:{preview:{type:'storytease'}},tab:'playlist',esc:String,graphicNames:{},render(){},toast(){},$:()=>null,clearTimeout(){},trackPreview241:p=>p,createPlaylist:options=>({...options,pause(){}}),perform:async(action,payload)=>{calls.push([action,structuredClone(payload)]);if(action==='preview')Object.assign(context.state.preview,payload);}};
 vm.createContext(context);vm.runInContext(stop+'\n'+act+'\n'+wiring+'\nthis.dispatchPlaylist=playlist.act;',context);
 return{context,calls,release};
}

test('manual Load to preview survives lineup cancellation while queued behind a cloud save',async()=>{
 const f=fixture(),pending=f.context.dispatchPlaylist('preview',{type:'breaking',newsText:'Latest update'});
 assert.equal(f.context.state.preview.type,'storytease');
 f.context.stopLineup();f.release();await pending;
 assert.deepEqual(f.calls,[['preview',{type:'breaking',newsText:'Latest update'}]]);
 assert.equal(f.context.state.preview.type,'breaking');
});

test('manual playlist edits survive unrelated lineup cancellation',async()=>{
 const f=fixture(),pending=f.context.dispatchPlaylist('playlist_save',{items:[]});
 f.context.stopLineup();f.release();await pending;
 assert.deepEqual(f.calls,[['playlist_save',{items:[]}]]);
});

test('pending playlist playback remains cancellable before it can go on air',async()=>{
 for(const action of ['playlist_take','hide','countdown_visibility','qb_stats_visibility','bug']){
  const f=fixture(),pending=f.context.dispatchPlaylist(action,{id:'news',visible:false});
  f.context.stopLineup();f.release();await assert.rejects(pending,/Lineup playback stopped/);
  assert.deepEqual(f.calls,[],action);
 }
});

test('valid playlist playback runs when no cancellation happened',async()=>{
 const f=fixture(),pending=f.context.dispatchPlaylist('playlist_take',{id:'news'});
 f.release();await pending;assert.deepEqual(f.calls,[['playlist_take',{id:'news'}]]);
});
}


// Pending and failed preview status lifecycle
{
const lines=source.split('\n');
const status=source.slice(source.indexOf('let previewPending241='),source.indexOf('function accept(s){'));
const act=lines.find(line=>line.startsWith('function act('));
const wiring=lines.find(line=>line.startsWith('const playlist=createPlaylist('));
const selection=lines.find(line=>line.startsWith('const selectGraphic='));
const turn=()=>new Promise(resolve=>setImmediate(resolve));

function fixture(){
 const requests=[],label={textContent:'Ready for air',style:{},setAttribute(k,v){this[k]=v;}};
 const context={queue:Promise.resolve(),lineupRun:0,state:{preview:{type:'storytease'}},tab:'playlist',esc:String,graphicNames:{},stopLineup(){context.lineupRun++;},render(){},toast(){},saveCue:async()=>{},$:selector=>selector==='.preview-monitor .monitor-footer>span'?label:null,createPlaylist:options=>({...options,pause(){}}),perform:(action,payload)=>new Promise((resolve,reject)=>requests.push({action,payload,reject,finish(){if(action==='preview')context.state.preview={...context.state.preview,...payload};resolve(context.state);}}))};
 vm.createContext(context);vm.runInContext(status+'\n'+act+'\n'+wiring+'\n'+selection+'\nthis.playlistAction=playlist.act;this.selectGraphic=selectGraphic;',context);
 return{context,requests,label};
}

test('preview shows Loading immediately while waiting behind another save',async()=>{
 const f=fixture(),save=f.context.act('bottom_scores',{games:[]});await turn();
 const preview=f.context.act('preview',{type:'scorebug'});
 assert.equal(f.label.textContent,'Loading preview…');assert.equal(f.label.role,'status');assert.equal(f.label['aria-live'],'polite');
 assert.equal(f.requests.length,1);assert.equal(f.context.state.preview.type,'storytease');
 f.requests[0].finish();await save;await turn();
 assert.equal(f.requests.length,2);assert.equal(f.label.textContent,'Loading preview…');assert.equal(f.context.state.preview.type,'storytease');
 f.requests[1].finish();await preview;
 assert.equal(f.context.state.preview.type,'scorebug');assert.equal(f.label.textContent,'Ready for air');
});

test('multiple queued preview choices never report Ready until the final one settles',async()=>{
 const f=fixture(),first=f.context.act('preview',{type:'scorebug'}),second=f.context.act('preview',{type:'breaking'});await turn();
 f.requests[0].finish();await first;await turn();
 assert.equal(f.context.state.preview.type,'scorebug');assert.equal(f.label.textContent,'Loading preview…');
 f.requests[1].finish();await second;
 assert.equal(f.context.state.preview.type,'breaking');assert.equal(f.label.textContent,'Ready for air');
});

test('failed preview remains visibly failed through unrelated actions until successful retry',async()=>{
 const f=fixture(),failed=f.context.act('preview',{type:'scorebug'});const rejected=assert.rejects(failed,/Cloud save unavailable/);await turn();
 f.requests[0].reject(Error('Cloud save unavailable'));await rejected;
 assert.equal(f.label.textContent,'Preview failed: Cloud save unavailable');assert.equal(f.label.style.color,'#ff9b87');assert.equal(f.context.state.preview.type,'storytease');
 const score=f.context.act('score',{team:'away',delta:1});await turn();f.requests[1].finish();await score;
 assert.equal(f.label.textContent,'Preview failed: Cloud save unavailable');
 const retry=f.context.act('preview',{type:'scorebug'});assert.equal(f.label.textContent,'Loading preview…');await turn();
 f.requests[2].finish();await retry;
 assert.equal(f.label.textContent,'Ready for air');assert.equal(f.label.style.color,'');
});

test('manual playlist Load to preview uses the same immediate status without going on air',async()=>{
 const f=fixture(),load=f.context.playlistAction('preview',{type:'breaking'});
 assert.equal(f.label.textContent,'Loading preview…');assert.equal(f.context.state.preview.type,'storytease');await turn();
 assert.equal(f.requests[0].action,'preview');f.requests[0].finish();await load;
 assert.equal(f.label.textContent,'Ready for air');assert.equal(f.context.state.preview.type,'breaking');assert.equal(f.requests.length,1);
});

test('a failed earlier choice followed by a successful choice ends Ready for the confirmed choice',async()=>{
 const f=fixture(),first=f.context.act('preview',{type:'scorebug'});const rejected=assert.rejects(first,/failed/);
 const second=f.context.act('preview',{type:'breaking'});await turn();f.requests[0].reject(Error('First request failed'));await rejected;await turn();
 assert.equal(f.label.textContent,'Loading preview…');f.requests[1].finish();await second;
 assert.equal(f.label.textContent,'Ready for air');assert.equal(f.context.state.preview.type,'breaking');
});

test('graphic selection stays Loading throughout image/form preparation and nested saves',async()=>{
 const f=fixture();let finishPreparation;
 f.context.saveCue=async()=>{await new Promise(resolve=>finishPreparation=resolve);await f.context.act('preview',{title:'Changed form'});};
 const selected=f.context.selectGraphic('scorebug');
 assert.equal(f.label.textContent,'Loading preview…');assert.equal(f.requests.length,0);assert.equal(f.context.state.preview.type,'storytease');
 finishPreparation();await turn();assert.equal(f.requests.length,1);
 f.requests[0].finish();await turn();
 assert.equal(f.label.textContent,'Loading preview…');assert.equal(f.requests.length,2);assert.equal(f.context.state.preview.type,'storytease');
 f.requests[1].finish();await selected;
 assert.equal(f.label.textContent,'Ready for air');assert.equal(f.context.state.preview.type,'scorebug');
});

test('a preparation error stays visible even when selection handler consumes the rejection',async()=>{
 const f=fixture();f.context.saveCue=async()=>{throw Error('Image upload could not be read');};
 await f.context.selectGraphic('scorebug');
 assert.equal(f.label.textContent,'Preview failed: Image upload could not be read');assert.equal(f.requests.length,0);assert.equal(f.context.state.preview.type,'storytease');
});

test('playlist Load to preview queues during active playback work and cancels further autoplay',async()=>{
 const f=fixture(),rows=[{id:'news',name:'News',seconds:5,cue:{type:'breaking'}}],buttons=new Map(),rowButtons=new Map(),timers=[],toasts=[];
 f.context.state.program={playlist:rows,takeId:1,graphic:{type:'none'}};
 f.context.document={querySelector:()=>null};f.context.setTimeout=(fn,ms)=>{timers.push({fn,ms});return timers.length;};f.context.clearTimeout=()=>{};
 const node=(map,key)=>{if(!map.has(key))map.set(key,{});return map.get(key);};
 const row={dataset:{plRow:'news'},querySelector:key=>node(rowButtons,key),querySelectorAll:()=>[]};
 const root={querySelector:key=>node(buttons,key),querySelectorAll:()=>[row]};
 const playlistSource=fs.readFileSync(new URL('../playlist.js',import.meta.url),'utf8').replace('export function createPlaylist','function createPlaylist');
 const createPlaylist=vm.runInContext('('+playlistSource+')',f.context);
 const playlist=createPlaylist({getState:()=>f.context.state,act:f.context.playlistAction,stopLineup:f.context.stopLineup,esc:String,graphicNames:{},render(){},toast:(...args)=>toasts.push(args)});
 playlist.bind(root);
 const playback=playlist.control('play');await turn();assert.equal(f.requests[0].action,'playlist_take');
 await rowButtons.get('[data-pl-delete]').onclick();assert.equal(f.requests.length,1,'destructive row edits retain the existing busy guard');
 const load=rowButtons.get('[data-pl-load]').onclick();
 assert.equal(f.label.textContent,'Loading preview…');assert.equal(f.requests.length,1,'preview waits in the same serialized queue');
 f.requests[0].finish();await playback;await turn();
 assert.equal(timers.length,0,'manual preview selection paused future autoplay');assert.equal(f.requests.length,2);assert.equal(f.requests[1].action,'preview');
 assert.equal(f.context.state.preview.type,'storytease');f.requests[1].finish();await load;
 assert.equal(f.context.state.preview.type,'breaking');assert.equal(f.label.textContent,'Ready for air');assert.equal(toasts.at(-1)[0],'Loaded into preview. Edit it in the graphics library.');
});
}
