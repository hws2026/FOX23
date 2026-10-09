const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const names219={teamrecord:'Team record · compact card',playerdock:'Player feature · scorebug dock',seasonwall:'Season story · photo wall',sponsorpick:'Sponsor · matchup pick / player stat'};
const logo=t=>(t.heroLogo||t.logo)?`<img src="${esc(t.heroLogo||t.logo)}" alt="">`:`<b>${esc(t.abbr)}</b>`;
// Preserve the operator's complete stat line while giving values the reference
// weight: "5/5 COMP/ATT 69 YARDS" remains one row with smaller inline labels.
function playerDockStats234(value){
 const text=String(value),numbers=/[+-]?\d+(?:,\d{3})*(?:\.\d+)?(?:[/:–-]\d+(?:\.\d+)?)*(?:%|°)?/g;
 let html='',index=0;
 for(const match of text.matchAll(numbers)){html+=esc(text.slice(index,match.index))+`<b class="playerdock234-value">${esc(match[0])}</b>`;index=match.index+match[0].length;}
 return html+esc(text.slice(index));
}
export function graphic219(s,c){if(!names219[c.type])return '';if(c.type==='sponsorpick')return sponsorPick233(s,c);const t=s.teams[c.team||'away'],p=t.roster.find(p=>p.id===c.playerId)||{},style=`--team:${esc(t.color)};--secondary:${esc(t.secondary)};`;
if(c.type==='teamrecord')return `<section class="record219" style="${style}"><div class="record219-logo">${logo(t)}</div><header><h1>${esc(c.title||`${t.shortName||t.name} RECORD`)}</h1><h2>${esc(c.subtitle||'THIS SEASON')}</h2></header><dl>${(c.stats||[]).slice(0,3).map(r=>`<div><dt>${esc(r.label)}</dt><dd>${esc(r[c.team||'away'])}</dd></div>`).join('')}</dl><div class="record219-rail"></div></section>`;
if(c.type==='playerdock')return `<section class="playerdock219 ${c.team==='home'?'home219':''}" style="${style}--dock-bottom:${Number(s.branding.bugBottom)||64}px;--dock-scale:${(Number(s.branding.bugScale)||1)*.74}">${p.photo?`<img class="playerdock219-photo" src="${esc(p.photo)}" alt="">`:''}<small>${esc(c.subtitle||'THIS SEASON')}</small><div class="playerdock219-name"><span>${esc(p.number)} ${esc(p.position)}</span> <b>${esc(p.name||'SELECT PLAYER')}</b></div><p class="playerdock234-stats">${playerDockStats234(c.title||'PLAYER STATISTIC')}</p></section>`;
const art=c.storyImage||p.photo||t.heroLogo||t.logo,artKind=c.storyImage?'photo':p.photo?'portrait':art?'logo':'none',headline=numberText233(c.title||'SEASON STORY');return `<section class="seasonwall219" data-art="${artKind}" style="${style}"><div class="seasonwall219-wall">${art?`<img src="${esc(art)}" alt="">`:`<b class="seasonwall219-monogram">${esc(t.abbr)}</b>`}<div class="seasonwall219-grid"></div></div><div class="seasonwall219-copy"><h1>${headline}</h1><h2>${esc(c.subtitle||'')}</h2><p>${esc(c.featureFooter||'')}</p></div></section>`;
}

// Escape each text fragment after detecting numbers so apostrophe entities stay intact.
function numberText233(value){
 const text=String(value),pattern=/\d[\d,.-]*/g;let html='',index=0;
 for(const match of text.matchAll(pattern)){html+=esc(text.slice(index,match.index))+`<em>${esc(match[0])}</em>`;index=match.index+match[0].length;}
 return html+esc(text.slice(index));
}
function sponsorPick233(s,c){
 const b=s.branding,layout=c.sponsorPickLayout==='playerstat'?'playerstat':'matchup';
 const identity=b.sponsorLogo?`<img src="${esc(b.sponsorLogo)}" alt="${esc(b.sponsorName||'Sponsor')}">`:`<b>${esc(b.sponsorName||'SPONSOR')}</b>`;
 const footer=c.sponsorPickFooter?`<footer>${esc(c.sponsorPickFooter)}</footer>`:'';
 const style=`--sponsor:${esc(b.sponsorColor||'#086bdf')};--pick-accent:${esc(b.accent||'#f9cb40')}`;
 if(layout==='playerstat'){
  const t=s.teams[c.team||'away'],p=(t.roster||[]).find(player=>player.id===c.playerId);
  return `<section class="sponsorpick233 sponsorpick233-stat ${footer?'':'no-footer'}" style="${style}"><div class="sponsorpick233-body"><div class="sponsorpick233-sponsor">${identity}</div><div class="sponsorpick233-stat-copy"><h1>${esc(c.sponsorPickName||p?.name||'PLAYER NAME')}</h1><p>${esc(c.sponsorPickStat||'')}${c.sponsorPickLine?` <em>${esc(c.sponsorPickLine)}</em>`:''}</p></div></div>${footer}</section>`;
 }
 const side=['away','home'].includes(c.sponsorPickSide)?c.sponsorPickSide:'both',sides=side==='both'?['away','home']:[side];
 const matchup=c.sponsorPickMatchup||`${s.teams.away.shortName||s.teams.away.name} AT ${s.teams.home.shortName||s.teams.home.name}`;
 return `<section class="sponsorpick233 ${footer?'':'no-footer'}" style="${style}"><header><h1>${esc(matchup)}${c.sponsorPickLine?' '+esc(c.sponsorPickLine):''}</h1></header><div class="sponsorpick233-body"><div class="sponsorpick233-sponsor">${identity}</div><div class="sponsorpick233-selection"><div class="sponsorpick233-teams" data-selection="${side}">${sides.map(key=>`<div class="sponsorpick233-team" data-team="${key}" aria-label="${esc(s.teams[key].name)}">${logo(s.teams[key])}</div>`).join('')}</div><div class="sponsorpick233-name">${esc(c.sponsorPickName||'')}</div></div></div>${footer}</section>`;
}
// Fit the whole copy stack, including multiline text, inside the lower wall area.
export function fitAdditions219(root){
 for(const copy of root.querySelectorAll('.seasonwall219-copy')){
  const labels=[...copy.querySelectorAll('h1,h2,p')];
  for(const label of labels){
   label.style.removeProperty('font-size');
   const style=getComputedStyle(label),size=parseFloat(style.fontSize),width=label.clientWidth;
   if(width>0&&label.scrollWidth>width+1)label.style.fontSize=(size*width/label.scrollWidth)+'px';
  }
  // Re-measure after each reduction: wrapping can change abruptly at a word boundary.
  for(let pass=0;pass<12&&copy.clientHeight>0&&copy.scrollHeight>copy.clientHeight+1;pass++){
   const ratio=Math.min(.96,copy.clientHeight/copy.scrollHeight);
   for(const label of labels){const size=parseFloat(getComputedStyle(label).fontSize);label.style.fontSize=(size*ratio)+'px';}
  }
 }
}
