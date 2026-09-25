import {startController} from './bridge.js?v=intro138';
const status=document.querySelector('#connection');
status.textContent='Loading browser engine…';
try{await startController();await import('./panel.js?v=intro138');await import('./pair-controller.js?v=intro138');await import('./plugin-download.js?v=intro138');await import('./deck-connect.js?v=intro138');}
catch(e){status.textContent='Setup failed';status.className='connection offline';const error=document.createElement('div');error.className='card';error.textContent=e.message+' Reload to retry. First launch requires internet to download the browser engine.';document.querySelector('#controls').replaceChildren(error);}
