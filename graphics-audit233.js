import {renderGraphics,updateClocks,graphicNames} from './graphics.js?v=update239';
import {caseState233,updateFixture233} from './graphics-audit233-model.js?v=update239';

const $=id=>document.getElementById(id),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const data=await fetch('./graphics-audit233-data.json?v=update239').then(r=>{if(!r.ok)throw Error('Audit inventory did not load ('+r.status+').');return r.json();}).catch(error=>{$('status').textContent='Audit inventory failed to load.';$('error').hidden=false;$('error').textContent=error.message;throw error;});
let stage=$('stage'),content,current,selected,filtered=[],run=0,frozen=false,cueOverride=null,lastAction='hold';
const reviews=new Map(),errors=[];
const options=()=>({surface:$('surface').value,motion:$('motion').value,scale:$('scale').value,logos:$('logos').checked,bottom:$('bottom').checked,feed:$('feed').checked,mainBug:$('mainBug').checked,countdown:$('countdown').checked,sideStats:$('sideStats').checked,feedSlot:$('feedSlot').value,customCue:cueOverride?structuredClone(cueOverride):null});
const context=()=>JSON.stringify(options());
const recordKey=(entry,phase)=>JSON.stringify([entry.id,phase,context()]);
function status(text){$('status').textContent=text;}
function showError(error){const text=String(error?.stack||error?.message||error);errors.push({time:new Date().toISOString(),case:selected?.id,text});$('error').hidden=false;$('error').textContent=text;status('Rendering error — this case is not verified.');}
addEventListener('error',event=>{if(event.message)showError(event.error||event.message);},false);
addEventListener('unhandledrejection',event=>showError(event.reason));
function fit(){
 const viewport=$('audit233-viewport'),canvas=$('audit233-canvas'),choice=$('scale').value;
 const scale=choice==='fit'?Math.max(.05,Math.min(viewport.clientWidth/1920,innerHeight*.68/1080)):Number(choice);
 canvas.style.width=1920*scale+'px';canvas.style.height=1080*scale+'px';
 stage.style.transformOrigin='0 0';stage.style.transform=`scale(${scale})`;stage.style.left='0';stage.style.top='0';
}
new ResizeObserver(fit).observe($('audit233-viewport'));addEventListener('resize',fit);
function animationList(root){
 const list=[...root.getAnimations({subtree:true})];
 for(const node of root.querySelectorAll('*'))if(node.shadowRoot)list.push(...animationList(node.shadowRoot));
 return [...new Set(list)];
}
function resetStage(){
 for(const a of animationList(stage))a.cancel();
 const next=document.createElement('div');next.id='stage';next.className='stage';stage.replaceWith(next);stage=next;
 content=document.createElement('div');content.className='broadcast-content209';content.style.cssText='position:absolute;inset:0;transition:transform 420ms cubic-bezier(.4,0,.2,1)';stage.append(content);frozen=false;fit();
}
function render(){
 content.style.transform=current.bottomScores.visible?'translateY(-58px)':'translateY(0)';
 renderGraphics(content,current,$('surface').value==='preview');updateClocks(content,current);
 diagnostics();
}
function loadCurrent(){
 resetStage();current=caseState233(data,selected,{...options(),cue:cueOverride||selected.cue});render();
}
function diagnostics(){
 const motions=animationList(stage).map(a=>({name:a.animationName||a.id||'Web Animation',state:a.playState,currentTime:Math.round(Number(a.currentTime)||0),duration:a.effect?.getComputedTiming().duration}));
 $('diagnostics').textContent=JSON.stringify({case:selected.id,options:options(),frozen,phase:lastAction,animationCount:motions.length,animations:motions,cue:current?.preview,game:current?.game,sourceStatePatch:selected.statePatch},null,2);
}

