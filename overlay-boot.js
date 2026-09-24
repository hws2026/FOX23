import {subscribe} from './bridge.js?v=deck2';
import {renderGraphics,updateClocks,fitStage} from './graphics.js?v=deck2';
const stage=document.querySelector('#stage'),preview=new URLSearchParams(location.search).has('preview');fitStage(stage);let state,revision=-1,offset=0;
export function accept(s){offset=s.serverTime-Date.now()/1000;state=s;if(s.revision!==revision){renderGraphics(stage,s,preview);revision=s.revision;}}
if(!new URLSearchParams(location.search).has('pair'))subscribe(accept);setInterval(()=>state&&updateClocks(stage,state,Date.now()/1000+offset),100);
if(new URLSearchParams(location.search).has('pair'))import('./pair-output.js?v=deck2');

const key=new URLSearchParams(location.search).get('chroma');if(key&&/^[0-9a-fA-F]{6}$/.test(key)){document.documentElement.style.background='#'+key;document.body.style.background='#'+key;}
