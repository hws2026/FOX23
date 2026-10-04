import {startController} from './bridge.js?v=cloud222';
const status=document.querySelector('#connection');
status.textContent=new URLSearchParams(location.search).has('remote')?'Waiting for host pairing…':'Loading browser engine…';
try{await startController();await import('./ar-link.js?v=cloud222');await import('./panel.js?v=cloud223');if(!new URLSearchParams(location.search).has('remote'))await import('./pair-controller.js?v=cloud222');await import('./plugin-download.js?v=cloud222');await import('./deck-connect.js?v=cloud222');await import('./stream-playlist208.js?v=cloud222');}
catch(e){status.textContent='Setup failed';status.className='connection offline';const error=document.createElement('div');error.className='card';error.textContent=e.message+' Reload to retry. Your saved show has not been replaced.';document.querySelector('#controls').replaceChildren(error);}
