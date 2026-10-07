// Feed-only update motion. Clock ticks and status refreshes never trigger it.
export function feedUpdateSnapshot(game,state){
 return {match:JSON.stringify([game.league,game.id]),teams:Object.fromEntries(['away','home'].map(side=>{
  const team=state.teams[side];
  return [side,JSON.stringify([game[side]?.id,team.name,team.abbr,team.logo,team.color,team.secondary])];
 })),scores:{...state.game.scores}};
}
export function feedUpdateTargets(previous,next){
 if(!previous||!next)return [];
 if(previous.match!==next.match)return ['matchup'];
 const targets=[];
 for(const side of ['away','home']){
  if(previous.teams[side]!==next.teams[side])targets.push(side+'-team');
  if(previous.scores[side]!==next.scores[side])targets.push(side+'-score');
 }
 return targets;
}

export const LIGHT_DURATION=560, LIGHT_COMMIT=224;
export function runFeedLightUpdate({begin,commit,finish,schedule=setTimeout,cancel=clearTimeout}){
 let stopped=false;
 const clean=begin();
 const midpoint=schedule(()=>{if(!stopped)commit();},LIGHT_COMMIT);
 const end=schedule(()=>{if(stopped)return;stopped=true;clean();finish();},LIGHT_DURATION);
 return {cancel(){if(stopped)return;stopped=true;cancel(midpoint);cancel(end);clean();}};
}

export const feedLightCSS=`
.feed-light231{position:absolute;pointer-events:none;overflow:hidden;z-index:90;isolation:isolate}
.feed-light231:before{content:'';position:absolute;inset:0;background:linear-gradient(100deg,#d4f4ff00,#daf6ff38,#fff9,#daf6ff38,#d4f4ff00);opacity:0;animation:feed-light-glow231 560ms ease-out both}
.feed-light231 i{position:absolute;left:0;top:-40%;width:40%;height:180%;background:linear-gradient(90deg,transparent,#82d8ff33 15%,#dbf8ffd9 42%,#fff 50%,#dbf8ffd9 58%,#82d8ff33 85%,transparent);filter:drop-shadow(0 0 9px #c7eeff);animation:feed-light-sweep231 560ms cubic-bezier(.3,0,.25,1) both}
@keyframes feed-light-sweep231{0%{transform:translateX(-160%) skewX(-18deg);opacity:0}14%{opacity:.9}80%{opacity:.9}100%{transform:translateX(420%) skewX(-18deg);opacity:0}}
@keyframes feed-light-glow231{0%,100%{opacity:0}40%{opacity:.75}65%{opacity:.12}}
@media(prefers-reduced-motion:reduce){.feed-light231{display:none}}
`;
export function beginFeedLights(surface,bug,targets){
 const bounds=surface.getBoundingClientRect(),scaleX=surface.offsetWidth/bounds.width,scaleY=surface.offsetHeight/bounds.height;
 if(!Number.isFinite(scaleX)||!Number.isFinite(scaleY))return ()=>{};
 const layers=targets.map(target=>{
  const [side,kind]=target.split('-');
  const part=bug.querySelector(target==='matchup'?'.bug-metal':kind==='team'?'.team-wing.'+side:'[data-score-side='+side+']');
  if(!part)return null;
  const rect=part.getBoundingClientRect(),layer=document.createElement('div');
  layer.className='feed-light231';layer.dataset.target=target;layer.setAttribute('aria-hidden','true');
  Object.assign(layer.style,{left:(rect.left-bounds.left)*scaleX+'px',top:(rect.top-bounds.top)*scaleY+'px',width:rect.width*scaleX+'px',height:rect.height*scaleY+'px',clipPath:getComputedStyle(part).clipPath});
  layer.append(document.createElement('i'));surface.append(layer);return layer;
 }).filter(Boolean);
 return ()=>layers.forEach(layer=>layer.remove());
}
