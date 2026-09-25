importScripts('https://cdn.jsdelivr.net/pyodide/v0.29.2/full/pyodide.js');
let py, db, lastSaved;
function database(){return new Promise((resolve,reject)=>{const r=indexedDB.open('gridiron-pages:'+new URL('.',location.href).pathname,1);r.onupgradeneeded=()=>r.result.createObjectStore('show');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function read(){return new Promise((resolve,reject)=>{const r=db.transaction('show').objectStore('show').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function write(value){return new Promise((resolve,reject)=>{const tx=db.transaction('show','readwrite');tx.objectStore('show').put(value,'current');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Save aborted'));});}
async function init(){
 db=await database();const saved=await read();
 py=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.29.2/full/'});
 py.FS.mkdirTree('/studio/data');py.FS.mkdirTree('/studio/catalog');
 for(const [url,path] of [['core.py?v=rails154','/studio/core.py'],['team_library.py','/studio/team_library.py'],['nfl-2026.json','/studio/catalog/nfl-2026.json']]){
  const r=await fetch(url);if(!r.ok)throw Error('Cannot load '+url);py.FS.writeFile(path,await r.text());
 }
 if(saved){py.FS.writeFile('/studio/data/game.json',JSON.stringify(saved.state));py.FS.writeFile('/studio/data/team-library.json',JSON.stringify(saved.library));}
 await py.runPythonAsync("import sys; sys.path.insert(0, '/studio'); import core");
}
const ready=init();let queue=Promise.resolve();
onmessage=({data})=>{queue=queue.then(async()=>{try{
 await ready;py.globals.set('request_json',JSON.stringify(data.request));
 const result=JSON.parse(py.runPython('core.pages_request(request_json)'));
 const snapshot=JSON.parse(py.runPython('core.pages_snapshot()'));
 const encoded=JSON.stringify(snapshot);
 if(encoded!==lastSaved){await write(snapshot);lastSaved=encoded;}
 postMessage({id:data.id,result});
 }catch(e){postMessage({id:data.id,error:String(e.message||e)});}});};
