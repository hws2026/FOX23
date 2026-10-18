const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const choices=(name,label,items,value)=>`<label>${label}<select name="${name}">${items.map(([key,text])=>`<option value="${key}" ${key===value?'selected':''}>${text}</option>`).join('')}</select></label>`;
const input=(name,label,value,type='text',extra='')=>`<label>${label}<input name="${name}" type="${type}" value="${escapeHTML(value)}" ${extra}></label>`;

export function campaignFields240(c){
 return `<fieldset><legend>Campaign copy</legend><label>Main message<textarea name="campaignHeadline" rows="2" maxlength="80">${escapeHTML(c.campaignHeadline??'IT TAKES ALL OF US')}</textarea></label>${input('campaignKicker','Top label',c.campaignKicker??'INSPIRE CHANGE','text','maxlength="80"')}${input('campaignMessage','Supporting message',c.campaignMessage??'','text','maxlength="180"')}${input('campaignFooter','Footer / website',c.campaignFooter??'NFL.COM/INSPIRECHANGE','text','maxlength="100"')}</fieldset>
 <fieldset><legend>Edit the look</legend><div class="form-grid">${choices('campaignLayout','Layout',[['ribbon','News ribbon'],['compact','Compact ribbon']],c.campaignLayout||'ribbon')}${choices('campaignAlign','Text alignment',[['left','Left'],['center','Center']],c.campaignAlign||'left')}${input('campaignPrimary','Background color',c.campaignPrimary||'#101820','color')}${input('campaignAccent','Accent color',c.campaignAccent||'#00bce4','color')}${input('campaignText','Text color',c.campaignText||'#ffffff','color')}${input('campaignScale','Headline size (%)',c.campaignScale??100,'number','min="70" max="130" step="1"')}${choices('campaignImageMode','Custom image style',[['qr','QR code · white backing'],['art','Artwork · transparent backing']],c.campaignImageMode||'qr')}${input('campaignImageSize','Custom image size (px)',c.campaignImageSize??136,'number','min="96" max="140" step="1"')}</div><button type="button" id="campaign-swap240">Swap background and accent</button></fieldset>
 <fieldset><legend>Images</legend><label>Logo<input id="campaign-logo240" type="file" accept="image/png,image/jpeg,image/webp"></label>${c.campaignLogo?'<label><input type="checkbox" name="campaignRemoveLogo"> Remove saved logo</label>':''}<label>Custom image / QR code<input id="campaign-image240" type="file" accept="image/png,image/jpeg,image/webp"></label>${c.campaignImage?'<label><input type="checkbox" name="campaignRemoveImage"> Remove saved custom image / QR code</label>':''}<p class="help">Upload your QR code or artwork as a PNG, JPEG or WebP under 2 MB. The image is shown whole; QR mode adds a white backing. Test your code at the final output size. Your images and design settings travel with the exported show.</p></fieldset><p class="help">Update preview to review your design, then Take Live. Save different designs as playlist items. This graphic stays on air until you hide it.</p>`;
}

export async function readCampaignImages240(form,payload,imageFile){
 for(const [key,id,remove] of [['campaignLogo','campaign-logo240','campaignRemoveLogo'],['campaignImage','campaign-image240','campaignRemoveImage']]){
  const file=form.querySelector('#'+id)?.files?.[0];
  const image=await imageFile(file);
  if(image)payload[key]=image;
  else if(form.elements[remove]?.checked)payload[key]='';
  delete payload[remove];
 }
}

export function bindCampaignEditor240(form){
 const swap=form?.querySelector('#campaign-swap240');
 if(swap)swap.onclick=()=>{const a=form.elements.campaignPrimary,b=form.elements.campaignAccent;[a.value,b.value]=[b.value,a.value];};
}
