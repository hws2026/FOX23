import {renderGraphics,updateClocks} from './graphics.js?v=update238';
import {caseState233} from './graphics-audit233-model.js?v=update238';
import {freezeFrame234} from './graphics-freeze234.js?v=update238';
const $=id=>document.getElementById(id),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const data=await fetch('./graphics-audit233-data.json?v=update238').then(r=>r.json());
const entry=data.cases.find(x=>x.id==='scorebug:default');
let busy=false,frames=[],checks=[];
function status(text,error=false){$('status').textContent=text;$('status').toggleAttribute('data-error',error);}
function lock(value){busy=value;for(const el of document.querySelectorAll('nav button,nav select'))el.disabled=value;}
function state(side='away',remaining=2,motion='auto'){
 const s=caseState233(data,entry,{logos:true,mainBug:true,motion});
 s.program.graphic={type:'none'};s.preview={type:'none'};s.game.timeouts={away:3,home:3};s.game.timeouts[side]=remaining;
 s.program.cueLibrary['event:'+side]={type:'event',team:side,transition:motion,outTransition:motion};
 Object.assign(s.teams.away,{color:'#163d68',secondary:'#b7cce5'});Object.assign(s.teams.home,{color:'#07524e',secondary:'#8ad3c5'});
 s.program.qbStats={visible:true,type:'qbstats',team:side,sideStatsLayout:'qb',qbComp:10,qbAtt:13,qbYards:120,qbTD:0,qbINT:0,transition:motion};delete s.program.timeoutNotice;return s;
}
function makeRoot(host){const stage=document.createElement('div');stage.className='stage';const root=document.createElement('div');root.style.cssText='position:absolute;inset:0';stage.append(root);host.append(stage);return {stage,root};}
function render(root,s){renderGraphics(root,s);updateClocks(root,s);}
function trigger(s,side,remaining,source,motion,until=Date.now()/1000+8.5){
 s.game.timeouts[side]=remaining;
 if(source!=='manual')s.program.timeoutNotice={team:side,remaining,until};
 if(source!=='auto'){s.program.graphic={type:'event',event:'TIMEOUT',team:side,timeoutNumber:0,subtitle:'',transition:motion,outTransition:motion};s.program.takeId++;}
}
function swap(s,side){const t=s.teams[side];[t.color,t.secondary]=[t.secondary,t.color];}
function details(root,s){
 const auto=[...root.querySelectorAll('.timeout-anchor')],manual=[...root.querySelectorAll('.timeout-alert234')];
 const pairs=[...auto,...manual].map(el=>({kind:el.classList.contains('timeout-anchor')?'automatic':'manual',side:el.classList.contains('dock-home')?'home':'away',out:!!el.closest('.leaving')||el.classList.contains('out'),label:el.querySelector('strong,h1')?.textContent,detail:el.querySelector('.timeout-tail234>span')?.textContent,primary:getComputedStyle(el).getPropertyValue('--team').trim(),accent:getComputedStyle(el).getPropertyValue('--secondary').trim(),tailWidth:el.querySelector('.timeout-tail234')?.getBoundingClientRect().width,tailTransform:getComputedStyle(el.querySelector('.timeout-tail234')).transform,tailOpacity:getComputedStyle(el.querySelector('.timeout-tail234')).opacity,bevel:getComputedStyle(el.querySelector('.timeout-tail234'),'::after').backgroundImage}));
 return {pairs,stats:!!root.querySelector('.qb-live-anchor:not(.qb-live-out)'),statBevel:root.querySelector('.side-stat-row')?getComputedStyle(root.querySelector('.side-stat-row'),'::after').backgroundImage:null,pips:Object.fromEntries(['away','home'].map(side=>[side,root.querySelectorAll('.team-wing.'+side+' .timeout-bars .available').length])),expectedTimeouts:{...s.game.timeouts},colors:Object.fromEntries(['away','home'].map(side=>[side,{primary:s.teams[side].color,accent:s.teams[side].secondary}])),scorebugVisible:!!root.querySelector('.bug-wrap:not(.bug-exit)'),brokenImages:[...root.querySelectorAll('img')].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)};
}
function fit(){for(const el of document.querySelectorAll('.frame')){const stage=el.querySelector('.stage');if(!stage)continue;const scale=el.clientWidth/1920;stage.style.setProperty('transform',`scale(${scale})`,'important');stage.style.setProperty('left','0px','important');stage.style.setProperty('top',`${-710*scale}px`,'important');}}
new ResizeObserver(fit).observe($('grid'));
function report(){ $('report').textContent=JSON.stringify({isolated:true,frames,checks,passed:checks.length?checks.every(x=>x.pass):null},null,2); }
function assert(name,condition,evidence){checks.push({name,pass:!!condition,evidence});if(!condition)throw Error(name);}
async function build(){
 if(busy)return;lock(true);frames=[];$('grid').replaceChildren();status('Preparing the scorebug, then sampling the reference timeout sequence…');
 const side=$('side').value,remaining=Number($('remaining').value),source=$('source').value,motion=$('motion').value;
 const specs=[['Before · player-stat panel',-1,false],['120 ms · upper tab rising',120,false],['1.65 s · remaining-count strip sliding out',1650,false],['2.1 s · both timeout panels displayed',2100,false],['2.4 s · colors swapped during the hold',2400,true],['3.1 s · remaining-count strip retracting',3100,true],['3.7 s · upper tab stays, side count hidden',3700,true],['8.58 s · upper tab leaving',8580,true],['9 s · player stats return, remaining pips retained',9000,true]];
 try{
  const jobs=specs.map(([title,ms,swapped])=>{const card=document.createElement('article');card.innerHTML='<h2></h2><div class="frame"></div><div class="label"></div>';card.querySelector('h2').textContent=title;$('grid').append(card);const {stage,root}=makeRoot(card.querySelector('.frame'));const s=state(side,Math.min(3,remaining+1),motion);render(root,s);return {card,stage,root,s,title,ms,swapped};});fit();
  await Promise.all(jobs.flatMap(j=>[...j.root.querySelectorAll('img')].map(i=>i.decode().catch(()=>{}))));await document.fonts.ready;await sleep(2100);
  await Promise.all(jobs.map(async j=>{
   if(j.ms>=0){trigger(j.s,side,remaining,source,motion);render(j.root,j.s);if(j.swapped){await sleep(2200);swap(j.s,side);render(j.root,j.s);}if(source!=='auto'&&j.ms>=8500){await sleep(8500-(j.swapped?2200:0));j.s.program.graphic={type:'none'};j.s.program.takeId++;render(j.root,j.s);await sleep(j.ms-8500);}else await sleep(j.ms-(j.swapped?2200:0));}
   const snapshot=details(j.root,j.s),capture=freezeFrame234(j.stage);j.stage=capture.stage;frames.push({title:j.title,side,remaining,source,motion,requestedMs:j.ms,...snapshot,animations:capture.animations});j.card.querySelector('.label').textContent=snapshot.pairs.map(p=>p.label+' · '+p.detail).join(' / ')||'No timeout overlay · away '+snapshot.pips.away+' / home '+snapshot.pips.home+' timeout pips';fit();
  }));report();status('Nine reference frames ready · upper-first entrance, side-strip reveal/retract, live color swap and stats returning.');
 }catch(e){status(e.message,true);report();}finally{lock(false);}
}
async function audit(){
 if(busy)return;lock(true);checks=[];status('Checking both teams, counts, manual/automatic ownership, color swaps, restore and re-entry…');
 const probe=$('probe');
 try{
  for(const side of ['away','home'])for(const motion of ['auto','fade'])for(const remaining of [0,1,2])for(const source of ['auto','manual','both']){
   const {stage,root}=makeRoot(probe),s=state(side,remaining,motion);render(root,s);trigger(s,side,remaining,source,motion);render(root,s);
   let d=details(root,s),p=d.pairs[0],id=[side,motion,remaining,source].join('/');
   assert(id+' one upper label and one matching side count',d.pairs.length===1&&p.side===side&&p.label===['3RD','2ND','1ST'][remaining]+' TIMEOUT'&&p.detail===(remaining===0?'NO TIMEOUTS REMAINING':remaining+' TIMEOUT'+(remaining===1?'':'S')+' REMAINING')&&d.pips[side]===remaining,d);
   const dock=root.querySelector('.timeout-anchor'),deadline=s.program.timeoutNotice?.until;swap(s,side);render(root,s);d=details(root,s);p=d.pairs[0];
   assert(id+' color swap updates active pair and wing without extending timeout',p.primary===s.teams[side].color&&p.accent===s.teams[side].secondary&&getComputedStyle(root.querySelector('.team-wing.'+side)).getPropertyValue('--team').trim()===s.teams[side].color&&s.program.timeoutNotice?.until===deadline&&(!dock||root.querySelector('.timeout-anchor')===dock),d);
   if(source!=='auto'){s.program.graphic={type:'none'};s.program.takeId++;render(root,s);assert(id+' manual Out does not resurrect automatic notice',!root.querySelector('.timeout-anchor'),details(root,s));}
   stage.remove();
  }
  for(const side of ['away','home']){
   const {stage,root}=makeRoot(probe),s=state(side,2);render(root,s);trigger(s,side,2,'auto','auto');render(root,s);
   s.program.bug=false;render(root,s);await sleep(60);s.program.bug=true;render(root,s);await sleep(400);
   assert(side+' return during exit keeps active timeout pair',root.querySelectorAll('.timeout-anchor:not(.out)').length===1,details(root,s));
   s.game.timeouts[side]=3;delete s.program.timeoutNotice;render(root,s);await sleep(400);
   assert(side+' restored timeout retires notice and restores pips',!root.querySelector('.timeout-anchor')&&details(root,s).pips[side]===3,details(root,s));stage.remove();
  }
  // Observe actual running CSS, including live updates without replaying the timeline.
  await Promise.all(['away','home'].flatMap(side=>['auto','manual'].map(async source=>{
   const {stage,root}=makeRoot(probe),s=state(side,2);render(root,s);await sleep(400);
   const stat=root.querySelector('.side-stat-row'),bevel=getComputedStyle(stat,'::after'),clip=getComputedStyle(stat).clipPath;
   assert(side+'/'+source+' player-stat outer bevel is mirrored and uses both colors',bevel.backgroundImage.includes('linear-gradient')&&Math.abs(parseFloat(bevel.width)-12)<.1&&clip.includes('12px'),{clip,bevel:bevel.backgroundImage});
   trigger(s,side,2,source,'auto');render(root,s);const start=performance.now();
   const sample=()=>details(root,s),x=d=>Math.abs(new DOMMatrix(d.pairs[0].tailTransform).m41);
   await sleep(350);let d=sample();assert(side+'/'+source+' upper first; tail still hidden; stats clear',d.pairs.length===1&&x(d)>580&&!d.stats,d);
   await sleep(1300);d=sample();assert(side+'/'+source+' side count moves out from under wing',x(d)>40&&x(d)<560,d);
   await sleep(430);d=sample();assert(side+'/'+source+' both panels held together',x(d)<1,d);
   const tail=root.querySelector('.timeout-tail234'),anim=tail.getAnimations()[0],time=anim.currentTime;swap(s,side);render(root,s);d=sample();
   assert(side+'/'+source+' color swap preserves running tail and updates bevel',tail===root.querySelector('.timeout-tail234')&&tail.getAnimations()[0]===anim&&anim.currentTime>=time&&d.pairs[0].primary===s.teams[side].color,d);
   await sleep(1000);d=sample();assert(side+'/'+source+' side count retracts before upper tab',x(d)>30&&x(d)<580,d);
   await sleep(600);d=sample();assert(side+'/'+source+' upper remains after side count clears',d.pairs.length===1&&x(d)>580&&!d.stats,d);
   if(source==='manual'){s.program.graphic={type:'none'};s.program.takeId++;render(root,s);await sleep(700);}
   else await sleep(Math.max(0,9100-(performance.now()-start)));
   d=sample();assert(side+'/'+source+' expiry or Out restores stats without another update',d.pairs.length===0&&d.stats&&d.pips[side]===2,{elapsed:Math.round(performance.now()-start),...d});stage.remove();
  })));

  report();status(checks.length+' lifecycle checks passed. Counts remain after the upper and side timeout notices clear.');
 }catch(e){report();status('Check failed: '+e.message,true);}finally{probe.replaceChildren();lock(false);}
}
$('sample').onclick=build;$('audit').onclick=audit;for(const id of ['side','remaining','source','motion'])$(id).onchange=build;
build();
