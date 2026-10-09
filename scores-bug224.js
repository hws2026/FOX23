import {nflBroadcastLogo226} from './nfl-logos226.js';
import {mlbBroadcastLogo236} from './mlb-logos236.js';
import {scorebug,animateScorebugOut,finishBugEntrance,morph} from './feed-scorebug225.js';
import {feedUpdateSnapshot,feedUpdateTargets,runFeedLightUpdate,beginFeedLights,feedLightCSS} from './feed-light231.js?v=update238';
export function feedGame(games,cfg,frame){
 if(cfg.feedBugGameId)return games.find(g=>g.id===cfg.feedBugGameId)||null;
 if(frame?.game&&!frame.game._titleCard)return games.find(g=>g.id===frame.game.id&&g.league===frame.game.league)||null;
 if(frame?.game?._feedGameId)return games.find(g=>g.id===frame.game._feedGameId&&g.league===frame.game._feedGameLeague)||null;
 const league=frame?.game?._activeLeague;
 return games.find(g=>!league||g.league===league)||null;
}
const color=(value,fallback)=>/^#?[0-9a-f]{6}$/i.test(value||'')?'#'+value.replace(/^#/,''):fallback;
const safeLogo=value=>/^https:\/\/|^data:image\/(?:png|jpeg|webp);base64,/.test(value||'')?value:'';
export function feedBugState(game,cfg={},now=Date.now()){
 if(!game)return null;
 const live=game.state==='in',stale=live&&now-Number(game.updatedAt||cfg.updatedAt||0)>90000;
 const final=game.state==='post'&&!/postpon|cancel|suspend|abandon|delay/i.test(game.status||'');
 const football=['NFL','NCAAF','UFL'].includes(game.league);
 const down=football&&String(game.down||'').trim().match(/^([1-4])(?:st|nd|rd|th)?\s*(?:&|and)\s*(goal|\d{1,3})(?=\s|$)/i);
 const rawClock=String(game.clock||''),clock=rawClock.match(/^(\d+):(\d{2})(?:\.\d+)?$/);
 const period=Number(game.period||String(game.quarter||'').replace(/^Q/,''));
 const rawStatus=String(game.status||''),structured=football||game.league==='NBA';
 const finalOT=final&&rawStatus.match(/^final\s*\/\s*(?:(\d+)\s*)?OT(\d+)?$/i);
 const quarter=finalOT?'OT':structured?(game.quarter==='OT'||period>4?'OT':['','1ST','2ND','3RD','4TH'][period]||''):'';
 const overtimePeriod=finalOT?Number(finalOT[1]||finalOT[2]||1):structured&&period>4?period-4:1;
 const interrupted=/postpon|cancel|suspend|abandon|delay|half[ -]?time|^half$|intermission|\bend\b/i.test(rawStatus);
 const active=live&&!stale&&!interrupted;
 const teams=Object.fromEntries(['away','home'].map(side=>{const t=game[side]||{};return[side,{name:t.name||t.abbr||'',abbr:t.abbr||'',record:t.record||'',logo:nflBroadcastLogo226(game.league,t)||(game.league==='MLB'?mlbBroadcastLogo236(game.league,t,game.provider):'')||safeLogo(t.logo),color:color(t.color,'#243545'),secondary:color(t.secondary,'#c8d4dd')}];}));
 // Baseball innings, soccer time and college-basketball halves come from the
 // provider's status text instead of being mislabeled as football quarters.
 const providerStatus=rawStatus.toUpperCase()==='LIVE'?(clock?rawClock:'IN PROGRESS'):rawStatus.toUpperCase();
 const status=stale?'UPDATES DELAYED':final?(finalOT?'FINAL/OT':'FINAL'):active&&structured&&clock&&quarter?'LIVE':providerStatus||(live?'IN PROGRESS':'SCHEDULED');
 const scores=Object.fromEntries(['away','home'].map(side=>[side,/^\d{1,3}$/.test(String(game[side]?.score))?String(game[side].score):'—']));
 return {teams,branding:{bugBottom:0,bugScale:Number(cfg.bugScale)||1},program:{graphic:{type:'scorebug'}},game:{scores,quarter,overtimePeriod,clock:{remaining:clock?Number(clock[1])*60+Number(clock[2]):0,running:false,anchor:0},playClock:{remaining:0,running:false,anchor:0},showInfo:true,showPlayClock:false,showDownDistance:active&&!!down,down:down?['','1ST','2ND','3RD','4TH'][Number(down[1])]:'',distance:down?down[2].toUpperCase():'',showBallPosition:active&&football&&!!game.ball,ballOn:game.ball||'',bottomStatus:status,flag:false,possession:active&&game.possession?['away','home'].find(side=>String(game[side]?.id)===String(game.possession))||'none':'none',timeouts:{away:0,home:0}}};
}
export function feedBugMarkup(game,cfg,now=Date.now()){
 const state=feedBugState(game,cfg,now);return state?scorebug(state):'';
}
const shadowCSS=`:host{--display:Impact,'Arial Narrow',sans-serif;--accent:#f9cb40;color:#f6f9fc;font-family:'Arial Narrow',Arial,sans-serif} .feed-root225{position:absolute;inset:0;visibility:hidden} .feed-root225 .bug-wrap{bottom:var(--feed-bottom225,64px)!important} .timeout-bars{visibility:hidden} .feed-root225 .information.status-mode .game-status{font-size:36px} .feed-root225 .record:empty{display:none}`;
function makeHost(root){
 const host=document.createElement('aside');host.className='feed-scorebug224';host.setAttribute('aria-label','Feed scorebug');
 // Separate DOM prevents the main game clock, main renderer, and SVG IDs from
 // overwriting or removing the independent feed scorebug.
 const shadow=host.attachShadow({mode:'open'}),surface=document.createElement('div');surface.className='feed-root225';
 const sheets=['graphics.css?v=20260923-controls105','reference.css?v=update238'];
 const ready=sheets.map(path=>new Promise(resolve=>{const link=document.createElement('link');link.rel='stylesheet';link.href=new URL(path,import.meta.url).href;link.onload=()=>resolve(true);link.onerror=()=>resolve(false);shadow.append(link);}));
 const style=document.createElement('style');style.textContent=shadowCSS+feedLightCSS;shadow.append(style,surface);host._surface=surface;root.append(host);
 Promise.all(ready).then(result=>{if(!host.isConnected)return;if(result.some(ok=>!ok)){host.dataset.error='Scorebug styles failed to load; reload output.';return;}host._ready=true;draw(host);alignFeedBug(root,host,host._latest.cfg,host._branding||{});surface.style.visibility='visible';});
 return host;
}
// All dimensions are stage CSS pixels, so scaled controller previews and OBS
// outputs use the same separation. The strip offset is already in mainTop.
export function feedBugBottom232(base,stageHeight,mainTop,stripOffset=0,overhang=0){
 const bottom=Number.isFinite(Number(base))?Number(base):64;
 return Number.isFinite(mainTop)?Math.max(bottom,stageHeight-mainTop+12+overhang-stripOffset):bottom;
}
function alignFeedBug(root,host,cfg,branding){
 const rawBottom=branding.bugBottom,base=rawBottom==null?64:Number(rawBottom),strip=cfg.visible?58:0;
 const main=root.querySelector('.bug-wrap'),rect=root.getBoundingClientRect(),height=root.offsetHeight||1080,scale=rect.height/height||1;
 let mainTop;
 // The wrapper stays fixed during IN/OUT. Reserve the established 32px logo
 // overhang in its own scale rather than following animated child bounds.
 if(main){const box=main.getBoundingClientRect(),bugScale=box.height/(main.offsetHeight||200)/scale;mainTop=(box.top-rect.top)/scale-32*bugScale;const flag=main.querySelector('.flag-tab.on');if(flag)mainTop=Math.min(mainTop,(box.top-rect.top)/scale+flag.offsetTop*bugScale);}
 const bug=host._surface?.querySelector('.bug-wrap'),ball=bug?.querySelector('.ball-marker:not(.ball-hidden)');
 const overhang=ball?Math.max(0,(ball.getBoundingClientRect().bottom-bug.getBoundingClientRect().bottom)/scale):0;
 host.style.setProperty('--feed-bottom225',feedBugBottom232(base,height,mainTop,strip,overhang)+'px');host.style.transform=strip?'translateY(-58px)':'translateY(0)';
}
function draw(host,commitLight=false){
 if(!host.isConnected){host._light231?.cancel();host._light231=null;return;}
 if(!host._ready)return;
 const {cfg,game}=host._latest,root=host._surface;let bug=root.querySelector('.bug-wrap');
 if(!cfg.feedBugVisible||!game){host._light231?.cancel();host._light231=null;if(bug&&!bug.classList.contains('bug-exit'))animateScorebugOut(bug,'auto');return;}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(host._light231&&reduced){host._light231.cancel();host._light231=null;}
 const state=feedBugState(game,{...cfg,bugScale:host._branding?.bugScale}),snapshot=feedUpdateSnapshot(game,state),html=scorebug(state);
 if(host._light231&&!commitLight){
  const pending=feedUpdateTargets(host._snapshot231,snapshot),covered=host._lightTargets231.includes('matchup')||pending.every(target=>host._lightTargets231.includes(target));
  // Escalate a pending score sweep if the feed switches games before commit.
  // Updates after the midpoint wait for the next sweep instead of flashing twice.
  if(!host._lightCommitted231&&(!pending.length||!covered)){host._light231.cancel();host._light231=null;}
  else return;
 }
 const targets=feedUpdateTargets(host._snapshot231,snapshot);
 if(bug&&host._html===html&&!targets.length&&!bug.classList.contains('bug-exit')){host._snapshot231=snapshot;return;}
 if(!commitLight&&bug&&!bug.classList.contains('bug-enter')&&!bug.classList.contains('bug-exit')&&targets.length&&!reduced){
  host._lightTargets231=targets;host._lightCommitted231=false;
  host._light231=runFeedLightUpdate({begin:()=>beginFeedLights(root,bug,targets),commit:()=>{host._lightCommitted231=true;draw(host,true);},finish:()=>{host._light231=null;draw(host);}});
  return;
 }
 const template=document.createElement('template');template.innerHTML=html;const next=template.content.firstElementChild;next.dataset.motion='auto';
 if(bug?.classList.contains('bug-exit')){bug.getAnimations({subtree:true}).forEach(a=>a.cancel());clearTimeout(bug._motionTimer);bug.remove();bug=null;}
 if(!bug){bug=next;bug.classList.add('bug-enter');root.append(bug);finishBugEntrance(bug);}
 else{
  const sameGame=host._snapshot231?.match===snapshot.match,entering=bug.classList.contains('bug-enter');
  if(entering)next.classList.add('bug-enter');
  const oldDown=bug.querySelector('.down-current').textContent;
  morph(bug,next);
  const down=bug.querySelector('.down');if(sameGame&&!entering&&oldDown!==down.querySelector('.down-current').textContent&&!matchMedia('(prefers-reduced-motion: reduce)').matches){clearTimeout(down._rollTimer);down.dataset.previous=oldDown;down.classList.remove('rolling');void down.offsetWidth;down.classList.add('rolling');down._rollTimer=setTimeout(()=>{down.classList.remove('rolling');delete down.dataset.previous;},380);}
 }
 for(const img of bug.querySelectorAll('.team-logo'))img.onerror=()=>{const fallback=document.createElement('span');fallback.className='team-monogram';fallback.textContent=game[img.closest('.home')?'home':'away'].abbr||'';img.replaceWith(fallback);};
 host._html=html;host._gameId=game.id;host._snapshot231=snapshot;
}
export function renderFeedBug(root,cfg,game,branding={}){
 let host=root.querySelector('.feed-scorebug224');if(!host&&!cfg.feedBugVisible)return;
 if(!host)host=makeHost(root);host._branding=branding;host._latest={cfg,game};draw(host);alignFeedBug(root,host,cfg,branding);
}
