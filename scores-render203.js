const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sessions=new WeakMap();
function orderedGames(games,league){
 if(league!=='ALL')return games.filter(g=>g.league===(league||'NFL'));
 const groups=['NFL','MLB','NBA','MLS'].map(l=>games.filter(g=>g.league===l)),out=[];
 for(let i=0;i<Math.max(0,...groups.map(g=>g.length));i++)for(const group of groups)if(group[i])out.push(group[i]);
 return out;
}

function draw(root,s){const cfg=s.bottomScores||{};let el=root.querySelector('.bottom-scores203');if(!cfg.visible){if(el&&!el._exit){el._exit=el.animate([{opacity:1},{opacity:0}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:180,fill:'both'});el._exit.onfinish=()=>el.remove();}return;}if(el?._exit){el._exit.cancel();el._exit=null;}if(!el){el=document.createElement('aside');el.className='bottom-scores203';root.append(el);}
 const games=orderedGames(cfg.games||[],cfg.league);const n=Math.max(0,Math.floor(((cfg.holdAt||Date.now())-(cfg.anchor||0))/10000));const game=games.find(g=>g.id===cfg.gameId)||games[n%games.length];
 if(!game){const html=`<b class="bs-league">${esc(cfg.league||'NFL')}</b><span class="bs-empty">${esc(cfg.error?'Score feed unavailable':cfg.updatedAt?'No games available for this date':'Loading scores…')}</span>`;if(el._markup!==html){el.innerHTML=html;el._markup=html;}el._game=null;return;}
 const stale=Date.now()-Number(game.updatedAt||cfg.updatedAt)>90000;
 const team=t=>`<div class="bs-team"><img src="${esc(/^https:\/\//.test(t.logo)?t.logo:'data:,')}" alt=""><strong>${esc(t.name||t.abbr)}</strong><small>${esc(t.record)}</small><b class="${!stale&&game.possession===t.id?'bs-possession':''}"><span class="bs-score-window"><span class="bs-score-value">${esc(t.score)}</span></span></b></div>`;
 let detail=game.status;if(game.state==='pre'&&game.start&&!/postpon|cancel|delay|suspend|TBD/i.test(game.status)){const d=new Date(game.start);if(!isNaN(d))detail=d.toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' ET';}
 const details=[detail];
 if(game.state==='in'){if(game.ball)details.push(`BALL ON  |  ${game.ball}`);if(game.down)details.push(game.down);}
 if(game.detail)details.push(...game.detail.split('\n').filter(Boolean));
 if(!stale)detail=details[Math.floor((((cfg.holdAt||Date.now())-(cfg.anchor||0))%10000)/2500)%details.length];
 if(stale)detail='UPDATES DELAYED';
 const html=`<b class="bs-league">${esc(game.league)}</b><div class="bs-game-window"><div class="bs-game-row">${team(game.away)}${team(game.home)}<div class="bs-status">${esc(detail).replace(/  \|  /g,'<i></i>')}</div></div></div>`;
 if(el._markup!==html){
  const previous=el._game,oldRow=el.querySelector('.bs-game-row')?.cloneNode(true),images=new Map([...el.querySelectorAll('img')].map(img=>[img.src,img]));el._markup=html;el.innerHTML=html;for(const img of el.querySelectorAll('img')){const loaded=images.get(img.src);if(loaded?.complete&&loaded.naturalWidth)img.replaceWith(loaded);}
  for(const img of el.querySelectorAll('img'))img.onerror=()=>{img.style.visibility='hidden';};
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
   if(!previous||previous.id!==game.id){
    const row=el.querySelector('.bs-game-row'),window=el.querySelector('.bs-game-window');
    row.animate([{transform:'translateY(-100%)'},{transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.4,0,.2,1)'});
    if(oldRow){oldRow.classList.add('bs-row-old');window.append(oldRow);oldRow.animate([{transform:'translateY(0)'},{transform:'translateY(100%)'}],{duration:420,easing:'cubic-bezier(.4,0,.2,1)'}).onfinish=()=>oldRow.remove();}
    const possession=row.querySelector('.bs-possession');if(possession)possession.animate([{opacity:0},{opacity:1}],{duration:220,delay:450,fill:'backwards'});
   }else{
    for(const [i,side] of ['away','home'].entries()){
     const old=previous[side],next=String(game[side].score);
     if(old!==next&&/^\d+$/.test(old)&&/^\d+$/.test(next)){
      const window=el.querySelectorAll('.bs-score-window')[i],value=window.firstElementChild,leaving=document.createElement('span');
      leaving.className='bs-score-old';leaving.textContent=old;window.append(leaving);
      value.animate([{transform:'translateY(110%)'},{transform:'translateY(0)'}],{duration:320,easing:'cubic-bezier(.2,.7,.3,1)'});
      leaving.animate([{transform:'translateY(0)'},{transform:'translateY(-110%)'}],{duration:320,easing:'cubic-bezier(.2,.7,.3,1)'}).onfinish=()=>leaving.remove();
     }
    }
    if(previous.detail!==detail)el.querySelector('.bs-status').animate([{transform:'translateY(-100%)'},{transform:'translateY(0)'}],{duration:180,easing:'ease-out'});
   }
  }
  el._game={id:game.id,away:String(game.away.score),home:String(game.home.score),detail};
 }
}
export function renderBottomScores(root,state){let session=sessions.get(root);if(!session){session={state};sessions.set(root,session);session.timer=setInterval(()=>{if(!root.isConnected){clearInterval(session.timer);sessions.delete(root);return;}draw(root,session.state);},500);}session.state=state;draw(root,state);}
