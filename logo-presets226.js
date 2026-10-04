// These paths are shared by controller and output; the original PNGs stay intact.
export const logoPresets226=Object.freeze([
 ['nfl','NFL'],['afc','AFC'],['nfc','NFC'],
 ['afc-championship','AFC Championship'],['nfc-championship','NFC Championship'],
 ['divisional','NFL Divisional'],['wild-card','NFL Wild Card'],
].map(([id,label])=>Object.freeze({id,label,src:`broadcast-logos226/marks/${id}.png`})));
const labels={conferenceLogo:'Transition',introLogo:'Intro',secondaryLogo:'Secondary broadcast'};
export const logoPresetFields226=Object.freeze(Object.keys(labels).map(key=>`${key}Preset226`));
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function logoPresetControl226(key,current=''){
 if(!Object.hasOwn(labels,key))return '';
 const selected=logoPresets226.find(preset=>preset.src===current);
 return `<label>${labels[key]} logo preset<select name="${key}Preset226"><option value="">Keep current${selected?` · ${selected.label}`:''}</option>${logoPresets226.map(preset=>`<option value="${preset.id}">${escape(preset.label)}</option>`).join('')}</select></label>`;
}

// A blank choice makes no change. A selected upload takes precedence over a preset.
export async function logoPresetPayload226(formData,sampleTransitionColor){
 const payload={};
 for(const key of Object.keys(labels)){
  const choice=formData.get(`${key}Preset226`);
  if(!choice||formData.get(key)?.size)continue;
  const preset=logoPresets226.find(item=>item.id===choice);
  if(!preset)throw Error('Choose one of the supplied NFL logo presets.');
  payload[key]=preset.src;
  if(key==='conferenceLogo')payload.conferenceAutoColor=await sampleTransitionColor(preset.src);
 }
 return payload;
}
