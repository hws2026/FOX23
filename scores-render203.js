import {morph} from './feed-scorebug225.js';
import {nflBroadcastLogo226} from './nfl-logos226.js';
import {mlbBroadcastLogo236} from './mlb-logos236.js';
import{titleLabels,leagueNetwork}from'./scores-titles219.js?v=update239';
import{buildScorePlan,selectedScoreLeagues}from'./scores-sequence224.js?v=update239';
import{feedGame,renderFeedBug}from'./scores-bug224.js?v=update239';
const sheet224=document.createElement('link');sheet224.rel='stylesheet';sheet224.href=new URL('./scores224.css?v=update239',import.meta.url).href;document.head.append(sheet224);
import{tickerFrame,gameDetails,playerTeam,playerTeamAbbr,playerDetailText}from'./scores-timing209.js?v=update239';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sessions=new WeakMap();
// Keep the assigned team name complete without taking space from its logo,
// record or score. Re-measure after updates and font loads; exiting rows retain
// their captured fit so the horizontal name geometry never jumps during OUT.
function fitScoreTeamNames234(root){
 for(const label of root.querySelectorAll('.bs-game-row:not(.bs-row-old) .bs-team-name234')){
  if(!label.clientWidth)continue;
  label.style.fontSize='';
  let size=parseFloat(getComputedStyle(label).fontSize)||27;
  for(let pass=0;pass<3&&label.scrollWidth>label.clientWidth;pass++){
   size=Math.max(1,Math.floor(size*Math.max(1,label.clientWidth-2)/label.scrollWidth*100)/100);
   label.style.fontSize=size+'px';
  }
 }
}
// Freeze the visible slide, not a clone with reset Web Animation state. Temporary
// score digits are never carried into the next card.
function tickerSnapshot(node){
 if(!node)return null;
 const copy=node.cloneNode(true),sources=[node,...node.querySelectorAll('*')],copies=[copy,...copy.querySelectorAll('*')];
 sources.forEach((source,i)=>{if(source===node||source.matches('.bs-deck224-card,.bs-detail-text228')){const css=getComputedStyle(source);for(const name of ['transform','opacity','flexGrow','paddingLeft','paddingRight','borderRightWidth'])copies[i].style[name]=css[name];}});
 copy.querySelectorAll('.bs-score-old,.bs-status-old228,.bs-row-old').forEach(el=>el.remove());
 copy.querySelectorAll('.bs-score-value').forEach(el=>el.style.transform='none');
 return copy;
}
function stopTickerMotion(el){el.getAnimations({subtree:true}).forEach(a=>a.cancel());el._scroll=null;}
function scoreFrame(session,cfg){
 const selected=selectedScoreLeagues(cfg),games=(cfg.games||[]).filter(g=>selected.includes(g.league));
 const elapsed=Math.max(0,(cfg.holdAt||Date.now())-(cfg.anchor||0));
 const key=JSON.stringify([selected,cfg.gameId,!!cfg.playerStats,cfg.titlesEnabled!==false,cfg.anchor,games.map(g=>[g.league,g.id])]);
 if(!session.rotation||session.rotation.key!==key||elapsed<session.rotation.start||elapsed>=session.rotation.end){
  const plan=buildScorePlan(games,cfg).map(g=>g._titleCard?g:{...g,_tickerDetails:gameDetails(g,cfg.playerStats)});
  const duration=Math.max(1,plan.reduce((n,g)=>n+(tickerFrame([g],0,null,cfg.playerStats)?.duration||30000),0));
  const start=Math.floor(elapsed/duration)*duration;
  session.rotation={key,start,end:start+duration,plan};
 }
 const frame=tickerFrame(session.rotation.plan,elapsed-session.rotation.start,cfg.gameId,cfg.playerStats);
 const game=games.find(g=>g.id===frame?.game.id&&g.league===frame?.game.league)||frame?.game;
 if(frame&&game&&!game._titleCard){const current=gameDetails(game,cfg.playerStats);frame.detail=current[frame.slot]||current[0]||'';}
 return{games,frame,game};
}
function draw(root,s){
 const cfg=s.bottomScores||{},session=sessions.get(root),{games,frame,game}=scoreFrame(session,cfg);
 renderFeedBug(root,cfg,feedGame(games,cfg,frame),s.branding);
 let el=root.querySelector('.bottom-scores203');
 if(!cfg.visible){if(el&&!el._exit){el._exit=el.animate([{opacity:1},{opacity:0}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:180,fill:'both'});el._exit.onfinish=()=>{stopTickerMotion(el);el.remove();};}return;}
 if(el?._exit){el._exit.cancel();el._exit=null;}
 if(!el){el=document.createElement('aside');el.className='bottom-scores203';root.append(el);}
 if(!game){const html=`<b class="bs-league">${esc(selectedScoreLeagues(cfg).join(' / '))}</b><span class="bs-empty">${esc(cfg.error?'Score feed unavailable':cfg.updatedAt?'No games scheduled this week':'Loading scores…')}</span>`;if(el._markup!==html){stopTickerMotion(el);el.innerHTML=html;el._markup=html;}el._game=null;return;}

 const final=game.state==='post'&&!/postpon|cancel|suspend|abandon|delay/i.test(game.status);
 const stale=!final&&Date.now()-Number(game.updatedAt||cfg.updatedAt)>90000;
 const scores=[game.away.score,game.home.score];
 const validScores=scores.every(v=>v!==''&&v!=null&&Number.isFinite(Number(v)));
 const winner=final&&validScores&&Number(scores[0])!==Number(scores[1])?(Number(scores[0])>Number(scores[1])?'away':'home'):null;
 const team=t=>{const side=t.side||(t===game.home?'home':'away');return `<div data-score-side="${side}" class="bs-team ${winner===side?'bs-winner':''}"><img src="${esc(nflBroadcastLogo226(game.league,t)||(game.league==='MLB'?mlbBroadcastLogo236(game.league,t,game.provider):'')||(/^https:\/\//.test(t.logo)?t.logo:'data:,'))}" alt=""><strong class="bs-team-name234">${esc(t.name||t.abbr)}</strong><small>${esc(t.record)}</small><b class="${!stale&&game.possession&&String(game.possession)===String(t.id)?'bs-possession':''}"><span class="bs-score-window"><span class="bs-score-value">${esc(t.score)}</span></span></b></div>`;};
 let detail=final&&frame.slot===0?'FINAL':frame.detail;
 if(stale)detail='UPDATES DELAYED';
 const playerRows=[...(game.leaders||[]),...(cfg.playerStats&&Date.now()-Number(game.playersUpdatedAt||0)<90000?game.players||[]:[])];
 const playerRow=!stale&&playerRows.find(r=>detail===playerDetailText(game,r));
 const playerDetail=!!playerRow;
 const playerSide=playerRow&&playerTeam(game,playerRow);
 const playerBadge=playerRow?(playerSide?team(playerSide):`<b class="bs-player-team228">${esc(playerTeamAbbr(game,playerRow))}</b>`):'';
 const title=game._titleCard,labels=titleLabels(cfg,game.league,s.branding);
 const deck=title&&game._leagueDeck;
 const deckHtml=deck?`<b class="bs-league">${esc(game._activeLeague||game.league)}</b><div class="bs-game-window"><div class="bs-game-row bs-deck224">${game._leagueDeck.map(l=>`<div class="bs-deck224-card ${l===game._activeLeague?'is-active':''} ${game._completedLeagues.includes(l)?'is-completed':''} ${l===game._leavingLeague?'is-leaving':''}" data-league="${esc(l)}"><b>${esc(l)}</b><small>${esc(titleLabels(cfg,l,s.branding).join(' · '))}</small></div>`).join('')}</div>${game._emptyLeague?`<span class="bs-deck224-empty">${esc(game._activeLeague)} · ${esc(cfg.error?'Feed unavailable':cfg.updatedAt?game._emptyMessage:'Loading scores…')}</span>`:''}</div>`:'';
 const html=deck?deckHtml:title?`<b class="bs-league">${esc(game.league)}</b><div class="bs-game-window"><div class="bs-game-row bs-title212" style="--title-font:${labels.length>4?20:25}px;grid-template-columns:repeat(${Math.max(1,labels.length)},minmax(0,1fr))">${labels.map(label=>`<span>${esc(label)}</span>`).join('')}</div></div>`:`<b class="bs-league">${esc(game.league)}</b><div class="bs-game-window"><div class="bs-game-row ${playerDetail?'bs-player-detail':''}">${playerDetail?playerBadge:team(game.away)+team(game.home)}<div class="bs-status"><div class="bs-detail-window228"><span class="bs-detail-text228">${playerDetail?`<strong>${esc(playerRow.name)}</strong>${playerRow.position?` <small>${esc(playerRow.position)}</small>`:''}<i></i>${esc(playerRow.text)}`:esc(detail).replace(/  \|  /g,'<i></i>')}</span></div></div></div></div>`;
 if(el._markup!==html||el._game?.id!==game.id||el._game?.league!==game.league){
  const previous=el._game,cardChanged=!previous||previous.id!==game.id||previous.league!==game.league||((playerDetail||previous.playerDetail)&&previous.detail!==detail)||previous.playerDetail!==playerDetail;
  const oldRow=tickerSnapshot(el.querySelector('.bs-game-row')),oldStatus=tickerSnapshot(el.querySelector('.bs-status')),images=new Map([...el.querySelectorAll('img')].map(img=>[img.src,img]));
  el._markup=html;
  if(cardChanged){stopTickerMotion(el);el.innerHTML=html;}
  else{
   const next=document.createElement('aside');next.className=el.className;next.innerHTML=html;
   // Keep current row/deck nodes so unrelated polls and branding edits cannot
   // restart, cancel or reset an in-progress slide or a completed deck collapse.
   const window=next.querySelector('.bs-game-window');for(const outgoing of el.querySelectorAll('.bs-row-old'))window?.append(outgoing.cloneNode(true));
   if(previous.detail===detail)for(const outgoing of el.querySelectorAll('.bs-status-old228'))window?.append(outgoing.cloneNode(true));
   for(const side of ['away','home']){const selector=`[data-score-side="${side}"] .bs-score-window`,cell=el.querySelector(selector),fresh=next.querySelector(selector);if(cell&&fresh){if(previous[side]===String(game[side].score))fresh.replaceWith(cell.cloneNode(true));else cell.getAnimations({subtree:true}).forEach(a=>a.cancel());}}
   if(previous.detail!==detail){el._scroll?.cancel();el._scroll=null;el.querySelector('.bs-status')?.getAnimations().forEach(a=>a.cancel());}
   const animations=el.getAnimations({subtree:true});morph(el,next);animations.filter(a=>!a.effect?.target?.isConnected).forEach(a=>a.cancel());
  }
  for(const img of el.querySelectorAll('img')){const loaded=images.get(img.src);if(loaded?.complete&&loaded.naturalWidth&&loaded!==img)img.replaceWith(loaded);}
  for(const img of el.querySelectorAll('img'))img.onerror=()=>{img.style.visibility='hidden';};
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
   if(cardChanged){
    const row=el.querySelector('.bs-game-row'),window=el.querySelector('.bs-game-window');
    row.animate([{transform:'translateY(-100%)'},{transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.4,0,.2,1)'});
    if(deck){const leaving=row.querySelector('.is-leaving'),active=row.querySelector('.is-active');if(leaving)leaving.animate([{transform:'translateY(0)',opacity:1},{transform:'translateY(110%)',opacity:0}],{delay:1400,duration:420,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});if(leaving)leaving.animate([{flexGrow:1,paddingLeft:'12px',paddingRight:'12px',borderRightWidth:'3px'},{flexGrow:0,paddingLeft:'0px',paddingRight:'0px',borderRightWidth:'0px'}],{delay:1820,duration:420,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});if(active&&game._leavingLeague)active.animate([{transform:'translateY(-100%)',opacity:0},{transform:'translateY(0)',opacity:1}],{delay:1820,duration:420,easing:'cubic-bezier(.4,0,.2,1)',fill:'backwards'});}
    if(oldRow){oldRow.classList.add('bs-row-old');window.append(oldRow);oldRow.animate([{transform:oldRow.style.transform||'translateY(0)'},{transform:'translateY(100%)'}],{duration:420,easing:'cubic-bezier(.4,0,.2,1)'}).onfinish=()=>oldRow.remove();}
    const possession=row.querySelector('.bs-possession');if(possession)possession.animate([{opacity:0},{opacity:1}],{duration:220,delay:450,fill:'backwards'});
   }else{
    for(const side of ['away','home']){
     const old=previous[side],next=String(game[side].score);
     if(old!==next&&/^\d+$/.test(old)&&/^\d+$/.test(next)){
      const window=el.querySelector(`[data-score-side="${side}"] .bs-score-window`);if(!window)continue;const value=window.firstElementChild,leaving=document.createElement('span');
      leaving.className='bs-score-old';leaving.textContent=old;window.append(leaving);
      value.animate([{transform:'translateY(110%)'},{transform:'translateY(0)'}],{duration:320,easing:'cubic-bezier(.2,.7,.3,1)'});
      leaving.animate([{transform:'translateY(0)'},{transform:'translateY(-110%)'}],{duration:320,easing:'cubic-bezier(.2,.7,.3,1)'}).onfinish=()=>leaving.remove();
     }
    }
    if(previous.detail!==detail){
     const status=el.querySelector('.bs-status');
     if(status){status.animate([{transform:'translateY(-100%)'},{transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.4,0,.2,1)'});
      if(oldStatus){oldStatus.classList.add('bs-status-old228');oldStatus.style.width=status.offsetWidth+'px';el.querySelector('.bs-game-window').append(oldStatus);oldStatus.animate([{transform:oldStatus.style.transform||'translateY(0)'},{transform:'translateY(100%)'}],{duration:420,easing:'cubic-bezier(.4,0,.2,1)'}).onfinish=()=>oldStatus.remove();}
     }
    }
   }
  }
  el._game={id:game.id,league:game.league,away:String(game.away.score),home:String(game.home.score),detail,playerDetail};
  const text=el.querySelector('.bs-game-row:not(.bs-row-old) .bs-detail-text228'),window=text?.parentElement;
  if(text&&window&&(cardChanged||previous.detail!==detail)){const overflow=text.scrollWidth-window.clientWidth;
   if(overflow>2){window.classList.add('has-overflow');
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){const duration=Math.max(3000,(frame.remaining||frame.hold||15000)-1300);el._scroll=text.animate([{transform:'translateX(0)',offset:0},{transform:'translateX(0)',offset:.15},{transform:`translateX(-${overflow}px)`,offset:.85},{transform:`translateX(-${overflow}px)`,offset:1}],{delay:500,duration,easing:'linear',fill:'forwards'});}
   }
  }
 }
 fitScoreTeamNames234(el);
 if(el._scroll){if(cfg.holdAt)el._scroll.pause();else if(el._scroll.playState==='paused')el._scroll.play();}
}
export function renderBottomScores(root,state){if(root.classList.contains('broadcast-content209'))root=root.parentElement;let session=sessions.get(root);if(!session){session={state};sessions.set(root,session);session.timer=setInterval(()=>{if(!root.isConnected){clearInterval(session.timer);sessions.delete(root);return;}draw(root,session.state);},500);}session.state=state;draw(root,state);}
