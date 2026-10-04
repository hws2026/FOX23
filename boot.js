import {startController} from './bridge.js?v=league215';
const status=document.querySelector('#connection');
status.textContent=new URLSearchParams(location.search).has('remote')?'Waiting for host pairing…':'Loading browser engine…';
try{await startController();await import('./ar-link.js?v=league215');await import('./panel.js?v=league215');if(!new URLSearchParams(location.search).has('remote'))await import('./pair-controller.js?v=league215');await import('./plugin-download.js?v=league215');await import('./deck-connect.js?v=league215');await import('./stream-playlist208.js?v=league215');}
catch(e){status.textContent='Setup failed';status.className='connection offline';const error=document.createElement('div');error.className='card';error.textContent=e.message+' Reload to retry. First launch requires internet to download the browser engine.';document.querySelector('#controls').replaceChildren(error);}
