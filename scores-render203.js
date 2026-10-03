const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sessions=new WeakMap();
function draw(root,s){const cfg=s.bottomScores||{};let el=root.querySelector('.bottom-scores203');if(!cfg.visible){el?.remove();return;}if(!el){el=document.createElement('aside');el.className='bottom-scores203';root.append(el);}
 const games=(cfg.games||[]).filter(g=>cfg.league==='ALL'||g.league===(cfg.league||'NFL'));const n=Math.max(0,Math.floor(((cfg.holdAt||Date.now())-(cfg.anchor||0))/10000));const game=games.find(g=>g.id===cfg.gameId)||games[n%games.length];
 if(!game){const html=`<b class="bs-league">${esc(cfg.league||'NFL')}</b><span class="bs-empty">${esc(cfg.error?'Score feed unavailable':cfg.updatedAt?'No games available for this date':'Loading scores…')}</span>`;if(el._markup!==html){el.innerHTML=html;el._markup=html;}el._game=null;return;}
 const stale=Date.now()-Number(game.updatedAt||cfg.updatedAt)>90000;
 const team=t=>`<div class="bs-team"><img src="${esc(/^https:\/\//.test(t.logo)?t.logo:'data:,')}" alt=""><strong>${esc(t.name||t.abbr)}</strong><small>${esc(t.record)}</small><b class="${!stale&&game.possession===t.id?'bs-possession':''}"><span class="bs-score-window"><span class="bs-score-value">${esc(t.score)}</span></span></b></div>`;
 let detail=game.status;if(game.state==='pre'&&game.start&&!/postpon|cancel|delay|suspend|TBD/i.test(game.status)){const d=new Date(game.start);if(!isNaN(d))detail=d.toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' ET';}
 if(!stale&&game.state==='in'&&Math.floor(((cfg.holdAt||Date.now())-(cfg.anchor||0))/5000)%2)detail=game.ball?`BALL ON ${game.ball}${game.down?' · '+game.down:''}`:game.down||game.detail||detail;
 if(stale)detail='UPDATES DELAYED';
 const html=`<b class="bs-league">${esc(game.league)}</b>${team(game.away)}${team(game.home)}<div class="bs-status">${esc(detail)}</div>`;
 if(el._markup!==html){
  const previous=el._game;el._markup=html;el.innerHTML=html;
  for(const img of el.querySelectorAll('img'))img.onerror=()=>{img.style.visibility='hidden';};
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
   if(!previous||previous.id!==game.id){
    for(const part of el.querySelectorAll('.bs-team,.bs-status'))part.animate([{opacity:0,clipPath:'inset(0 100% 0 0)',transform:'translateY(5px)'},{opacity:1,clipPath:'inset(0)',transform:'translateY(0)'}],{duration:260,easing:'cubic-bezier(.2,.7,.3,1)'});
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
    if(previous.detail!==detail)el.querySelector('.bs-status').animate([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out'});
   }
  }
  el._game={id:game.id,away:String(game.away.score),home:String(game.home.score),detail};
 }
}
export function renderBottomScores(root,state){let session=sessions.get(root);if(!session){session={state};sessions.set(root,session);session.timer=setInterval(()=>{if(!root.isConnected){clearInterval(session.timer);sessions.delete(root);return;}draw(root,session.state);},500);}session.state=state;draw(root,state);}
