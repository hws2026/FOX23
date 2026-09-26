const $=s=>document.querySelector(s),catalog=window.DECK_CATALOG;
let ws,context,settings={},mapping=window.DECK_MAPPING,inputs=[];
function list(search='',desired){
 const selected=desired||$('#command').value||settings.command||'take';$('#command').replaceChildren();const groups={};
 for(const [key,spec]of Object.entries(catalog)){
  if(search&&!`${spec.label} ${key}`.toLowerCase().includes(search.toLowerCase())&&key!==selected)continue;
  const group=groups[spec.group]||(groups[spec.group]=Object.assign(document.createElement('optgroup'),{label:spec.group}));
  if(!group.parentNode)$('#command').append(group);group.append(Object.assign(document.createElement('option'),{value:key,textContent:spec.label}));
 }$('#command').value=selected;
}
function fields(){
 inputs=[];$('#fields').replaceChildren();const spec=catalog[$('#command').value];if(!spec)return;
 const saved=settings.command===$('#command').value?settings:{};
 $('#advanced').hidden=!spec.advanced;$('#behaviorLabel').hidden=spec.mode!=='graphic';$('#behavior').value=saved.behavior||'graphic';
 $('#action').value=saved.action||spec.action||'preview';$('#payload').value=saved.payload||JSON.stringify(spec.payload||{},null,2);
 const data=spec.cue||spec.payload||{};
 function field(key,value,param){
  const opts=param?.options||(key==='team'?['away','home']:key==='transition'||key==='outTransition'?['auto','fade']:null);
  const type=param?.type||(typeof value==='boolean'?'boolean':typeof value==='number'?'number':typeof value==='object'?'json':'text');
  const label=document.createElement('label');label.textContent=key.replace(/([a-z])([A-Z])/g,'$1 $2');let input;
  if(opts||type==='boolean'){input=document.createElement('select');for(const v of opts||(type==='boolean'?[true,false]:[]))input.append(Object.assign(document.createElement('option'),{value:String(v),textContent:String(v)}));}
  else{input=document.createElement(type==='json'?'textarea':'input');if(type!=='json')input.type=type==='number'?'number':'text';}
  input.value=type==='json'?JSON.stringify(value):String(value??'');input.oninput=save;input.onchange=save;label.append(input);$('#fields').append(label);inputs.push({key,input,type});
 }
 if(!spec.advanced){for(const [key,value]of Object.entries(data))if(key!=='type')field(key,saved.overrides?.[key]??value);if(spec.parameter)field(spec.parameter.field,saved.overrides?.[spec.parameter.field]??saved.value??spec.parameter.default,spec.parameter);}
}
function save(){try{
 const spec=catalog[$('#command').value],overrides={};for(const {key,input,type}of inputs){let v=input.value;if(type==='number'){v=Number(v);if(input.value.trim()===''||!Number.isFinite(v))throw Error('Enter a valid number');}if(type==='boolean')v=v==='true';if(type==='json')v=JSON.parse(v);overrides[key]=v;}
 if(spec.advanced){const p=JSON.parse($('#payload').value);if(!p||typeof p!=='object'||Array.isArray(p))throw Error('Payload must be an object');}
 settings={command:$('#command').value,overrides,behavior:$('#behavior').value,action:$('#action').value,payload:$('#payload').value};
 if(ws?.readyState===1){ws.send(JSON.stringify({event:'setSettings',context,payload:settings}));$('#status').textContent='Saved for this key';}else $('#status').textContent='Preview only — settings save inside Stream Deck';
 }catch(e){$('#status').textContent=e.message+' — not saved';}}
for(const a of window.DECK_ACTIONS)$('#action').append(Object.assign(document.createElement('option'),{value:a,textContent:a.replaceAll('_',' ')}));
$('#search').oninput=()=>list($('#search').value);$('#command').onchange=()=>{fields();save()};for(const id of ['action','payload','behavior'])$('#'+id).onchange=save;
window.connectElgatoStreamDeckSocket=(port,uuid,event,info,actionInfo)=>{
 context=uuid;const a=JSON.parse(actionInfo);settings=a.payload?.settings||{};settings.command=settings.command||mapping[a.action]||'take';list('',settings.command);fields();ws=new WebSocket('ws://127.0.0.1:'+port);ws.onopen=()=>{ws.send(JSON.stringify({event,uuid}));$('#status').textContent='Ready — changes save automatically';};ws.onmessage=({data})=>{const m=JSON.parse(data);if(m.event==='didReceiveSettings'){settings=m.payload.settings;list('',settings.command);fields();}};
};list();fields();
