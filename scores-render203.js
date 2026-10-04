import{titleLabels,leagueNetwork}from'./scores-titles219.js';
import{buildScorePlan,selectedScoreLeagues}from'./scores-sequence224.js';
import{feedGame,renderFeedBug}from'./scores-bug224.js';
const sheet224=document.createElement('link');sheet224.rel='stylesheet';sheet224.href=new URL('./scores224.css?v=224',import.meta.url).href;document.head.append(sheet224);
import{tickerFrame,gameDetails}from'./scores-timing209.js?v=league215';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sessions=new WeakMap();
function scoreFrame(session,cfg){
 const selected=selectedScoreLeagues(cfg),games=(cfg.games||[]).filter(g=>selected.includes(g.league));
 const elapsed=Math.max(0,(cfg.holdAt||Date.now())-(cfg.anchor||0));
 const key=JSON.stringify([selected,cfg.gameId,!!cfg.playerStats,cfg.titlesEnabled!==false,cfg.anchor,games.map(g=>g.id)]);
 if(!session.rotation||session.rotation.key!==key||elapsed<session.rotation.start||elapsed>=session.rotation.end){
  const plan=buildScorePlan(games,cfg).map(g=>g._titleCard?g:{...g,_tickerDetails:gameDetails(g,cfg.playerStats)});
  const duration=Math.max(1,plan.reduce((n,g)=>n+(tickerFrame([g],0,null,cfg.playerStats)?.duration||30000),0));
  const start=Math.floor(elapsed/duration)*duration;
  session.rotation={key,start,end:start+duration,plan};
 }
 const frame=tickerFrame(session.rotation.plan,elapsed-session.rotation.start,cfg.gameId,cfg.playerStats);
 const game=games.find(g=>g.id===frame?.game.id)||frame?.game;
 if(frame&&game&&!game._titleCard){const current=gameDetails(game,cfg.playerStats);frame.detail=current[frame.slot]||frame.detail;}
 return{games,frame,game};
}
function draw(root,s){
 const cfg=s.bottomScores||{},session=sessions.get(root),{games,frame,game}=scoreFrame(session,cfg);
 renderFeedBug(root,cfg,feedGame(games,cfg,frame));
 let el=root.querySelector('.bottom-scores203');
 if(!cfg.visible){if(el&&!el._exit){el._exit=el.animate([{opacity:1},{opacity:0}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:180,fill:'both'});el._exit.onfinish=()=>el.remove();}return;}
 if(el?._exit){el._exit.cancel();el._exit=null;}
 if(!el){el=document.createElement('aside');el.className='bottom-scores203';root.append(el);}
 if(!game){const html=`<b class="bs-league">${esc(cfg.league||'NFL')}</b><span class="bs-empty">${esc(cfg.error?'Score feed unavailable':cfg.updatedAt?'No games available for this date':'Loading scores…')}</span>`;if(el._markup!==html){el.innerHTML=html;el._markup=html;}el._game=null;return;}

 const final=game.state==='post'&&!/postpon|cancel|suspend|abandon|delay/i.test(game.status);
 const stale=!final&&Date.now()-Number(game.updatedAt||cfg.updatedAt)>90000;
 const winner=final&&game.away.score!==''&&game.home.score!==''&&Number(game.away.score)!==Number(game.home.score)?(Number(game.away.score)>Number(game.home.score)?game.away.id:game.home.id):null;
 const team=t=>`<div class="bs-team ${winner===t.id?'bs-winner':''}"><img src="${esc(/^https:\/\//.test(t.logo)?t.logo:'data:,')}" alt=""><strong>${esc(t.name||t.abbr)}</strong><small>${esc(t.record)}</small><b class="${!stale&&game.possession===t.id?'bs-possession':''}"><span class="bs-score-window"><span class="bs-score-value">${esc(t.score)}</span></span></b></div>`;
 let detail=final?(frame.slot===0?'FINAL':`FINAL  |  ${frame.detail}`):frame.detail;
 if(stale)detail='UPDATES DELAYED';
 const playerDetail=cfg.playerStats&&(game.players||[]).some(r=>detail.includes(r.name)&&detail.includes(r.text));
 const title=game._titleCard,labels=titleLabels(cfg,game.league,s.branding);
 const deck=title&&game._leagueDeck;
 const deckHtml=deck?`<b class="bs-league">${esc(game._activeLeague||game.league)}</b><div class="bs-game-window"><div class="bs-game-row bs-deck224">${game._leagueDeck.map(l=>`<div class="bs-deck224-card ${l===game._activeLeague?'is-active':''} ${game._completedLeagues.includes(l)?'is-completed':''} ${l===game._leavingLeague?'is-leaving':''}" data-league="${esc(l)}"><b>${esc(l)}</b><small>${esc(titleLabels(cfg,l,s.branding).join(' · '))}</small></div>`).join('')}</div>${game._emptyLeague?`<span class="bs-deck224-empty">${esc(game._activeLeague)} · ${esc(cfg.error?'Feed unavailable':cfg.updatedAt?game._emptyMessage:'Loading scores…')}</span>`:''}</div>`:'';
 const html=deck?deckHtml:title?`<b class="bs-league">${esc(game.league)}</b><div class="bs-game-window"><div class="bs-game-row bs-title212" style="--title-font:${labels.length>4?20:25}px;grid-template-columns:repeat(${Math.max(1,labels.length)},minmax(0,1fr))">${labels.map(label=>`<span>${esc(label)}</span>`).join('')}</div></div>`:`<b class="bs-league">${esc(game.league)}</b><div class="bs-game-window"><div class="bs-game-row ${playerDetail?'bs-player-detail':''}">${playerDetail?'':team(game.away)+team(game.home)}<div class="bs-status"><span>${esc(detail).replace(/  \|  /g,'<i></i>')}</span></div></div></div>`;
 if(el._markup!==html){
  const previous=el._game,oldRow=el.querySelector('.bs-game-row')?.cloneNode(true),images=new Map([...el.querySelectorAll('img')].map(img=>[img.src,img]));el._markup=html;el.innerHTML=html;for(const img of el.querySelectorAll('img')){const loaded=images.get(img.src);if(loaded?.complete&&loaded.naturalWidth)img.replaceWith(loaded);}
  for(const img of el.querySelectorAll('img'))img.onerror=()=>{img.style.visibility='hidden';};
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
   if(!previous||previous.id!==game.id){
    const row=el.querySelector('.bs-game-row'),window=el.querySelector('.bs-game-window');
    row.animate([{transform:'translateY(-100%)'},{transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.4,0,.2,1)'});
    if(deck){const leaving=row.querySelector('.is-leaving'),active=row.querySelector('.is-active');if(leaving)leaving.animate([{transform:'translateY(0)',opacity:1},{transform:'translateY(110%)',opacity:0}],{delay:1400,duration:420,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});if(leaving)leaving.animate([{flexGrow:1,paddingLeft:'12px',paddingRight:'12px',borderRightWidth:'3px'},{flexGrow:0,paddingLeft:'0px',paddingRight:'0px',borderRightWidth:'0px'}],{delay:1820,duration:420,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});if(active&&game._leavingLeague)active.animate([{transform:'translateY(-100%)',opacity:0},{transform:'translateY(0)',opacity:1}],{delay:1820,duration:420,easing:'cubic-bezier(.4,0,.2,1)',fill:'backwards'});}
    if(oldRow){oldRow.classList.add('bs-row-old');window.append(oldRow);oldRow.animate([{transform:'translateY(0)'},{transform:'translateY(100%)'}],{duration:420,easing:'cubic-bezier(.4,0,.2,1)'}).onfinish=()=>oldRow.remove();}
    const possession=row.querySelector('.bs-possession');if(possession)possession.animate([{opacity:0},{opacity:1}],{duration:220,delay:450,fill:'backwards'});
   }else{
    for(const [i,side] of ['away','home'].entries()){
     const old=previous[side],next=String(game[side].score);
     if(old!==next&&/^\d+$/.test(old)&&/^\d+$/.test(next)){
      const window=el.querySelectorAll('.bs-score-window')[i];if(!window)continue;const value=window.firstElementChild,leaving=document.createElement('span');
      leaving.className='bs-score-old';leaving.textContent=old;window.append(leaving);
      value.animate([{transform:'translateY(110%)'},{transform:'translateY(0)'}],{duration:320,easing:'cubic-bezier(.2,.7,.3,1)'});
      leaving.animate([{transform:'translateY(0)'},{transform:'translateY(-110%)'}],{duration:320,easing:'cubic-bezier(.2,.7,.3,1)'}).onfinish=()=>leaving.remove();
     }
    }
    if(previous.detail!==detail)el.querySelector('.bs-status')?.animate([{transform:'translateY(-100%)'},{transform:'translateY(0)'}],{duration:180,easing:'ease-out'});
   }
  }
  el._game={id:game.id,away:String(game.away.score),home:String(game.home.score),detail};
 }
}
export function renderBottomScores(root,state){if(root.classList.contains('broadcast-content209'))root=root.parentElement;let session=sessions.get(root);if(!session){session={state};sessions.set(root,session);session.timer=setInterval(()=>{if(!root.isConnected){clearInterval(session.timer);sessions.delete(root);return;}draw(root,session.state);},500);}session.state=state;draw(root,state);}
