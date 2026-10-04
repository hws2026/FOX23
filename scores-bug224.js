import {nflBroadcastLogo226} from './nfl-logos226.js';
import {scorebug,animateScorebugOut,finishBugEntrance,animateScoreChange,morph} from './feed-scorebug225.js';
export function feedGame(games,cfg,frame){
 if(cfg.feedBugGameId)return games.find(g=>g.id===cfg.feedBugGameId)||null;
 if(frame?.game&&!frame.game._titleCard)return games.find(g=>g.id===frame.game.id)||null;
 const league=frame?.game?._activeLeague;
 return games.find(g=>!league||g.league===league)||null;
}
const color=(value,fallback)=>/^#?[0-9a-f]{6}$/i.test(value||'')?'#'+value.replace(/^#/,''):fallback;
const safeLogo=value=>/^https:\/\/|^data:image\/(?:png|jpeg|webp);base64,/.test(value||'')?value:'';
export function feedBugState(game,cfg={},now=Date.now()){
 if(!game)return null;
 const live=game.state==='in',stale=live&&now-Number(game.updatedAt||cfg.updatedAt||0)>90000;
 const final=game.state==='post'&&!/postpon|cancel|suspend|abandon|delay/i.test(game.status||'');
 const football=['NFL','NCAAF'].includes(game.league);
 const down=football&&String(game.down||'').match(/^([1-4])(?:st|nd|rd|th)?\s*(?:&|and)\s*(.+)$/i);
 const rawClock=String(game.clock||''),clock=rawClock.match(/^(\d+):(\d{2})(?:\.\d+)?$/);
 const period=Number(game.period||String(game.quarter||'').replace(/^Q/,''));
 const quarter=game.quarter==='OT'||period>4?'OT':['','1ST','2ND','3RD','4TH'][period]||'';
 const active=live&&!stale;
 const teams=Object.fromEntries(['away','home'].map(side=>{const t=game[side]||{};return[side,{name:t.name||t.abbr||'',abbr:t.abbr||'',record:t.record||'',logo:nflBroadcastLogo226(game.league,t)||safeLogo(t.logo),color:color(t.color,'#243545'),secondary:color(t.secondary,'#c8d4dd')}];}));
 let status=stale?'UPDATES DELAYED':final?'FINAL':active&&clock&&quarter?'LIVE':game.status||'SCHEDULED';
 if(active&&/half|end|intermission/i.test(game.status||''))status=game.status.toUpperCase();
 const scores=Object.fromEntries(['away','home'].map(side=>[side,/^\d{1,3}$/.test(String(game[side]?.score))?String(game[side].score):'—']));
 return {teams,branding:{bugBottom:0,bugScale:Number(cfg.bugScale)||1},program:{graphic:{type:'scorebug'}},game:{scores,quarter,clock:{remaining:clock?Number(clock[1])*60+Number(clock[2]):0,running:false,anchor:0},playClock:{remaining:0,running:false,anchor:0},showInfo:true,showPlayClock:false,showDownDistance:active&&!!down,down:down?['','1ST','2ND','3RD','4TH'][Number(down[1])]:'',distance:down?down[2].toUpperCase():'',showBallPosition:active&&football&&!!game.ball,ballOn:game.ball||'',bottomStatus:status,flag:false,possession:active&&game.possession?['away','home'].find(side=>String(game[side]?.id)===String(game.possession))||'none':'none',timeouts:{away:0,home:0}}};
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
 const sheets=['graphics.css?v=20260923-controls105','reference.css?v=ref219'];
 const ready=sheets.map(path=>new Promise(resolve=>{const link=document.createElement('link');link.rel='stylesheet';link.href=new URL(path,import.meta.url).href;link.onload=()=>resolve(true);link.onerror=()=>resolve(false);shadow.append(link);}));
 const style=document.createElement('style');style.textContent=shadowCSS;shadow.append(style,surface);host._surface=surface;root.append(host);
 Promise.all(ready).then(result=>{if(!host.isConnected)return;if(result.some(ok=>!ok)){host.dataset.error='Scorebug styles failed to load; reload output.';return;}host._ready=true;surface.style.visibility='visible';draw(host);});
 return host;
}
function draw(host){
 if(!host._ready)return;
 const {cfg,game}=host._latest,root=host._surface;let bug=root.querySelector('.bug-wrap');
 if(!cfg.feedBugVisible||!game){if(bug&&!bug.classList.contains('bug-exit'))animateScorebugOut(bug,'auto');return;}
 const html=feedBugMarkup(game,{...cfg,bugScale:host._branding?.bugScale});if(bug&&host._html===html&&!bug.classList.contains('bug-exit'))return;
 const template=document.createElement('template');template.innerHTML=html;const next=template.content.firstElementChild;next.dataset.motion='auto';
 if(bug?.classList.contains('bug-exit')){bug.getAnimations({subtree:true}).forEach(a=>a.cancel());clearTimeout(bug._motionTimer);bug.remove();bug=null;}
 if(!bug){bug=next;bug.classList.add('bug-enter');root.append(bug);finishBugEntrance(bug);}
 else{
  const oldScores=Object.fromEntries(['away','home'].map(side=>[side,bug.querySelector('[data-score-side='+side+']').dataset.scoreValue]));
  const sameGame=host._gameId===game.id,entering=bug.classList.contains('bug-enter');
  if(entering)next.classList.add('bug-enter');
  const oldDown=bug.querySelector('.down-current').textContent;
  if(sameGame){for(const pop of bug.querySelectorAll(':scope > .score-add'))next.append(pop.cloneNode(true));for(const side of ['away','home']){const cell=bug.querySelector('[data-score-side='+side+']'),fresh=next.querySelector('[data-score-side='+side+']');if(cell.dataset.scoreValue===fresh.dataset.scoreValue)fresh.replaceWith(cell.cloneNode(true));}}
  morph(bug,next);
  if(sameGame&&!entering)for(const side of ['away','home']){const cell=bug.querySelector('[data-score-side='+side+']');if(oldScores[side]!==cell.dataset.scoreValue&&/^\d+$/.test(oldScores[side])&&/^\d+$/.test(cell.dataset.scoreValue))animateScoreChange(cell,oldScores[side],cell.dataset.scoreValue);}
  const down=bug.querySelector('.down');if(sameGame&&!entering&&oldDown!==down.querySelector('.down-current').textContent&&!matchMedia('(prefers-reduced-motion: reduce)').matches){clearTimeout(down._rollTimer);down.dataset.previous=oldDown;down.classList.remove('rolling');void down.offsetWidth;down.classList.add('rolling');down._rollTimer=setTimeout(()=>{down.classList.remove('rolling');delete down.dataset.previous;},380);}
 }
 for(const img of bug.querySelectorAll('.team-logo'))img.onerror=()=>{const fallback=document.createElement('span');fallback.className='team-monogram';fallback.textContent=game[img.closest('.home')?'home':'away'].abbr||'';img.replaceWith(fallback);};
 host._html=html;host._gameId=game.id;
}
export function renderFeedBug(root,cfg,game,branding={}){
 let host=root.querySelector('.feed-scorebug224');if(!host&&!cfg.feedBugVisible)return;
 if(!host)host=makeHost(root);host._branding=branding;host.style.setProperty('--feed-bottom225',String(Number(branding.bugBottom)||64)+'px');host.style.transform=cfg.visible?'translateY(-58px)':'translateY(0)';host._latest={cfg,game};draw(host);
}
