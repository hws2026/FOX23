import {startController} from './bridge.js?v=add190';
const status=document.querySelector('#connection');
status.textContent='Loading browser engine…';
try{await startController();await import('./ar-link.js?v=sync171b');await import('./panel.js?v=add190');await import('./pair-controller.js?v=sync171');await import('./plugin-download.js?v=sync171');await import('./deck-connect.js?v=sync171');}
catch(e){status.textContent='Setup failed';status.className='connection offline';const error=document.createElement('div');error.className='card';error.textContent=e.message+' Reload to retry. First launch requires internet to download the browser engine.';document.querySelector('#controls').replaceChildren(error);}
