export function animationList234(root){
 const list=[...root.getAnimations({subtree:true})];
 for(const node of root.querySelectorAll('*'))if(node.shadowRoot)list.push(...animationList234(node.shadowRoot));
 return [...new Set(list)];
}
let frameSerial234=0;
export function freezeFrame234(stage){
 const frameId=++frameSerial234;
 const props=new Set(['opacity','transform','transform-origin','translate','rotate','scale','clip-path','filter','visibility','width','height','max-height','min-height','flex-grow','padding-left','padding-right','border-right-width','background-position','background-size','mask-position','mask-size','offset-distance']);
 const animated=new Map(),animations=animationList234(stage);
 const pauseStartedAt=performance.now();
 const animationSamples=animations.map(a=>({name:a.animationName||a.id||'WAAPI',time:Number(a.currentTime),duration:a.effect?.getComputedTiming().endTime,playState:a.playState}));
 for(const a of animations){
  try{a.pause();const target=a.effect?.target;if(target){const set=animated.get(target)||new Set();for(const frame of a.effect.getKeyframes())for(const key of Object.keys(frame))if(!['offset','computedOffset','easing','composite'].includes(key))set.add(key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()));animated.set(target,set);}}catch{}
 }
 const pausedAt=performance.now();
 let serial=0;
 function cloneTree(source,rules){
  const copy=source.cloneNode(false);if(source.nodeType!==1)return copy;
  const id='a234-'+frameId+'-'+(++serial);copy.setAttribute('data-audit233-freeze',id);
  const capture=(pseudo)=>{const cs=getComputedStyle(source,pseudo),set=new Set([...props,...(animated.get(source)||[])]);return [...set].map(name=>[name,cs.getPropertyValue(name)]).filter(([,value])=>value);};
  for(const [name,value]of capture(null))copy.style.setProperty(name,value,'important');
  copy.style.setProperty('animation','none','important');copy.style.setProperty('transition','none','important');
  for(const pseudo of ['::before','::after']){
   const cs=getComputedStyle(source,pseudo);if(cs.content==='none'||cs.content==='normal')continue;
   const values=capture(pseudo).map(([name,value])=>`${name}:${value}!important`).join(';');
   rules.push(`:is(#audit233-specificity,[data-audit233-freeze="${id}"])${pseudo}{${values};animation:none!important;transition:none!important}`);
  }
  for(const child of source.childNodes)copy.append(cloneTree(child,rules));
  if(source.shadowRoot){const shadowRules=[],shadow=copy.attachShadow({mode:'open'});for(const child of source.shadowRoot.childNodes)shadow.append(cloneTree(child,shadowRules));const style=document.createElement('style');style.textContent=shadowRules.join('\n');shadow.append(style);}
  return copy;
 }
 const rules=[],copy=cloneTree(stage,rules),style=document.createElement('style');style.textContent=rules.join('\n');copy.append(style);
 stage.replaceWith(copy);return {stage:copy,pauseStartedAt,pausedAt,finishedAt:performance.now(),animations:animationSamples};
}