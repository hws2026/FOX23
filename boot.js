import {startController} from './bridge.js?v=scores225';
const status=document.querySelector('#connection');
status.textContent=new URLSearchParams(location.search).has('remote')?'Waiting for host pairing…':'Loading browser engine…';
try{await startController();await import('./ar-link.js?v=scores225');await import('./panel.js?v=scores225');if(!new URLSearchParams(location.search).has('remote'))await import('./pair-controller.js?v=scores225');await import('./plugin-download.js?v=scores225');await import('./deck-connect.js?v=scores225');await import('./stream-playlist208.js?v=scores225');}
catch(e){status.textContent='Setup failed';status.className='connection offline';const error=document.createElement('div');error.className='card';error.textContent=e.message+' Reload to retry. Your saved show has not been replaced.';document.querySelector('#controls').replaceChildren(error);}
