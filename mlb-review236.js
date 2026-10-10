import {mlbLogoAssignments236,mlbBroadcastLogo236} from './mlb-logos236.js';
import {nflBroadcastLogo226} from './nfl-logos226.js';
import {renderBottomScores} from './scores-render203.js?v=update239';
import {feedBugState} from './scores-bug224.js?v=update239';
const $=id=>document.getElementById(id),batchSize=6,params=new URLSearchParams(location.search);
const mlbProvider=t=>`https://www.mlbstatic.com/team-logos/${t.mlbId}.svg`;
const aliases={ARI:'AZ',CWS:'CHW',ATH:'OAK',KC:'KCR',SD:'SDP',SF:'SFG',TB:'TBR',WSH:'WAS'};
const supplied=mlbLogoAssignments236;
const cases=supplied.map((team,i)=>({id:`mlb-${team.code.toLowerCase()}`,title:`${team.code} · ${team.name}`,note:'Original supplied PNG · '+(aliases[team.code]?`provider alias ${aliases[team.code]}`:'canonical abbreviation'),away:team,home:supplied[(i+13)%supplied.length]}));
for(const team of [{code:'MIA',name:'Miami Marlins',mlbId:'146'},{code:'MIL',name:'Milwaukee Brewers',mlbId:'158'},{code:'NYY',name:'New York Yankees',mlbId:'147'}])cases.push({id:`missing-${team.code.toLowerCase()}`,title:`${team.code} · Provider fallback`,note:'No supplied original; existing provider art remains.',away:team,home:supplied.find(t=>t.code==='PHI')});
cases.push({id:'custom-local',title:'Explicit local assignment',note:'Fixture assigns the Phillies PNG to the Arizona slot to prove that an explicit choice wins.',away:supplied.find(t=>t.code==='ARI'),home:supplied.find(t=>t.code==='ATL'),custom:'broadcast-logos236/mlb/Phillies.png'});
cases.push({id:'nfl-preserved',title:'NFL · Existing assignments preserved',note:'Dallas / Philadelphia retain the pre-existing NFL logo resolver.',league:'NFL',away:{code:'DAL',name:'Dallas Cowboys',mlbId:'6'},home:{code:'PHI',name:'Philadelphia Eagles',mlbId:'21'}});
let jobs=[],serial=0,phase=params.get('phase')||'held',batch=Math.max(0,Math.min(Math.ceil(cases.length/batchSize)-1,Number(params.get('batch'))||0));
let selection=cases.some(c=>c.id===params.get('case'))?params.get('case'):'';
const now=()=>Date.now();
let readiness={status:'idle',assets:[],errors:[]},warmQueue=Promise.resolve();
const decodedImages=new Map();
function thumbnailLogo(entry){return entry.league?nflBroadcastLogo226(entry.league,{abbr:entry.away.code}):entry.custom||mlbBroadcastLogo236('MLB',{abbr:entry.away.code})||mlbProvider(entry.away);}
function waitImage(img,src){
 return new Promise(resolve=>{
  let done=false;const finish=error=>{if(done)return;done=true;clearTimeout(timer);img.removeEventListener('load',loaded);img.removeEventListener('error',failed);resolve(error?{src,error}:{src,loaded:true});};
  const loaded=async()=>{try{await img.decode();finish(img.naturalWidth?'':'Image decoded without pixels');}catch(error){finish(String(error));}};
  const failed=()=>finish('Image request failed');
  const timer=setTimeout(()=>finish('Image load/decode timed out after 12 seconds'),12000);
  img.addEventListener('load',loaded,{once:true});img.addEventListener('error',failed,{once:true});
  if(!img.getAttribute('src'))img.src=src;
  else if(img.complete){if(img.naturalWidth)loaded();else failed();}
 });
}
function warmLogo(src,turn){
 const url=new URL(src,location.href).href;
 // One decode at a time across overlapping builds protects small local-server
 // request queues. Keep decoded Images alive so subsequent renderers reuse them.
 warmQueue=warmQueue.then(async()=>{
  if(turn!==serial)return {src:url,cancelled:true};
  const cached=decodedImages.get(url);if(cached?.naturalWidth)return {src:url,loaded:true,cached:true};
  const img=new Image(),result=await waitImage(img,url);if(result.loaded)decodedImages.set(url,img);return result;
 });
 return warmQueue;
}
function waitFeedSurface(job,turn){
 return new Promise(resolve=>{
  const start=performance.now();
  const check=()=>{
   if(turn!==serial)return resolve('Cancelled by a new batch');
   const host=job.stage.querySelector('.feed-scorebug224');
   if(host?.dataset.error)return resolve(host.dataset.error);
   if(host?._ready&&host.shadowRoot?.querySelector('.bug-wrap'))return resolve('');
   if(performance.now()-start>12000)return resolve('Feed stylesheet/render initialization timed out after 12 seconds');
   requestAnimationFrame(check);
  };check();
 });
}
async function readyOutputs(job,turn){
 const errors=[],surfaceError=await waitFeedSurface(job,turn);if(surfaceError)errors.push(surfaceError);
 if(turn!==serial)return errors;
 const images=[job.thumbnail,...allElements(job.stage).filter(el=>el.tagName==='IMG')];
 for(const img of images){const result=await waitImage(img,img.currentSrc||img.src);if(result.error)errors.push(result.src+': '+result.error);if(turn!==serial)break;}
 return errors;
}

