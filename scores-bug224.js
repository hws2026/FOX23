const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function feedGame(games,cfg,frame){
 if(cfg.feedBugGameId)return games.find(g=>g.id===cfg.feedBugGameId)||null;
 if(frame?.game&&!frame.game._titleCard)return games.find(g=>g.id===frame.game.id)||null;
 const league=frame?.game?._activeLeague;
 return games.find(g=>!league||g.league===league)||null;
}
export function feedBugMarkup(game,cfg,now=Date.now()){
 if(!game)return '<div class="fbu224-empty">FEED SCOREBUG · Waiting for selected game</div>';
 const final=game.state==='post'&&!/postpon|cancel|suspend|abandon|delay/i.test(game.status||''),live=game.state==='in';
 const stale=live&&now-Number(game.updatedAt||cfg.updatedAt||0)>90000;
 const winner=final&&game.away.score!==''&&game.home.score!==''&&Number(game.away.score)!==Number(game.home.score)?(Number(game.away.score)>Number(game.home.score)?'away':'home'):'';
 const team=(side)=>{const t=game[side],logo=/^(https:\/\/|data:image\/(?:png|jpeg|webp);base64,)/.test(t.logo||'')?t.logo:'';return `<div class="fbu224-team ${winner===side?'fbu224-winner':''}">${logo?`<img src="${esc(logo)}" alt="">`:'<span class="fbu224-logo-placeholder"></span>'}<div class="fbu224-name"><strong>${esc(t.abbr||t.name)}</strong>${t.record?`<small>${esc(t.record)}</small>`:''}</div><b class="fbu224-score" data-side="${side}"><span>${esc(t.score===''?'—':t.score)}</span></b>${live&&!stale&&game.possession===t.id?'<span class="fbu224-possession" aria-label="Possession">◆</span>':''}</div>`;};
 // Feed clocks are reported values. Do not invent a running clock between API updates.
 const period=game.quarter||(game.period?( ['NFL','NCAAF','NBA'].includes(game.league)?'Q'+game.period:'PERIOD '+game.period):'');
 let status=stale?'UPDATES DELAYED':final?'FINAL':live&&game.clock&&period?period+' · '+game.clock:game.status||'SCHEDULED';
 // Preserve overtime/halftime descriptors supplied by the league.
 if(live&&!stale&&/half|end|OT|overtime/i.test(game.status||''))status=game.status;
 const facts=live&&!stale?[game.down,game.ball?'BALL ON '+game.ball:''].filter(Boolean).join(' · '):'';
 return `<div class="fbu224-header"><b>${esc(game.league)}</b><span>${esc(status)}</span></div><div class="fbu224-teams">${team('away')}${team('home')}</div>${facts?`<div class="fbu224-facts">${esc(facts)}</div>`:''}`;
}
export function renderFeedBug(root,cfg,game){
 let el=root.querySelector('.feed-scorebug224');
 if(!cfg.feedBugVisible){el?.remove();return;}
 if(!el){el=document.createElement('aside');el.className='feed-scorebug224';root.append(el);}
 const html=feedBugMarkup(game,cfg);if(html===el._html)return;
 const old=el._game;el._html=html;el.innerHTML=html;
 for(const img of el.querySelectorAll('img'))img.onerror=()=>{img.style.visibility='hidden';};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!reduced&&game&&old?.id===game.id)for(const side of ['away','home']){
  const next=String(game[side].score),prev=old[side];if(next===prev||!/^\d+$/.test(next)||!/^\d+$/.test(prev))continue;
  const slot=el.querySelector('[data-side="'+side+'"]'),value=slot.firstElementChild,leaving=document.createElement('span');leaving.className='fbu224-old';leaving.textContent=prev;slot.append(leaving);
  value.animate([{transform:'translateY(110%)'},{transform:'translateY(0)'}],{duration:320,easing:'ease-out'});
  leaving.animate([{transform:'translateY(0)'},{transform:'translateY(-110%)'}],{duration:320,easing:'ease-out'}).onfinish=()=>leaving.remove();
 }
 el._game=game?{id:game.id,away:String(game.away.score),home:String(game.home.score)}:null;
}
