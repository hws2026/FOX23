import {subscribe} from './bridge.js?v=ui209';
import {renderGraphics,updateClocks,fitStage} from './graphics.js?v=ticker210';
const stage=document.querySelector('#stage'),preview=new URLSearchParams(location.search).has('preview');fitStage(stage);const content=document.createElement('div');content.className='broadcast-content209';content.style.cssText='position:absolute;inset:0;transition:transform 420ms cubic-bezier(.4,0,.2,1)';stage.append(content);let state,revision=-1,offset=0;
export function accept(s){offset=s.serverTime-Date.now()/1000;state=s;if(s.revision!==revision){content.style.transform=s.bottomScores?.visible?'translateY(-58px)':'translateY(0)';renderGraphics(content,s,preview);revision=s.revision;}}
if(!new URLSearchParams(location.search).has('pair'))subscribe(accept);setInterval(()=>state&&updateClocks(stage,state,Date.now()/1000+offset),100);
addEventListener('gridiron-paired-state',e=>accept(e.detail));
if(new URLSearchParams(location.search).has('pair'))import('./pair-output.js?v=remote207');

const key=new URLSearchParams(location.search).get('chroma');if(key&&/^[0-9a-fA-F]{6}$/.test(key)){document.documentElement.style.background='#'+key;document.body.style.background='#'+key;}
