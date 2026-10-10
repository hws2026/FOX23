import {renderGraphics,updateClocks,graphicNames} from './graphics.js?v=update239';
import {caseState233,updateFixture233} from './graphics-audit233-model.js?v=update239';
import {freezeFrame234,animationList234} from './graphics-freeze234.js?v=update239';
import {buildScorePlan} from './scores-sequence224.js?v=update239';
import {gameDetails,readingTime} from './scores-timing209.js?v=update239';
const $=id=>document.getElementById(id),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const controls=['view','scope','phase','motion','outMotion','surface','time','step','crop','teamMarks','brandingMarks','feedSlot','feedState','feedLeague','feedPlayback'];
let page=0,run=0,records=[],jobs=[],findings=[],cases=[];
function showError(error){$('status').dataset.error=true;$('status').textContent='Audit error: '+String(error?.message||error);}
addEventListener('error',e=>showError(e.error||e.message));addEventListener('unhandledrejection',e=>showError(e.reason));
const data=await fetch('./graphics-audit233-data.json?v=update239').then(r=>{if(!r.ok)throw Error('Inventory could not load ('+r.status+').');return r.json();}).catch(error=>{showError(error);throw error;});
// Populate the isolated default specimens so empty authoring fields cannot hide
// copy, statistic or rail defects. These illustrative values never enter a show.
const defaultSpecimens234={
 breaking:{newsText:'JORDAN ELLIS THROWS FOR 248 YARDS AND 2 TOUCHDOWNS',newsArt:'team',newsShowLogo:true},
 coach:{staffName:'MORGAN PARKER',staffRole:'HEAD COACH',staffDetail:'3RD SEASON · 24–14 RECORD'},
 lowerthird:{subtitle:'4 STRAIGHT SCORING DRIVES',title:'374 TOTAL YARDS · 26 FIRST DOWNS',lowerContext:'THIS SEASON'},
 player:{spotlightDetail:'2 PASSING TOUCHDOWNS'},
 playerdock:{title:'19/27 COMP/ATT 248 YARDS',subtitle:'THIS GAME'},
 pregameplayer:{featureContext:'QUARTERBACK',featureText:'248 PASSING YARDS\n2 TOUCHDOWNS',featureFooter:'19 OF 27 COMPLETIONS'},
 qbstats:{sideStatsLayout:'qb',qbComp:19,qbAtt:27,qbYards:248,qbTD:2,qbINT:1},
 referee:{refereeName:'ADRIAN COLE',refereeRole:'REFEREE',refereeExperience:'12TH SEASON'},
 reporter:{reporterName:'ALEXANDRIA RICHARDSON'},
 reporterbadge:{reporterName:'ALEXANDRIA RICHARDSON',extraBadge:'GAME DAY'},
 scoringdrive:{drivePlays:8,driveYards:75,driveTime:'4:36',driveResult:'12-YARD TOUCHDOWN PASS',driveNote:'ELLIS: 5/5, 62 YDS ON DRIVE'},
 seasonwall:{title:'4 STRAIGHT WINS',subtitle:'THE MOMENTUM CONTINUES',featureFooter:'27.5 POINTS PER GAME'},
 serieshistory:{title:'SERIES HISTORY',subtitle:'LAST 10 MEETINGS',featureText:'6–4 RECORD',featureFooter:'7-POINT AVERAGE MARGIN'},
 situation:{situationKind:'fieldgoal',attemptDistance:47},
 splitview:{title:'GAME UPDATE',subtitle:'COWBOYS AT EAGLES',featureText:'DALLAS: 248 PASSING YARDS\nPHILADELPHIA: 212 PASSING YARDS',featureFooter:'ILLUSTRATIVE AUDIT DATA',splitLabel1:'FEED 1 · MEDIA OFF',splitLabel2:'FEED 2 · MEDIA OFF'},
 sponsorpick:{sponsorPickName:'JAMIE',sponsorPickLine:'GAME PICK',sponsorPickFooter:'ILLUSTRATIVE MATCHUP SELECTION'},
 standings:{standingsRows:[{name:'PHILADELPHIA',wins:7,losses:1,ties:0},{name:'DALLAS',wins:5,losses:2,ties:0},{name:'WASHINGTON',wins:4,losses:4,ties:0},{name:'NY GIANTS',wins:2,losses:6,ties:0}]},
 storytease:{title:'THE NEXT CHAPTER',subtitle:'COMING UP',featureFooter:'A LOOK INSIDE THE MATCHUP'},
 talent:{leftName:'JAMIE CARTER',leftRole:'WLD SPORTS ANALYST',subtitle:'12 SEASONS IN THE LEAGUE',title:'IN THE STUDIO'},
 teamrecord:{title:'TEAM RECORD',subtitle:'THIS SEASON',stats:[{label:'SCORING FIRST',away:'5–1',home:'4–1'},{label:'OPPONENT SCORES FIRST',away:'2–2',home:'3–2'}]},
 weather:{weatherHumidity:'54%'}
};
for(const entry of data.cases)if(entry.variant==='default'&&defaultSpecimens234[entry.type]){Object.assign(entry.cue,structuredClone(defaultSpecimens234[entry.type]));entry.auditFixtureNote='Illustrative content for layout and motion review; not historical game data.';}
for(const entry of data.cases)if(entry.type==='referee'&&entry.variant.startsWith('highlights-'))Object.assign(entry.cue,{refereeName:'ADRIAN COLE',refereeRole:'REFEREE',refereeExperience:'12TH SEASON'});
const coachBase234=data.cases.find(c=>c.id==='coach:default');
data.cases.push({...structuredClone(coachBase234),id:'coach:scorebug-dock',variant:'scorebug-dock',cue:{...structuredClone(coachBase234.cue),coachLayout:'dock'}});
coachBase234.cue={...coachBase234.cue,coachLayout:'ribbon',staffRole:'24–14 RECORD AS HEAD COACH',staffDetail:''};
data.cases.push({...structuredClone(coachBase234),id:'coach:ribbon-with-detail',variant:'ribbon-with-detail',cue:{...structuredClone(coachBase234.cue),staffRole:'MAKING HEAD COACHING DEBUT',staffDetail:'OFFENSIVE COORDINATOR LAST SEASON'}});
const announcerBase=data.cases.find(c=>c.id==='announcers:default');
// The default visual specimen uses the supplied booth video, not invented crew names.
announcerBase.cue={...announcerBase.cue,announcerCount:3,announcerStyle:'stacked',leftName:'KEVIN BURKHARDT',centerName:'DEAN BLANDINO',rightName:'GREG OLSEN'};
for(const [variant,patch]of Object.entries({'reference-three':{announcerCount:3,leftName:'KEVIN BURKHARDT',centerName:'DEAN BLANDINO',rightName:'GREG OLSEN'},'four-stacked':{announcerCount:4,leftName:'KEVIN BURKHARDT',rightName:'GREG OLSEN',reporterName:'ERIN ANDREWS',staffName:'TOM RINALDI'},'names-and-roles':{announcerCount:2,announcerStyle:'roles',leftName:'KEVIN BURKHARDT',leftRole:'NFL ON FOX',rightName:'GREG OLSEN',rightRole:'5-TIME PRO BOWL SELECTION'}}))data.cases.push({...structuredClone(announcerBase),id:'announcers:'+variant,variant,cue:{...structuredClone(announcerBase.cue),...patch}});
// Timeout fixtures show the already-recorded count; rendering never uses a timeout.
const timeoutBase234=data.cases.find(c=>c.id==='event:TIMEOUT-team-0');
for(const entry of data.cases.filter(c=>c.type==='event'&&c.cue.event==='TIMEOUT'))entry.statePatch={...entry.statePatch,game:{...entry.statePatch?.game,timeouts:{away:entry.cue.timeoutNumber?3-Number(entry.cue.timeoutNumber):1,home:3}}};
for(const remaining of [0,1,2,3])data.cases.push({...structuredClone(timeoutBase234),id:'event:TIMEOUT-home-remaining-'+remaining,variant:'TIMEOUT-home-remaining-'+remaining,cue:{...structuredClone(timeoutBase234.cue),team:'home',timeoutNumber:0},statePatch:{game:{timeouts:{away:3,home:remaining}}}});
// These are isolated overlay fixtures, not new on-air graphic types.
for(const surface of ['bottom-feed','feed-scorebug'])for(const [variant,feed]of Object.entries({default:{slot:'game'},'opening-deck':{slot:'deck'},'next-league':{slot:'next'},'away-player':{slot:'away'},'home-player':{slot:'home'},'final-away':{slot:'away',state:'final-away'},'final-home':{slot:'home',state:'final-home'},'final-tie':{slot:'game',state:'tie'},'baseball':{slot:'game',league:'MLB'},'doubleheader-game-2':{slot:'doubleheader',league:'MLB'},'ufl':{slot:'game',league:'UFL'},'scheduled':{slot:'game',state:'scheduled'},'stale':{slot:'game',state:'stale'}}))data.cases.push({id:surface+':'+variant,type:surface,variant,cue:{type:'none'},auditFeed:{surface,...feed}});
const names={...graphicNames,'bottom-feed':'Bottom scores strip','feed-scorebug':'Feed scorebug'};
const title=c=>`${names[c.type]||c.type} · ${c.variant}`;
const flags=()=>({...Object.fromEntries(controls.map(id=>[id,$(id).value])),bottom:$('bottom').checked,feed:$('feed').checked,mainBug:$('bug').checked});
function list(){cases=data.cases.filter(c=>$('scope').value==='all'||c.variant==='default');$('case').replaceChildren();for(const c of cases){const o=document.createElement('option');o.value=c.id;o.textContent=title(c);$('case').append(o);}page=0;}
const crops={full:{x:0,y:0,w:1920,h:1080},bottom:{x:0,y:720,w:1920,h:360},top:{x:0,y:0,w:1920,h:300},left:{x:0,y:0,w:960,h:1080}};
function fit(){for(const frame of document.querySelectorAll('.frame')){const stage=frame.firstElementChild,crop=crops[frame.dataset.crop]||crops.full,scale=frame.clientWidth/crop.w;frame.style.aspectRatio=`${crop.w}/${crop.h}`;if(stage){stage.style.setProperty('transform',`scale(${scale})`,'important');stage.style.setProperty('left',`${-crop.x*scale}px`,'important');stage.style.setProperty('top',`${-crop.y*scale}px`,'important');}}}
new ResizeObserver(fit).observe($('grid'));addEventListener('resize',fit);
function allElements(root){const elements=[...root.querySelectorAll('*')];for(const node of [...elements])if(node.shadowRoot)elements.push(...allElements(node.shadowRoot));return elements;}
function feedFixture(s,entry,opts){
 const cfg=s.bottomScores,fixture=entry.auditFeed||{},now=Date.now();
 const league=opts.feedLeague==='fixture'?(fixture.league||'NFL'):opts.feedLeague,mode=opts.feedState==='fixture'?(fixture.state||'live'):opts.feedState,slot=opts.feedSlot==='fixture'?(fixture.slot||'deck'):opts.feedSlot;
 cfg.visible=opts.bottom||fixture.surface==='bottom-feed';cfg.feedBugVisible=opts.feed||fixture.surface==='feed-scorebug';
 const nfl=cfg.games.find(g=>g.league==='NFL'),mlb=cfg.games.find(g=>g.league==='MLB');nfl.broadcast='WLD SPORTS';mlb.broadcast='WLD SPORTS';
 const ufl={...structuredClone(nfl),id:'audit-ufl',league:'UFL',away:{id:'dc',side:'away',abbr:'DC',name:'DC Defenders',record:'5-2',score:17,color:'#c60c30'},home:{id:'stl',side:'home',abbr:'STL',name:'St. Louis Battlehawks',record:'4-3',score:21,color:'#00549e'}};
 ufl.players=nfl.players.map((p,i)=>({...p,teamId:i?'stl':'dc'}));
 const doubleheader={...structuredClone(mlb),id:'audit-mlb-game-2',status:'BOT 3 · 1 OUT',away:{...mlb.away,score:0},home:{...mlb.home,score:1},detail:'DOUBLEHEADER · GAME 2'};
 mlb.detail='DOUBLEHEADER · GAME 1';cfg.games.push(doubleheader,ufl);cfg.leagues=[league,...['NFL','MLB','UFL'].filter(l=>l!==league)];
 const game=cfg.games.find(g=>g.league===league);
 if(mode.startsWith('final-')||mode==='tie')Object.assign(game,{state:'post',status:'FINAL',clock:'0:00',possession:null,away:{...game.away,score:mode==='final-home'?17:24},home:{...game.home,score:mode==='final-away'?17:24}});
 if(mode==='scheduled')Object.assign(game,{state:'pre',status:'SCHEDULED',start:new Date(now+86400000).toISOString(),clock:'',down:'',ball:'',possession:null,players:[],away:{...game.away,score:''},home:{...game.home,score:''}});
 if(mode==='stale'){game.updatedAt=now-120000;game.playersUpdatedAt=now-120000;}
 const plan=buildScorePlan(cfg.games,cfg);let offset=0,target=0;
 const targetGame=slot==='doubleheader'?doubleheader:slot==='mlb'?mlb:game;
 for(const row of plan){
  const details=gameDetails(row,true),holds=row._titleCard?[4000]:details.map(readingTime),duration=row._titleCard?4000:Math.max(30000,holds.reduce((a,b)=>a+b,0));
  const chosen=slot==='deck'?row._titleCard&&row._deckStep===0:slot==='next'?row._titleCard&&row._deckStep===1:row.id===targetGame.id&&row.league===targetGame.league;
  if(chosen){const name=slot==='away'?targetGame.players?.[0]?.name:slot==='home'?targetGame.players?.[1]?.name:null,index=name?Math.max(0,details.findIndex(d=>d.includes(name))):0;target=offset+holds.slice(0,index).reduce((a,b)=>a+b,0)+500;break;}
  offset+=duration;
 }
 cfg.anchor=now-target;cfg.holdAt=opts.feedPlayback==='pin'?now:0;cfg.updatedAt=now;
 return {league,state:mode,slot,playback:opts.feedPlayback,elapsedMs:target,bottom:cfg.visible,feed:cfg.feedBugVisible};
}
function state(entry,opts){
 const s=caseState233(data,entry,{...opts,logos:opts.teamMarks==='images',motion:'auto'});
 // These selected subjects include the scorebug their attached panels require.
 if((entry.cue.type==='scorebug'||['qbstats','playerdock'].includes(entry.cue.type))&&!s.program.emptyShow)s.program.bug=true;
 for(const cue of [s.preview,s.program.graphic]){cue.transition=opts.motion;cue.outTransition=opts.outMotion==='same'?opts.motion:opts.outMotion;}
 if(opts.teamMarks==='text')for(const team of Object.values(s.teams)){team.logo='';team.heroLogo='';}
 if(opts.brandingMarks==='images'&&!s.program.emptyShow)Object.assign(s.branding,{networkLogo:'./assets/wld-system-logo217.png',secondaryLogo:'./assets/wld-system-shield217.png',introLogo:'./assets/wld-system-shield217.png',sponsorName:'WLD SPORTS',sponsorLogo:'./assets/wld-system-logo217.png'});
 const feed=feedFixture(s,entry,opts);return {s,feed};
}
// Inline SVG definition IDs otherwise collide across the six independently rendered cards.
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
  const card=document.createElement('article'),h=document.createElement('h2');h.textContent=title(entry);card.append(h);const frame=document.createElement('div');frame.className='frame';frame.dataset.crop=opts.crop;frame.dataset.warming=true;const stage=document.createElement('div');stage.className='stage';const content=document.createElement('div');content.className='broadcast-content209';content.style.cssText='position:absolute;inset:0';stage.append(content);frame.append(stage);card.append(frame);const label=document.createElement('div');label.className='frame-label';label.textContent='Preparing local fixture artwork…';card.append(label);$('grid').append(card);
  const {s,feed}=state(entry,opts);jobs.push({entry,stage,content,card,frame,label,s,feed,opts,svgKey:`frame234-${token}-${i}`,target:phase==='hold'?null:base+(strip?i*step:0)});
 }
 fit();const currentJobs=[...jobs];await warmAssets(currentJobs);if(token!==run)return;
 $('status').textContent=`Rendering ${strip?title(chosen):`batch ${page+1}/${Math.ceil(cases.length/6)}`} · ${phase} · ${opts.motion} · ${opts.surface}`;
 const startJob=job=>{job.frame.dataset.warming=false;resetStage(job);const feedNow=Date.now();job.s.bottomScores.anchor=feedNow-job.feed.elapsedMs;job.s.bottomScores.holdAt=job.opts.feedPlayback==='pin'?feedNow:0;job.started=performance.now();render(job);job.error=null;job.label.textContent='Sampling…';};
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
   const capture=freezeFrame234(job.stage);job.stage=capture.stage;const report=diagnostics(job,capture);report.timelineZero=!!job.timelineZero;records.push(report);
   job.label.textContent=`${phase} · ${job.timelineZero?'CSS timeline 0 ms':phase==='hold'?`paused ${report.elapsedMs} ms after entrance start`:`requested ${Math.round(job.target)} ms / paused ${report.elapsedMs} ms`} · ${report.brokenImages.length} failed / ${report.pendingImages.length} pending images · ${report.overflow.length} overflow flags`;fit();
  }catch(error){recordError(job,error);}
 }
 if(live){$('status').textContent+=' · playing · use Sample frames before recording a review';return;}

 if(token!==run)return;records.sort((a,b)=>currentJobs.findIndex(j=>j.entry.id===a.id&&j.target===a.requestedMs)-currentJobs.findIndex(j=>j.entry.id===b.id&&j.target===b.requestedMs));
 $('report').textContent=JSON.stringify(records,null,2);$('status').textContent=`${strip?title(chosen):`Batch ${page+1}/${Math.ceil(cases.length/6)}`} · ${entries.length} sampled frames · ${cases.length} cases available · visual review pending`;
 $('pass').disabled=!records.length||records.some(record=>record.error||record.brokenImages?.length||record.pendingImages?.length);$('fail').disabled=!records.length;
}
$('next').onclick=()=>{page=Math.min(Math.ceil(cases.length/6)-1,page+1);draw();};$('prev').onclick=()=>{page=Math.max(0,page-1);draw();};$('sample').onclick=()=>draw();$('play').onclick=()=>draw(true);
for(const[id,sign]of[['backFrame',-1],['forwardFrame',1]])$(id).onclick=()=>{$('time').value=Math.max(0,Number($('time').value)+sign*1000/60).toFixed(3);draw();};
for(const id of ['phase','motion','outMotion','surface','bottom','feed','bug','view','crop','teamMarks','brandingMarks','feedSlot','feedState','feedLeague','feedPlayback'])$(id).onchange=()=>draw();$('scope').onchange=()=>{list();draw();};$('case').onchange=()=>{if($('view').value==='grid')page=Math.floor(cases.findIndex(c=>c.id===$('case').value)/6);draw();};
for(const status of ['pass','fail'])$(status).onclick=()=>{if(!records.length||$(status).disabled)return;findings.push({at:new Date().toISOString(),status,note:$('note').value,frames:structuredClone(records)});$('coverage').textContent=`${findings.length} reviewed frame sets recorded · export before reloading`;$('note').value='';};
$('export').onclick=()=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify({build:'234-in-progress',findings},null,2)],{type:'application/json'}));a.href=url;a.download='graphics-frame-findings234.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
list();const p=new URLSearchParams(location.search);for(const key of controls)if(p.has(key))$(key).value=p.get(key);for(const key of ['bottom','feed','bug'])if(p.has(key))$(key).checked=p.get(key)==='true';if(p.has('scope'))list();if(p.has('case')){$('case').value=p.get('case');page=Math.max(0,Math.floor(cases.findIndex(c=>c.id===p.get('case'))/6));}await draw();
