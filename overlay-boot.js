import {subscribe} from './bridge.js?v=remote206';
import {renderGraphics,updateClocks,fitStage} from './graphics.js?v=fix205';
const stage=document.querySelector('#stage'),preview=new URLSearchParams(location.search).has('preview');fitStage(stage);let state,revision=-1,offset=0;
export function accept(s){offset=s.serverTime-Date.now()/1000;state=s;if(s.revision!==revision){renderGraphics(stage,s,preview);revision=s.revision;}}
if(!new URLSearchParams(location.search).has('pair'))subscribe(accept);setInterval(()=>state&&updateClocks(stage,state,Date.now()/1000+offset),100);
addEventListener('gridiron-paired-state',e=>accept(e.detail));
if(new URLSearchParams(location.search).has('pair'))import('./pair-output.js?v=remote206');

const key=new URLSearchParams(location.search).get('chroma');if(key&&/^[0-9a-fA-F]{6}$/.test(key)){document.documentElement.style.background='#'+key;document.body.style.background='#'+key;}
