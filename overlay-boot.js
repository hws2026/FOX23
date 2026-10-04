import {subscribe} from './bridge.js?v=cloud222';
import {renderGraphics,updateClocks,fitStage} from './graphics.js?v=ref219';
const stage=document.querySelector('#stage'),preview=new URLSearchParams(location.search).has('preview');fitStage(stage);const content=document.createElement('div');content.className='broadcast-content209';content.style.cssText='position:absolute;inset:0;transition:transform 420ms cubic-bezier(.4,0,.2,1)';stage.append(content);let state,revision=-1,offset=0;
export function accept(s){offset=s.serverTime-Date.now()/1000;state=s;if(s.revision!==revision){content.style.transform=s.bottomScores?.visible?'translateY(-58px)':'translateY(0)';renderGraphics(content,s,preview);revision=s.revision;}}
const cloudOutput=new URLSearchParams(location.search).has('cloud');
if(cloudOutput)import('./cloud/output.js?v=cloud223').then(m=>m.startCloudOutput(accept)).catch(e=>{console.error('Cloud output:',e);document.title='Cloud output failed: '+e.message;});
else if(!new URLSearchParams(location.search).has('pair'))subscribe(accept);setInterval(()=>state&&updateClocks(stage,state,Date.now()/1000+offset),100);
addEventListener('gridiron-paired-state',e=>{if(!cloudOutput)accept(e.detail);});
if(!cloudOutput&&new URLSearchParams(location.search).has('pair'))import('./pair-output.js?v=remote207');

const key=new URLSearchParams(location.search).get('chroma');if(key&&/^[0-9a-fA-F]{6}$/.test(key)){document.documentElement.style.background='#'+key;document.body.style.background='#'+key;}
