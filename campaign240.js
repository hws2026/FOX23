// Editable campaign bug using the existing, reference-reviewed news-ribbon shell.
const escape240=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const text240=(value,fallback,max)=>String(value??fallback).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').slice(0,max).trim();
const number240=(value,fallback,min,max)=>{const n=Number(value);return Math.min(max,Math.max(min,Number.isFinite(n)&&value!==''&&value!==null?n:fallback));};
const color240=(value,fallback)=>/^#[0-9a-f]{6}$/i.test(String(value||''))?value:fallback;

export function campaignAsset240(value){
 if(typeof value!=='string'||value.length>3500000)return '';
 if(/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value))return value;
 if(value.split('/').some(part=>part==='..'))return '';
 return /^(?:\.\/)?(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_. -]+\.(?:png|jpe?g|webp|gif|svg)$/i.test(value)?value:'';
}

export function campaignGraphic(s,c){
 if(c?.type!=='inspirechange')return '';
 const layout=c.campaignLayout==='compact'?'compact':'ribbon';
 const align=c.campaignAlign==='center'?'center':'left';
 const scale=number240(c.campaignScale,100,70,130)/100;
 const imageSize=Math.round(number240(c.campaignImageSize,136,96,140));
 const imageMode=c.campaignImageMode==='art'?'art':'qr';
 const primary=color240(c.campaignPrimary,'#101820'),accent=color240(c.campaignAccent,'#00bce4'),ink=color240(c.campaignText,'#ffffff');
 const headline=text240(c.campaignHeadline,'IT TAKES ALL OF US',120);
 const kicker=text240(c.campaignKicker,'INSPIRE CHANGE',120);
 const message=text240(c.campaignMessage,'',360);
 const footer=text240(c.campaignFooter,'NFL.COM/INSPIRECHANGE',160);
 const logo=campaignAsset240(c.campaignLogo),image=campaignAsset240(c.campaignImage);
 return `<section class="news-ribbon campaign240 campaign240-${layout} campaign240-align-${align} campaign240-image-${imageMode}${image?' campaign240-has-image':''}${logo?' campaign240-has-logo':''}${kicker?'':' no-label'}" data-campaign-layout="${layout}" style="--team:${primary};--secondary:${ink};--campaign-primary:${primary};--campaign-accent:${accent};--campaign-text:${ink};--campaign-scale:${scale};--campaign-image-size:${imageSize}px">
  <div class="news-body"><div class="news-face"></div><div class="news-metal"></div>
   <div class="campaign240-copy">
    ${headline?`<h1 class="campaign240-headline">${escape240(headline)}</h1>`:''}
    ${message?`<p class="campaign240-message">${escape240(message)}</p>`:''}
    ${footer?`<p class="campaign240-footer">${escape240(footer)}</p>`:''}
   </div>
  </div>
  ${kicker?`<div class="news-label campaign240-tab"><span>${escape240(kicker)}</span></div>`:''}
  ${logo?`<div class="news-art campaign240-logo"><img src="${escape240(logo)}" alt="Campaign logo"></div>`:''}
  ${image?`<div class="news-art campaign240-image"><img src="${escape240(image)}" alt="${imageMode==='qr'?'QR code':'Campaign artwork'}"></div>`:''}
 </section>`;
}

// Same measurement pass for preview and live; never changes saved cue values.
export function fitCampaign240(root){
 const cards=root?.matches?.('.campaign240')?[root]:[...root?.querySelectorAll?.('.campaign240')||[]];
 for(const card of cards){
  for(const el of card.querySelectorAll('.campaign240-headline,.campaign240-message,.campaign240-footer,.campaign240-tab span')){
   el.style.removeProperty('font-size');
   if(!el.clientWidth||!el.clientHeight)continue;
   for(let pass=0;pass<5;pass++){
    const ratio=Math.min(el.clientWidth/Math.max(1,el.scrollWidth),el.clientHeight/Math.max(1,el.scrollHeight));
    if(ratio>=.995)break;
    const size=parseFloat(getComputedStyle(el).fontSize);
    if(!Number.isFinite(size)||size<=1)break;
    el.style.fontSize=Math.max(1,size*ratio*.98)+'px';
   }
  }
 }
}
