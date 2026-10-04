// Exact duplicate of the approved main scorebug markup and motion helpers.
// Feed data is adapted separately; the original renderer is not modified.
const scorebugExitFrames211=Array.from({length:51},(_,i)=>{const img=new Image();img.src=new URL('./assets/scorebug-out219/'+String(i).padStart(2,'0')+'.svg',import.meta.url).href;return img;});
export function gameStatusText(g){if(['FINAL','FINAL/OT'].includes(g.bottomStatus))return g.quarter==='OT'?'FINAL/OT'+(Number(g.overtimePeriod)>1?g.overtimePeriod:''):'FINAL';return g.bottomStatus&&g.bottomStatus!=='LIVE'?g.bottomStatus:'';}
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function clockSeconds(c,now=Date.now()/1000){return Math.max(0,Math.ceil(c.remaining-(c.running?now-c.anchor:0)));}
export function clockText(c,now){const sec=clockSeconds(c,now);return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;}
function teamStyle(t){return `--team:${esc(t.color)};--secondary:${esc(t.secondary)}`;}
function logo(t){return t.logo?`<img class="team-logo" src="${esc(t.logo)}" alt="${esc(t.name)}">`:`<span class="team-monogram">${esc(t.abbr)}</span>`;}
function bars(n){return `<div class="timeout-bars" aria-label="${n} timeouts remaining">${[0,1,2].map(i=>`<i class="${i<n?'available':''}"></i>`).join('')}</div>`;}
function teamWing(t,side,g){return `<div class="team-wing ${side}" style="${teamStyle(t)}"><span class="record">${esc(t.record)}</span><div class="bug-logo-crop">${logo(t)}</div>${bars(g.timeouts[side])}</div>`;}
// Reference scorebug occupies about 35.5% of the 1920px field frame.
function bugRenderScale(s){return .74*(Number(s.branding.bugScale)||1);}
function scorebug(s){const g=s.game,b=s.branding,penalty=s.program.graphic.type==='event'&&s.program.graphic.event==='FLAG'&&s.program.graphic.flagVariant!=='generic'?s.program.graphic.team:'';return `<div class="bug-wrap ${penalty?'penalty-'+penalty:''} ${g.showInfo===false?'info-hidden':''}" style="bottom:${b.bugBottom}px;--bug-scale:${bugRenderScale(s)}"><div class="flag-tab ${g.flag?'on':''}"><svg class="flag-face" viewBox="0 0 420 70" aria-hidden="true"><path fill="#101317" d="M55 0H365L420 70H0Z"/><path fill="#ffdc16" d="M148 0H272L326 70H94Z"/><path class="flag-stripes" fill="#ffdc16" d="M112 0H132L78 70H58Z M288 0H308L362 70H342Z"/><path fill="#d6dee1" d="M55 0H365L368 3H52Z"/></svg><svg class="flag-rim-outline" viewBox="0 0 420 70" aria-hidden="true"><path d="M55 1H365L419 69H1Z"/></svg><span class="flag-label">FLAG</span><span class="flag-outline" aria-hidden="true">FLAG</span></div><div class="scorebug"><div class="bug-top-rail-reveal" aria-hidden="true"><img src="./scorebug-top-rails.svg?v=20260923-controls105" alt=""></div><div class="bug-intro-mask" aria-hidden="true"><svg viewBox="0 0 920 200" preserveAspectRatio="none"><defs><linearGradient id="helmet-metal" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#adb2b5"/><stop offset=".22" stop-color="#45494c"/><stop offset=".64" stop-color="#17191b"/><stop offset="1" stop-color="#777b80"/></linearGradient></defs><path fill="#020304" d="M0 0H920V200H0Z"/><g fill="url(#helmet-metal)" stroke="#555b60" stroke-width="3"><path d="M30 0H165L209 200H137L94 123L69 16L83 160L114 200H55L26 74Z"/><path d="M890 0H755L711 200H783L826 123L851 16L837 160L806 200H865L894 74Z"/><path d="M220 0H700L657 101Q623 161 569 174L548 200H372L351 174Q297 161 263 101Z"/></g><path fill="#030405" d="M251 0H669L649 73Q578 108 460 103Q342 108 271 73Z"/><path fill="#e2e6e7" stroke="#777e82" stroke-width="3" d="M278 56L348 78L424 85L460 99L496 85L572 78L642 56L617 88L562 108L489 108L460 114L431 108L358 108L303 88Z"/><path fill="#050607" d="M302 111Q368 130 426 124L460 131L494 124Q552 130 618 111L594 151Q547 176 498 167L483 153H437L422 167Q373 176 326 151Z"/><path fill="#8c9397" d="M396 182L426 174H494L524 182L542 200H378Z"/><g fill="none" stroke="#c4c9cc" stroke-width="6"><path d="M193 0L228 133L269 200M727 0L692 133L651 200"/></g></svg></div><div class="bug-electric" aria-hidden="true"><svg viewBox="0 0 100 220" preserveAspectRatio="none"><g class="arc arc-a"><path d="M52 0L37 19L53 27L24 50L42 61L31 78L65 100L43 122L54 146L26 162L47 183L34 202L53 220 M65 100L87 87L100 110"/></g><g class="arc arc-b"><path d="M31 0L50 22L30 42L61 57L42 74L55 90L29 109L62 129L44 151L70 173L42 197L49 220 M61 57L83 43L98 65 M29 109L6 102L0 129 M70 173L89 181L99 169"/></g><g class="arc arc-c"><path d="M65 0L43 14L57 33L35 48L56 68L27 85L49 112L35 135L63 148L41 174L53 196L29 220 M27 85L9 67L0 79 M63 148L87 135L100 155"/></g></svg></div><div class="bug-metal"><span class="bug-possession-rail ${g.possession==='home'?'home':''} ${g.possession==='none'?'off':''}" aria-hidden="true"></span><img class="bug-frame-rails" src="./scorebug-rails.svg?v=20260923-controls105" alt="" aria-hidden="true"><div class="bug-body" style="--away-color:${esc(s.teams.away.color)};--home-color:${esc(s.teams.home.color)}">${teamWing(s.teams.away,'away',g)}<div class="score-center" style="--away-color:${esc(s.teams.away.color)};--home-color:${esc(s.teams.home.color)}"><span class="possession-cap ${g.possession==='home'?'cap-home':''} ${g.possession==='none'?'cap-hidden':''}" role="img" aria-label="${esc(g.possession==='none'?'No possession':s.teams[g.possession]?.name+' possession')}" aria-hidden="${g.possession==='none'}"></span><div class="score-row">${['away','home'].map(side=>`<b data-score-side="${side}" data-score-value="${g.scores[side]}"><span class="score-value">${g.scores[side]}</span></b>`).join('')}</div><div style="--status-width:${Math.min(470,Math.max(240,gameStatusText(g).length*23+48))}px" class="information ${g.showDownDistance===false?'down-hidden':''} ${g.bottomStatus&&g.bottomStatus!=='LIVE'?'status-mode':''}"><span>${esc(g.quarter==='OT'?(Number(g.overtimePeriod)>1?'OT/'+g.overtimePeriod:'OT'):g.quarter)}</span><span data-game-clock>${clockText(g.clock)}</span><span class="play-clock ${clockSeconds(g.playClock)<=5?'urgent':''} ${g.showPlayClock?'':'play-hidden'}" data-play-clock>${clockSeconds(g.playClock)}</span><span class="down" style="${g.down.endsWith(' DOWN')?'':String(g.down+' & '+g.distance).length>10?'font-size:32px':String(g.down+' & '+g.distance).length>8?'font-size:38px':''}"><span class="down-current">${esc(g.down)}${(['PAT','KICK'].includes(g.down)||g.down.endsWith(' DOWN'))?'':` & ${esc(g.distance)}`}</span></span><span class="game-status">${esc(gameStatusText(g))}</span></div></div>${teamWing(s.teams.home,'home',g)}</div></div></div><div class="ball-marker ${g.showBallPosition?'':'ball-hidden'}">BALL ON ${esc(g.ballOn)}</div></div>`;}
function animateScorebugOut(bug,motion){
 clearTimeout(bug._motionTimer);
 const surface=bug.querySelector('.scorebug');
 const currentOpacity=getComputedStyle(bug).opacity,currentTransform=getComputedStyle(surface).transform;
 bug.getAnimations({subtree:true}).forEach(a=>a.cancel());
 bug.dataset.motion=motion;bug.classList.remove('bug-enter','bug-return');bug.classList.add('bug-exit','managed-exit');
 const fade=motion==='fade',reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(fade||reduced){
  bug._exitPose=surface.animate([{transform:currentTransform},{transform:currentTransform}],{duration:160,fill:'both'});
  bug._exitMotion=bug.animate([{opacity:currentOpacity},{opacity:0}],{duration:reduced?0:160,easing:'linear',fill:'both'});
 }else{
  // Sampled exit artwork stays registered to the face; no tiled scatter or squash.
  const cover=document.createElement('img');cover.className='bug-exit-cover';cover.alt='';
  cover.style.cssText='position:absolute;left:0;top:-15%;width:100%;height:135%;z-index:30;pointer-events:none';
  cover.src=scorebugExitFrames211[0].src;surface.append(cover);
  // High-resolution individual viewports avoid magnifying a tiny decoded SVG surface.
  const started=performance.now();let previous=-1;
  const drawFrame=now=>{if(!cover.isConnected||!bug.classList.contains('bug-exit'))return;const frame=Math.min(50,Math.floor((now-started)/1667*50));if(frame!==previous){cover.src=scorebugExitFrames211[frame].src;previous=frame;}if(frame<50)requestAnimationFrame(drawFrame);};requestAnimationFrame(drawFrame);
  // The electrical cover replaces the score first; the reference then clears its own silhouette.
  for(const part of surface.querySelectorAll('.bug-metal,.bug-top-rail-reveal'))part.animate([{opacity:1,offset:0},{opacity:1,offset:.16},{opacity:0,offset:.32},{opacity:0,offset:1}],{duration:1667,fill:'both'});
  bug._exitMotion=surface.animate([{transform:currentTransform,opacity:1},{transform:currentTransform,opacity:1}],{duration:1667,fill:'both'});
 }
 bug._exitMotion.onfinish=()=>{if(bug.classList.contains('bug-exit'))bug.remove();};
}
function bugExitDuration(bug){return bug?.dataset.motion==='fade'||matchMedia('(prefers-reduced-motion: reduce)').matches?180:1690;}
function finishBugEntrance(bug){
 clearTimeout(bug._motionTimer);
 // Include queued entrance delays so returning from a lineup cannot cut off the wipe.
 const remaining=bug.getAnimations({subtree:true}).reduce((ms,a)=>{const end=Number(a.effect.getComputedTiming().endTime),now=Number(a.currentTime)||0;return Number.isFinite(end)?Math.max(ms,end-now):ms;},0);
 bug._motionTimer=setTimeout(()=>bug.classList.remove('bug-enter','bug-return'),Math.max(0,remaining)+34);
}
function animateScoreChange(cell,from,to){
 const bug=cell.closest('.bug-wrap'),side=cell.dataset.scoreSide;bug.querySelectorAll(':scope > .score-add.'+side).forEach(el=>{el.getAnimations().forEach(a=>a.cancel());el.remove();});
 cell.getAnimations({subtree:true}).forEach(a=>a.cancel());
 cell.querySelectorAll('.score-old,.score-add').forEach(el=>el.remove());
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const value=cell.querySelector('.score-value'),old=document.createElement('span');
 old.className='score-old';old.textContent=from;old.setAttribute('aria-hidden','true');cell.append(old);
 const options={duration:340,easing:'cubic-bezier(.22,.61,.36,1)',fill:'both'};
 old.animate([{translate:'0 0'},{translate:'0 -100%'}],options).finished.then(()=>old.remove()).catch(()=>old.remove());
 const motion=value.animate([{translate:'0 100%'},{translate:'0 0'}],options);
 motion.finished.then(()=>motion.cancel()).catch(()=>{});
 const delta=Number(to)-Number(from);
 if(delta>0){const pop=document.createElement('span');pop.className='score-add '+side;pop.textContent='+'+delta;pop.setAttribute('aria-hidden','true');const bounds=cell.getBoundingClientRect(),shell=bug.getBoundingClientRect();pop.style.left=((bounds.left+bounds.width/2-shell.left)*920/shell.width-55)+'px';bug.append(pop);
 const a=pop.animate([{opacity:0,translate:'0 18px'},{opacity:1,translate:'0 0',offset:.25},{opacity:1,translate:'0 -5px',offset:.65},{opacity:0,translate:'0 -12px'}],{duration:620,easing:'linear',fill:'both'});a.finished.then(()=>pop.remove()).catch(()=>pop.remove());}
}
function morph(node,next){
 if(node.nodeType!==next.nodeType||node.nodeName!==next.nodeName){node.replaceWith(next.cloneNode(true));return;}
 if(node.nodeType===Node.TEXT_NODE){if(node.textContent!==next.textContent)node.textContent=next.textContent;return;}
 if(node.nodeType!==Node.ELEMENT_NODE)return;
 for(const a of [...node.attributes])if(!next.hasAttribute(a.name))node.removeAttribute(a.name);
 for(const a of [...next.attributes])if(node.getAttribute(a.name)!==a.value)node.setAttribute(a.name,a.value);
 const old=[...node.childNodes],fresh=[...next.childNodes];
 for(let i=0;i<Math.max(old.length,fresh.length);i++){if(!fresh[i])old[i].remove();else if(!old[i])node.append(fresh[i].cloneNode(true));else morph(old[i],fresh[i]);}
}

export {scorebug,animateScorebugOut,finishBugEntrance,animateScoreChange,morph};
