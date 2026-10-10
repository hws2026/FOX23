import {renderGraphics,updateClocks,graphicNames} from './graphics.js?v=update239';
import {caseState233,updateFixture233} from './graphics-audit233-model.js?v=update239';
import {freezeFrame234,animationList234} from './graphics-freeze234.js?v=update239';
import {nflLogoAssignments226} from './nfl-logos226.js';
const $=id=>document.getElementById(id),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const controls=['view','scope','phase','motion','outMotion','surface','time','step','crop','teamMarks','brandingMarks'];
let page=0,run=0,records=[],jobs=[],findings=[],cases=[];
function showError(error){$('status').dataset.error=true;$('status').textContent='Audit error: '+String(error?.message||error);}
addEventListener('error',e=>showError(e.error||e.message));addEventListener('unhandledrejection',e=>showError(e.reason));
const data=await fetch('./graphics-audit233-data.json?v=update239').then(r=>{if(!r.ok)throw Error('Inventory could not load ('+r.status+').');return r.json();}).catch(error=>{showError(error);throw error;});
// This focused inventory never connects to or saves a show. Only the two approved
// graphic types are rendered; the main renderer and logo assignments remain shared.
const colors235={"ARI":{"color":"#a40227","secondary":"#ffffff"},"ATL":{"color":"#a71930","secondary":"#000000"},"BAL":{"color":"#29126f","secondary":"#000000"},"BUF":{"color":"#00338d","secondary":"#d50a0a"},"CAR":{"color":"#0085ca","secondary":"#000000"},"CHI":{"color":"#0b1c3a","secondary":"#e64100"},"CIN":{"color":"#fb4f14","secondary":"#000000"},"CLE":{"color":"#472a08","secondary":"#ff3c00"},"DAL":{"color":"#002a5c","secondary":"#b0b7bc"},"DEN":{"color":"#0a2343","secondary":"#fc4c02"},"DET":{"color":"#0076b6","secondary":"#bbbbbb"},"GB":{"color":"#204e32","secondary":"#ffb612"},"HOU":{"color":"#021018","secondary":"#eb0028"},"IND":{"color":"#003b75","secondary":"#ffffff"},"JAX":{"color":"#007487","secondary":"#d7a22a"},"KC":{"color":"#e31837","secondary":"#ffb612"},"LV":{"color":"#000000","secondary":"#a5acaf"},"LAC":{"color":"#0080c6","secondary":"#ffc20e"},"LAR":{"color":"#003594","secondary":"#ffd100"},"MIA":{"color":"#008e97","secondary":"#fc4c02"},"MIN":{"color":"#4f2683","secondary":"#ffc62f"},"NE":{"color":"#002a5c","secondary":"#c60c30"},"NO":{"color":"#d3bc8d","secondary":"#000000"},"NYG":{"color":"#003c7f","secondary":"#c9243f"},"NYJ":{"color":"#115740","secondary":"#ffffff"},"PHI":{"color":"#06424d","secondary":"#000000"},"PIT":{"color":"#000000","secondary":"#ffb612"},"SF":{"color":"#aa0000","secondary":"#b3995d"},"SEA":{"color":"#002a5c","secondary":"#69be28"},"TB":{"color":"#bd1c36","secondary":"#3e3a35"},"TEN":{"color":"#4495d2","secondary":"#001532"},"WSH":{"color":"#5a1414","secondary":"#ffb612"}};
const originalCases=data.cases;
const make=(type,variant,pair,extra={})=>({...structuredClone(originalCases.find(c=>c.id===type+':default')),id:type+':'+variant,variant,pair,...extra});
const selected=[];
for(const type of ['scorebug','intro']){
 selected.push(make(type,'default',['DAL','PHI']));
 selected.push(make(type,'reference-gb-dal',['GB','DAL']));
 selected.push(make(type,'reference-sf-pit',['SF','PIT']));
 for(let i=0;i<nflLogoAssignments226.length;i+=2){const pair=nflLogoAssignments226.slice(i,i+2).map(t=>t.code);for(const codes of [pair,[...pair].reverse()])selected.push(make(type,'nfl-'+codes.join('-').toLowerCase(),codes,{inventory:'nfl'}));}
 selected.push(make(type,'text-fallback',['DAL','PHI'],{textFallback:true}));
 selected.push({...structuredClone(originalCases.find(c=>c.id===type+':empty-show')),inventory:'empty'});
}
data.cases=selected;
const names={scorebug:'Scorebug logos',intro:'Game opening intro logos'};
const title=c=>`${names[c.type]} · ${c.variant}`;
const flags=()=>({...Object.fromEntries(controls.map(id=>[id,$(id).value]))});
function list(){cases=data.cases.filter(c=>$('scope').value==='all'||($('scope').value==='nfl'?c.inventory==='nfl':c.variant==='default'||c.variant.startsWith('reference-')));$('case').replaceChildren();for(const c of cases){const o=document.createElement('option');o.value=c.id;o.textContent=title(c);$('case').append(o);}page=0;}
const crops={full:{x:0,y:0,w:1920,h:1080},bug:{x:570,y:790,w:780,h:270},intro:{x:0,y:500,w:1920,h:580}};
function fit(){for(const frame of document.querySelectorAll('.frame')){const stage=frame.firstElementChild,crop=crops[frame.dataset.crop]||crops.full,scale=frame.clientWidth/crop.w;frame.style.aspectRatio=`${crop.w}/${crop.h}`;if(stage){stage.style.setProperty('transform',`scale(${scale})`,'important');stage.style.setProperty('left',`${-crop.x*scale}px`,'important');stage.style.setProperty('top',`${-crop.y*scale}px`,'important');}}}
new ResizeObserver(fit).observe($('grid'));addEventListener('resize',fit);
function allElements(root){const elements=[...root.querySelectorAll('*')];for(const node of [...elements])if(node.shadowRoot)elements.push(...allElements(node.shadowRoot));return elements;}
function state(entry,opts){
 const s=caseState233(data,entry,{...opts,logos:false,motion:'auto',mainBug:entry.type==='scorebug'});
 for(const cue of [s.preview,s.program.graphic]){cue.transition=opts.motion;cue.outTransition=opts.outMotion==='same'?opts.motion:opts.outMotion;}
 if(entry.pair)for(const [i,side] of ['away','home'].entries()){
  const code=entry.pair[i],assignment=nflLogoAssignments226.find(t=>t.code===code),mark='./broadcast-logos226/teams/'+assignment.file;
  Object.assign(s.teams[side],{name:assignment.name,shortName:assignment.shortName,abbr:code,...(colors235[code]||colors235[code==='WAS'?'WSH':code]),record:i?'7–1':'5–2',logo:mark,heroLogo:mark});
 }
 if(opts.teamMarks==='text'||entry.textFallback)for(const t of Object.values(s.teams)){t.logo='';t.heroLogo='';}
 if(opts.brandingMarks==='images'&&!s.program.emptyShow)Object.assign(s.branding,{networkLogo:'./assets/wld-system-logo217.png',introLogo:'./assets/wld-system-shield217.png'});
 s.bottomScores.visible=false;s.bottomScores.feedBugVisible=false;
 return {s,feed:{elapsedMs:0}};
}
// Inline SVG definitions are isolated among independently rendered cards.
function scopeSvgIds(stage,prefix){
 const ids=new Map([...stage.querySelectorAll('svg [id]')].filter(el=>!el.id.startsWith(prefix+'-')).map(el=>[el.id,prefix+'-'+el.id]));
 if(!ids.size)return;
 for(const el of stage.querySelectorAll('*'))for(const attr of [...el.attributes]){let value=attr.value;if(attr.name==='id'&&ids.has(value))value=ids.get(value);else{value=value.replace(/url\(["']?#([^\s)'";]+)["']?\)/g,(whole,id)=>ids.has(id)?`url(#${ids.get(id)})`:whole);if((attr.name==='href'||attr.name==='xlink:href')&&value.startsWith('#')&&ids.has(value.slice(1)))value='#'+ids.get(value.slice(1));}if(value!==attr.value)el.setAttribute(attr.name,value);}
}
function render(job){job.content.style.transform=job.s.bottomScores.visible?'translateY(-58px)':'none';renderGraphics(job.content,job.s,job.opts.surface==='preview');updateClocks(job.content,job.s);scopeSvgIds(job.stage,job.svgKey);}
function out(job){job.s=structuredClone(job.s);job.s.preview={type:'none'};job.s.program.graphic={type:'none'};job.s.program.bug=false;job.s.program.qbStats.visible=false;job.s.program.countdown.visible=false;job.s.bottomScores.visible=false;job.s.bottomScores.feedBugVisible=false;job.s.program.takeId++;render(job);}
function resetStage(job){
 for(const animation of animationList234(job.stage))animation.cancel();
 const stage=document.createElement('div');stage.className='stage';const content=document.createElement('div');content.className='broadcast-content209';content.style.cssText='position:absolute;inset:0';stage.append(content);job.stage.replaceWith(stage);job.stage=stage;job.content=content;fit();
}
async function warmAssets(currentJobs){
 // A throwaway render requests only the local fixture artwork used by this batch.
 // Recreate the render roots after warmup so its timers cannot alter the sampled frames.
 for(const job of currentJobs){try{render(job);for(const animation of animationList234(job.stage))animation.pause();}catch(error){job.error=String(error);}}
 const images=currentJobs.flatMap(job=>allElements(job.stage).filter(el=>el.tagName==='IMG'&&el.getAttribute('src')&&!el.getAttribute('src').startsWith('data:,')));
 await Promise.race([Promise.allSettled([document.fonts.ready,...images.map(img=>img.decode?.()||Promise.resolve())]),sleep(3000)]);
}
// Held-state preparation follows the rendered entrance, including delayed children.
// Loops and the score feed's paused/scrolling detail text are held-state content.
function pendingEntryMotion234(stage){
 const pending=[],ignored=[];
 for(const animation of animationList234(stage)){
  const timing=animation.effect?.getComputedTiming(),end=Number(timing?.endTime),target=animation.effect?.target,name=animation.animationName||animation.id||'WAAPI';
  if(!Number.isFinite(end)||target?.matches?.('.bs-detail-text228')){ignored.push(name);continue;}
  if(['finished','idle'].includes(animation.playState))continue;
  const current=Number(animation.currentTime)||0,rate=Number(animation.playbackRate??1),distance=rate<0?current:end-current;
  if(distance>.5)pending.push({name,remainingMs:animation.playState==='paused'||!rate?Infinity:distance/Math.abs(rate)});
 }
 return {pending,ignored};
}
async function settleEntry234(job,isCurrent){
 const minimumMs=2100,limitMs=12000,quietMs=80,ignored=new Set();let quietSince=null;
 while(isCurrent()){
  const now=performance.now(),elapsed=now-job.started,{pending,ignored:skipped}=pendingEntryMotion234(job.stage);skipped.forEach(name=>ignored.add(name));
  quietSince=pending.length?null:(quietSince??now);
  if(elapsed>=minimumMs&&quietSince!==null&&now-quietSince>=quietMs)return {elapsedMs:Math.round(elapsed),minimumMs,limitMs,ignoredAnimations:[...ignored],settled:true};
  if(elapsed>=limitMs)throw Error('Entrance did not settle within '+limitMs+' ms: '+pending.map(a=>a.name).join(', '));
  job.label.textContent='Preparing held graphic · '+Math.round(elapsed)+' ms'+(pending.length?' · '+pending.length+' entrance animations':'');
  await sleep(Math.min(100,limitMs-elapsed));
 }
 return null;
}
async function prepareEntryBatch234(currentJobs,startJob,isCurrent,onError){
 const started=[];
 // Independent entrances may run together; sample/exit clocks start later per card.
 for(const job of currentJobs){
  if(!isCurrent())return false;
  try{startJob(job);started.push(job);}catch(error){onError(job,error);}
 }
 await Promise.all(started.map(async job=>{
  try{const preparation=await settleEntry234(job,isCurrent);if(isCurrent())job.entrancePreparation=preparation;}
  catch(error){if(isCurrent())onError(job,error);}
 }));
 return isCurrent();
}
function pinPhaseZero234(job,priorAnimations=null){
 // OUT keeps its settled background pose; only newly created exit motion rewinds.
 for(const animation of animationList234(job.stage))if(!priorAnimations?.has(animation)){animation.currentTime=0;animation.pause();}
 job.timelineZero=true;
}
function logoDiagnostics235(job){
 const stage=job.stage,stageRect=stage.getBoundingClientRect(),scale=stageRect.width/1920||1;
 const bounds=el=>{const r=el.getBoundingClientRect();return{x:+((r.left-stageRect.left)/scale).toFixed(2),y:+((r.top-stageRect.top)/scale).toFixed(2),w:+(r.width/scale).toFixed(2),h:+(r.height/scale).toFixed(2)};};
 const slots=job.entry.type==='scorebug'?[...stage.querySelectorAll('.scorebug .bug-logo-crop')]:[...stage.querySelectorAll('.opening-intro .intro-logo')];
 return slots.map(slot=>{
  const img=slot.querySelector('img'),side=slot.closest('.home')?'home':'away',team=job.s.teams[side],clipAncestors=[];
  for(let node=slot;node&&node!==stage;node=node.parentElement){const css=getComputedStyle(node);if(css.overflow!=='visible'||css.clipPath!=='none')clipAncestors.push({class:node.className,overflow:css.overflow,clipPath:css.clipPath,bounds:bounds(node)});}
  if(!img)return{side,team:team.abbr,kind:'text',text:slot.textContent,bounds:bounds(slot),clipAncestors};
  const css=getComputedStyle(img),box=bounds(img),nw=img.naturalWidth,nh=img.naturalHeight,factor=nw&&nh?(css.objectFit==='cover'?Math.max(box.w/nw,box.h/nh):Math.min(box.w/nw,box.h/nh)):0;
  const naturalPaint={w:+(nw*factor).toFixed(2),h:+(nh*factor).toFixed(2)};
  return{side,team:team.abbr,kind:'image',source:img.getAttribute('src'),expectedSource:job.entry.type==='intro'?(team.heroLogo||team.logo):team.logo,sourceMatches:img.getAttribute('src')===(job.entry.type==='intro'?(team.heroLogo||team.logo):team.logo),objectFit:css.objectFit,objectPosition:css.objectPosition,naturalWidth:nw,naturalHeight:nh,imageBounds:box,slotBounds:bounds(slot),naturalPaint,coverCroppedX:Math.max(0,+(naturalPaint.w-box.w).toFixed(2)),coverCroppedY:Math.max(0,+(naturalPaint.h-box.h).toFixed(2)),clipAncestors};
 });
}
function diagnostics(job,capture){
 const elements=allElements(job.stage),images=elements.filter(el=>el.tagName==='IMG'&&el.getAttribute('src')&&!el.getAttribute('src').startsWith('data:,'));
 return {id:job.entry.id,fixtureNote:job.entry.auditFixtureNote||null,...job.opts,effectiveFeed:job.feed,entrancePreparation:job.entrancePreparation||null,requestedMs:job.target,elapsedMs:Math.round(capture.pausedAt-job.started),pauseWindowMs:Math.round(capture.pausedAt-capture.pauseStartedAt),copyTimeMs:Math.round(capture.finishedAt-capture.pausedAt),pendingImages:images.filter(x=>!x.complete).map(x=>x.getAttribute('src')),brokenImages:images.filter(x=>x.complete&&!x.naturalWidth).map(x=>x.getAttribute('src')),overflow:elements.filter(x=>x.matches('h1,h2,p,strong,small')&&x.clientWidth&&x.scrollWidth>x.clientWidth+3).map(x=>({text:x.textContent.slice(0,90),extra:x.scrollWidth-x.clientWidth,intentionalScroll:!!x.closest('.bs-detail-window228')})),animations:capture.animations};
}
async function draw(live=false){
 const token=++run,opts=flags();$('pass').disabled=true;$('fail').disabled=true;$('status').dataset.error=false;
 for(const job of jobs)for(const animation of animationList234(job.stage))animation.cancel();jobs=[];records=[];$('grid').replaceChildren();$('grid').dataset.crop=opts.crop;$('report').textContent='';
 const strip=opts.view==='strip',chosen=cases.find(c=>c.id===$('case').value)||cases[0],entries=strip?Array(6).fill(chosen):cases.slice(page*6,page*6+6),phase=opts.phase,base=Math.max(0,Number(opts.time)||0),step=Math.max(16.667,Number(opts.step)||100);
 $('status').textContent=`Preparing artwork · ${strip?title(chosen):`batch ${page+1}/${Math.ceil(cases.length/6)}`} · ${phase}`;
 for(const [i,entry]of entries.entries()){
  const card=document.createElement('article'),h=document.createElement('h2');h.textContent=title(entry);card.append(h);const frame=document.createElement('div');frame.className='frame';frame.dataset.crop=opts.crop==='auto'?(entry.type==='scorebug'?'bug':'intro'):opts.crop;frame.dataset.warming=true;const stage=document.createElement('div');stage.className='stage';const content=document.createElement('div');content.className='broadcast-content209';content.style.cssText='position:absolute;inset:0';stage.append(content);frame.append(stage);card.append(frame);const label=document.createElement('div');label.className='frame-label';label.textContent='Preparing local fixture artwork…';card.append(label);$('grid').append(card);
  const {s,feed}=state(entry,opts);jobs.push({entry,stage,content,card,frame,label,s,feed,opts,svgKey:`frame234-${token}-${i}`,target:phase==='hold'?null:base+(strip?i*step:0)});
 }
 fit();const currentJobs=[...jobs];await warmAssets(currentJobs);if(token!==run)return;
 $('status').textContent=`Rendering ${strip?title(chosen):`batch ${page+1}/${Math.ceil(cases.length/6)}`} · ${phase} · ${opts.motion} · ${opts.surface}`;
 const startJob=job=>{job.frame.dataset.warming=false;resetStage(job);const feedNow=Date.now();job.s.bottomScores.anchor=feedNow-job.feed.elapsedMs;job.s.bottomScores.holdAt=0;job.started=performance.now();render(job);job.error=null;job.label.textContent='Sampling…';};
 const enterPhase=job=>{if(['out','update','return','interrupt'].includes(phase))job.started=performance.now();if(phase==='update'){job.s=updateFixture233(job.s);render(job);}if(['out','interrupt'].includes(phase))out(job);if(phase==='return'){const saved=structuredClone(job.s);out(job);setTimeout(()=>{if(token!==run)return;job.s=saved;job.s.program.takeId+=2;render(job);},120);}};
 const recordError=(job,error)=>{if(token!==run)return;job.error=String(error);job.card.dataset.error=true;job.label.textContent=job.error;records.push({id:job.entry.id,...opts,error:job.error});};
 const settledPhase=['hold','out','update','return'].includes(phase);
 if(settledPhase&&!await prepareEntryBatch234(currentJobs,startJob,()=>token===run,recordError))return;
 // Each sample gets its own render clock. Freezing a sibling must not delay frame zero.
 for(const job of currentJobs){
  if(token!==run)return;
  if(settledPhase&&job.error)continue;
  try{
   if(!settledPhase){startJob(job);if(phase==='interrupt')await sleep(180);}
   const priorAnimations=phase==='out'&&job.target===0?new Set(animationList234(job.stage)):null;
   if(token!==run)return;enterPhase(job);
   if(live)continue;
   if(job.target>0)await sleep(Math.max(0,job.target-(performance.now()-job.started)));
   else if(phase==='in'||phase==='out')pinPhaseZero234(job,priorAnimations);
   if(token!==run)return;
   const logos=logoDiagnostics235(job);const capture=freezeFrame234(job.stage);job.stage=capture.stage;const report=diagnostics(job,capture);report.timelineZero=!!job.timelineZero;report.logos=logos;records.push(report);
   job.label.textContent=`${phase} · ${job.timelineZero?'CSS timeline 0 ms':phase==='hold'?`paused ${report.elapsedMs} ms after entrance start`:`requested ${Math.round(job.target)} ms / paused ${report.elapsedMs} ms`} · ${report.brokenImages.length} failed / ${report.pendingImages.length} pending images · ${logos.filter(l=>l.kind==='image'&&l.objectFit!=='cover').length} logo-fit errors`;fit();
  }catch(error){recordError(job,error);}
 }
 if(live){$('status').textContent+=' · playing · use Sample frames before recording a review';return;}

 if(token!==run)return;records.sort((a,b)=>currentJobs.findIndex(j=>j.entry.id===a.id&&j.target===a.requestedMs)-currentJobs.findIndex(j=>j.entry.id===b.id&&j.target===b.requestedMs));
 $('report').textContent=JSON.stringify(records,null,2);$('status').textContent=`${strip?title(chosen):`Batch ${page+1}/${Math.ceil(cases.length/6)}`} · ${entries.length} sampled frames · ${cases.length} cases available · visual review pending`;
 $('pass').disabled=!records.length||records.some(record=>record.error||record.brokenImages?.length||record.pendingImages?.length);$('fail').disabled=!records.length;
}
$('next').onclick=()=>{page=Math.min(Math.ceil(cases.length/6)-1,page+1);draw();};$('prev').onclick=()=>{page=Math.max(0,page-1);draw();};$('sample').onclick=()=>draw();$('play').onclick=()=>draw(true);
for(const[id,sign]of[['backFrame',-1],['forwardFrame',1]])$(id).onclick=()=>{$('time').value=Math.max(0,Number($('time').value)+sign*1000/60).toFixed(3);draw();};
for(const id of ['phase','motion','outMotion','surface','view','crop','teamMarks','brandingMarks'])$(id).onchange=()=>draw();$('scope').onchange=()=>{list();draw();};$('case').onchange=()=>{if($('view').value==='grid')page=Math.floor(cases.findIndex(c=>c.id===$('case').value)/6);draw();};
for(const status of ['pass','fail'])$(status).onclick=()=>{if(!records.length||$(status).disabled)return;findings.push({at:new Date().toISOString(),status,note:$('note').value,frames:structuredClone(records)});$('coverage').textContent=`${findings.length} reviewed frame sets recorded · export before reloading`;$('note').value='';};
$('export').onclick=()=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify({build:'logos235',scope:'Scorebug and game intro logos only',findings},null,2)],{type:'application/json'}));a.href=url;a.download='logos-frame-findings235.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
list();const p=new URLSearchParams(location.search);for(const key of controls)if(p.has(key))$(key).value=p.get(key);if(p.has('scope'))list();if(p.has('case')){$('case').value=p.get('case');page=Math.max(0,Math.floor(cases.findIndex(c=>c.id===p.get('case'))/6));}await draw();
