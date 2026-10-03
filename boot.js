import {startController} from './bridge.js?v=remote207';
const status=document.querySelector('#connection');
status.textContent=new URLSearchParams(location.search).has('remote')?'Waiting for host pairing…':'Loading browser engine…';
try{await startController();await import('./ar-link.js?v=remote207');await import('./panel.js?v=remote207');if(!new URLSearchParams(location.search).has('remote'))await import('./pair-controller.js?v=remote207');await import('./plugin-download.js?v=remote207');await import('./deck-connect.js?v=remote207');}
catch(e){status.textContent='Setup failed';status.className='connection offline';const error=document.createElement('div');error.className='card';error.textContent=e.message+' Reload to retry. First launch requires internet to download the browser engine.';document.querySelector('#controls').replaceChildren(error);}