function gameFor(entry){
 const team=(t,side)=>({id:t.mlbId,abbr:entry.league?t.code:aliases[t.code]||t.code,name:t.name,record:side==='away'?'90-72':'89-73',score:side==='away'?'5':'3',color:side==='away'?'#1e4267':'#922a32',secondary:'#c8d4dd',logo:side==='away'&&entry.custom?entry.custom:entry.league?'':mlbProvider(t)});
 const game={id:entry.id,league:entry.league||'MLB',provider:entry.league?'ESPN':'MLB',state:phase==='live'?'in':'post',status:phase==='live'?'TOP 7TH · 1 OUT':'Final',updatedAt:now(),playersUpdatedAt:now(),broadcast:'DEMO NETWORK',away:team(entry.away,'away'),home:team(entry.home,'home'),possession:phase==='live'?entry.away.mlbId:'',detail:''};
 if(entry.league&&phase==='live')Object.assign(game,{status:'3rd Quarter',quarter:'3',clock:'07:28',down:'2nd & 6'});
 game.players=[{name:'Example Player',team:game.away.abbr,teamId:game.away.id,position:entry.league?'QB':'RF',text:entry.league?'275 YDS, 3 TD':'3-4, 2 RBI'}];
 return game;
}
function stateFor(entry){const time=now(),game=gameFor(entry);return {branding:{bugBottom:36,bugScale:1},bottomScores:{league:game.league,leagues:[game.league],games:[game],visible:true,feedBugVisible:true,feedBugGameId:game.id,gameId:game.id,titlesEnabled:false,playerStats:phase==='stat',anchor:time-(phase==='stat'?11000:0),holdAt:time,updatedAt:time}};}
function fit(){for(const job of jobs){const scale=job.viewport.clientWidth/1920;job.viewport.style.height=(330*scale)+'px';job.stage.style.transform=`scale(${scale}) translateY(-750px)`;}}
function allElements(root){const result=[];for(const el of root.querySelectorAll('*')){result.push(el);if(el.shadowRoot)result.push(...allElements(el.shadowRoot));}return result;}
function animations(root){return allElements(root).flatMap(el=>el.getAnimations?.()||[]);}
function expectedLogo(game,side){const team=game[side];return nflBroadcastLogo226(game.league,team)||mlbBroadcastLogo236(game.league,team,game.provider)||team.logo;}
function report(){
 const rows=jobs.map(job=>{const game=job.state.bottomScores.games[0],images=allElements(job.stage).filter(el=>el.tagName==='IMG');const outputs=images.map(img=>{const rect=img.getBoundingClientRect(),css=getComputedStyle(img),box=img.parentElement?.getBoundingClientRect();return {surface:img.getRootNode() instanceof ShadowRoot?'feed-scorebug':'bottom-strip',src:img.getAttribute('src'),loaded:img.complete&&img.naturalWidth>0,natural:[img.naturalWidth,img.naturalHeight],width:+rect.width.toFixed(2),height:+rect.height.toFixed(2),parentWidth:box?+box.width.toFixed(2):null,parentHeight:box?+box.height.toFixed(2):null,fit:css.objectFit,position:css.objectPosition};});
  const feed=feedBugState(game,job.state.bottomScores);return {case:job.entry.id,phase,expected:{away:expectedLogo(game,'away'),home:expectedLogo(game,'home')},resolvedFeed:{away:feed.teams.away.logo,home:feed.teams.home.logo},outputs,missingImages:outputs.filter(img=>!img.loaded).length,stripText:job.stage.querySelector('.bottom-scores203')?.textContent||'',feedStatus:feed.game.bottomStatus,errors:allElements(job.stage).filter(el=>el.dataset?.error).map(el=>el.dataset.error)};
 });
 const result={isolated:true,totalCases:cases.length,suppliedOriginals:27,batch,phase,selection,readiness,visibleCases:rows.length,rows};$('report').textContent=JSON.stringify(result,null,2);document.body.dataset.reviewReady=String(readiness.status==='ready');window.mlbReview236Report=result;return result;
}
async function build(){
 const turn=++serial;readiness={status:'warming',assets:[],errors:[]};document.body.dataset.reviewReady='false';for(const job of jobs)for(const animation of animations(job.stage))animation.cancel();jobs=[];$('grid').replaceChildren();$('report').textContent='Loading and decoding batch artwork sequentially…';
 const selected=selection?cases.filter(c=>c.id===selection):cases.slice(batch*batchSize,(batch+1)*batchSize);
 $('previous').disabled=batch===0;$('next').disabled=batch>=Math.ceil(cases.length/batchSize)-1;$('update').disabled=true;$('exit').disabled=true;
 const url=new URL(location.href);url.searchParams.set('batch',String(batch));url.searchParams.set('phase',phase);if(selection)url.searchParams.set('case',selection);else url.searchParams.delete('case');history.replaceState(null,'',url);
 const sources=new Set();for(const entry of selected){const game=gameFor(entry);sources.add(thumbnailLogo(entry));for(const side of ['away','home'])sources.add(expectedLogo(game,side));}
 let loaded=0;for(const src of sources){
  $('status').textContent=`Decoding artwork ${++loaded}/${sources.size} for ${selected.length} cases…`;
  const result=await warmLogo(src,turn);if(turn!==serial)return;readiness.assets.push(result);if(result.error)readiness.errors.push(result.src+': '+result.error);
 }
 if(turn!==serial)return;readiness.status='rendering';
 // Production motion starts only after the unique batch logos are decoded.
 // It is never paused, intercepted or replaced by this review harness.
 for(const entry of selected){
  const card=document.createElement('article'),head=document.createElement('div'),title=document.createElement('div');head.className='case-head';const thumbnail=document.createElement('img');thumbnail.alt=entry.away.name;thumbnail.src=thumbnailLogo(entry);const h=document.createElement('h2');h.textContent=entry.title;const note=document.createElement('p');note.textContent=entry.note;title.append(h,note);head.append(thumbnail,title);const viewport=document.createElement('div');viewport.className='viewport';const stage=document.createElement('div');stage.className='stage';viewport.append(stage);const foot=document.createElement('div');foot.className='case-foot';foot.textContent=entry.id+' · real production outputs · synthetic game';card.append(head,viewport,foot);$('grid').append(card);const state=stateFor(entry),job={entry,card,viewport,stage,thumbnail,state};jobs.push(job);renderBottomScores(stage,state);fit();
  const errors=await readyOutputs(job,turn);if(turn!==serial)return;readiness.errors.push(...errors.map(error=>entry.id+': '+error));
 }
 if(turn!==serial)return;readiness.status='ready';$('update').disabled=false;$('exit').disabled=false;
 $('status').textContent=`Showing ${selected.length} of ${cases.length} cases · 27 supplied MLB originals, 3 provider fallbacks, custom override and NFL control.`+(readiness.errors.length?` ${readiness.errors.length} explicit loading error(s); see report.`:' All batch artwork and output images decoded.');
 report();
}