// Freeze a copy rather than changing global timers. Renderer callbacks retain
// references to the removed live tree and cannot remove nodes from this copy.
// CSS pseudo-elements and shadow-DOM scorebugs are captured as well.
function freezeVisible(){
 if(!current||frozen)return;
 const props=new Set(['opacity','transform','transform-origin','translate','rotate','scale','clip-path','filter','visibility','width','height','max-height','min-height','flex-grow','padding-left','padding-right','border-right-width','background-position','background-size','mask-position','mask-size','offset-distance']);
 const animated=new Map();
 for(const a of animationList(stage)){
  try{a.pause();const target=a.effect?.target;if(target){const set=animated.get(target)||new Set();for(const frame of a.effect.getKeyframes())for(const key of Object.keys(frame))if(!['offset','computedOffset','easing','composite'].includes(key))set.add(key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()));animated.set(target,set);}}catch{}
 }
 let serial=0;
 function cloneTree(source,rules){
  const copy=source.cloneNode(false);if(source.nodeType!==1)return copy;
  const id='a233-'+(++serial);copy.setAttribute('data-audit233-freeze',id);
  const capture=(pseudo)=>{const cs=getComputedStyle(source,pseudo),set=new Set([...props,...(animated.get(source)||[])]);return [...set].map(name=>[name,cs.getPropertyValue(name)]).filter(([,value])=>value);};
  for(const [name,value]of capture(null))copy.style.setProperty(name,value,'important');
  copy.style.setProperty('animation','none','important');copy.style.setProperty('transition','none','important');
  for(const pseudo of ['::before','::after']){
   const cs=getComputedStyle(source,pseudo);if(cs.content==='none'||cs.content==='normal')continue;
   const values=capture(pseudo).map(([name,value])=>`${name}:${value}!important`).join(';');
   rules.push(`:is(#audit233-specificity,[data-audit233-freeze="${id}"])${pseudo}{${values};animation:none!important;transition:none!important}`);
  }
  for(const child of source.childNodes)copy.append(cloneTree(child,rules));
  if(source.shadowRoot){const shadowRules=[],shadow=copy.attachShadow({mode:'open'});for(const child of source.shadowRoot.childNodes)shadow.append(cloneTree(child,shadowRules));const style=document.createElement('style');style.textContent=shadowRules.join('\n');shadow.append(style);}
  return copy;
 }
 const rules=[],copy=cloneTree(stage,rules),style=document.createElement('style');style.textContent=rules.join('\n');copy.append(style);
 stage.replaceWith(copy);stage=copy;content=null;frozen=true;fit();diagnostics();
}
function out(){
 current=structuredClone(current);current.preview={...current.preview,type:'none'};current.program.graphic={type:'none'};current.program.bug=false;current.program.qbStats.visible=false;current.program.countdown.visible=false;current.program.takeId++;
 current.bottomScores.visible=false;current.bottomScores.feedBugVisible=false;render();
}
async function prepare(phase,token,fresh){
 const rebuilt=fresh||!current||frozen;if(rebuilt)loadCurrent();
 if(['exit','content-update','interrupted-exit'].includes(phase)&&rebuilt){status('Preparing the held graphic…');await sleep(1800);if(token!==run)return false;}
 if(phase==='content-update'){current=updateFixture233(current);render();}
 if(phase==='exit')out();
 if(phase==='interrupted-exit'){
  const returnState=structuredClone(current);out();setTimeout(()=>{if(token!==run||frozen)return;current=returnState;current.program.takeId+=2;render();},120);
 }
 lastAction=phase;$('reviewStage').value=phase;diagnostics();return true;
}
async function action(phase,{sample=false,fresh=false}={}){
 const token=++run;$('error').hidden=true;
 try{
  if(!await prepare(phase,token,fresh||phase==='entrance'||phase==='hold'))return;
  const requested=phase==='hold'?2000:Math.max(0,Math.min(10000,Number($('sampleTime').value)||0));
  status(`${selected.id} · ${options().surface} · ${phase}${sample||phase==='hold'?` · sampling after ${requested}ms`:' · playing'} · unverified`);
  if(sample||phase==='hold'){
   const start=performance.now();await sleep(requested);if(token!==run)return;const elapsed=performance.now()-start;freezeVisible();
   status(`${selected.id} · ${phase} · frozen at ${Math.round(elapsed)}ms after stage start (requested ${requested}ms) · unverified`);
  }
 }catch(error){showError(error);}
}
function caseTitle(entry){return `${graphicNames[entry.type]||entry.type} · ${entry.variant}`;}
function selectCase(id){
 selected=data.cases.find(c=>c.id===id)||filtered[0]||data.cases[0];$('cue').value=selected.id;cueOverride=null;$('cueJson').value=JSON.stringify(selected.cue,null,2);
 $('scope').textContent=`${selected.id} · ${data.types.length} types / ${data.cases.length} variants. ${selected.type==='splitview'?'Split-source settings are inventoried, but this page disconnects all media. ':''}${selected.type==='none'?'The none case intentionally has no primary graphic. ':''}No visual check is implied by selecting or playing this case.`;
 refreshChecklist();action('entrance',{fresh:true});
}
function filterCases(){
 const type=$('type').value,query=$('filter').value.toLowerCase();filtered=data.cases.filter(c=>(type==='all'||c.type===type)&&`${c.id} ${caseTitle(c)}`.toLowerCase().includes(query));
 $('cue').replaceChildren();for(const entry of filtered){const o=document.createElement('option');o.value=entry.id;o.textContent=caseTitle(entry);$('cue').append(o);}
 if(!filtered.length){status('No matching variants.');return;}
 selectCase(filtered.some(c=>c.id===selected?.id)?selected.id:filtered[0].id);
}
function refreshChecklist(){
 const counts={pass:0,fail:0};for(const value of reviews.values())if(value.status in counts)counts[value.status]++;
 $('coverage').textContent=`${data.cases.length*data.stages.length*data.surfaces.length} planned stage/surface slots. This session: ${counts.pass} visual checks recorded, ${counts.fail} issues; all unmarked combinations remain unverified. Motion, scale and overlay settings are tracked separately.`;
 const table=document.createElement('table'),head=document.createElement('thead'),row=document.createElement('tr');
 for(const title of ['Variant',...data.stages,'Notes']){const th=document.createElement('th');th.textContent=title;row.append(th);}head.append(row);table.append(head);
 const body=document.createElement('tbody');for(const entry of filtered){const tr=document.createElement('tr'),name=document.createElement('td');name.textContent=entry.id;tr.append(name);const notes=[];
  for(const phase of data.stages){const record=reviews.get(recordKey(entry,phase)),td=document.createElement('td');td.textContent=record?.status==='pass'?'Checked':record?.status==='fail'?'Issue':'Unverified';tr.append(td);if(record?.note)notes.push(phase+': '+record.note);}
  const td=document.createElement('td');td.textContent=notes.join('; ');tr.append(td);body.append(tr);
 }table.append(body);$('checklist').replaceChildren(table);
}
function exportChecklist(){
 const report={build:'audit233',exportedAt:new Date().toISOString(),method:'Manual visual marks only; available cases are not verification.',plannedCases:data.cases.map(c=>({id:c.id,type:c.type,variant:c.variant,stages:c.stages,surfaces:c.surfaces,unmarkedStatus:'unverified'})),reviews:[...reviews.values()],runtimeErrors:errors,limitations:data.limitations};
 const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='graphics-audit233-checklist.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
for(const {type}of data.types){const o=document.createElement('option');o.value=type;o.textContent=graphicNames[type]||type;$('type').append(o);}
$('type').onchange=filterCases;$('filter').oninput=filterCases;$('cue').onchange=()=>selectCase($('cue').value);
for(const [id,delta]of [['prev',-1],['next',1]])$(id).onclick=()=>{if(!filtered.length)return;const index=filtered.findIndex(c=>c.id===selected.id);selectCase(filtered[(index+delta+filtered.length)%filtered.length].id);};
for(const node of document.querySelectorAll('[data-action]'))node.onclick=()=>action(node.dataset.action);
for(const id of ['surface','motion','logos','bottom','feed','mainBug','countdown','sideStats','feedSlot'])$(id).onchange=()=>{refreshChecklist();action('entrance',{fresh:true});};
$('scale').onchange=()=>{fit();refreshChecklist();};$('sample').onclick=()=>action($('sampleStage').value,{sample:true,fresh:true});
$('freeze').onclick=()=>{++run;freezeVisible();status(`${selected.id} · current frame frozen · unverified`);};
for(const node of document.querySelectorAll('[data-verdict]'))node.onclick=()=>{
 const phase=$('reviewStage').value,key=recordKey(selected,phase);if(node.dataset.verdict==='unverified')reviews.delete(key);else reviews.set(key,{case:selected.id,stage:phase,options:options(),status:node.dataset.verdict,note:$('note').value,at:new Date().toISOString()});refreshChecklist();
};
$('export').onclick=exportChecklist;$('applyCue').onclick=()=>{try{const cue=JSON.parse($('cueJson').value);if(!data.types.some(x=>x.type===cue.type))throw Error('Cue type is not in this build.');cueOverride=cue;action('entrance',{fresh:true});}catch(error){showError(error);}};
setInterval(()=>{if(current&&!frozen&&content?.isConnected)updateClocks(content,current);},100);
// Module-loaded styles may be appended after static links; keep scoped audit
// corrections last without changing production style rules or their contents.
const auditSheet=[...document.querySelectorAll('link[rel=stylesheet]')].find(n=>n.href.includes('/audit233.css?v=update239'));if(auditSheet)document.head.append(auditSheet);
const urlCase=new URLSearchParams(location.search).get('case');if(urlCase)selected=data.cases.find(c=>c.id===urlCase);filterCases();