for(let i=0;i<Math.ceil(cases.length/batchSize);i++){const option=document.createElement('option');option.value=String(i);option.textContent=`${i+1}: ${cases[i*batchSize].title.split(' · ')[0]} – ${cases[Math.min(cases.length-1,(i+1)*batchSize-1)].title.split(' · ')[0]}`;$('batch').append(option);}
for(const entry of cases){const option=document.createElement('option');option.value=entry.id;option.textContent=entry.title;$('case').append(option);}
$('batch').value=String(batch);$('case').value=selection;$('phase').value=phase;
$('batch').onchange=()=>{batch=Number($('batch').value);selection='';$('case').value='';build();};$('case').onchange=()=>{selection=$('case').value;build();};$('phase').onchange=()=>{phase=$('phase').value;build();};
for(const [id,delta] of [['previous',-1],['next',1]])$(id).onclick=()=>{batch+=delta;$('batch').value=String(batch);selection='';$('case').value='';build();};
$('replay').onclick=build;$('update').onclick=()=>{for(const job of jobs){const game=job.state.bottomScores.games[0];game.away.score=String(Number(game.away.score)+1);game.home.score=String(Number(game.home.score)+2);game.updatedAt=now();job.state.bottomScores.visible=true;job.state.bottomScores.feedBugVisible=true;renderBottomScores(job.stage,job.state);}setTimeout(report,1200);};
$('exit').onclick=()=>{for(const job of jobs){job.state.bottomScores.visible=false;job.state.bottomScores.feedBugVisible=false;renderBottomScores(job.stage,job.state);}setTimeout(report,1000);};$('measure').onclick=report;
window.addEventListener('resize',fit);window.reportMLB236=report;build();
