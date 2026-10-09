importScripts('https://cdn.jsdelivr.net/pyodide/v0.29.2/full/pyodide.js');
let py, db, lastSaved, recoveryError;
const cloudMode=new URL(location.href).searchParams.has('cloud');
const checkpoint231="(core.copy.deepcopy(core.STATE), core.copy.deepcopy(core.LIBRARY.overrides), core.copy.deepcopy(core.LIBRARY.teams))";
function rollback231(){
 py.runPython("worker_state231, worker_library231, worker_teams231 = worker_checkpoint231\ncore.STATE.clear()\ncore.STATE.update(core.copy.deepcopy(worker_state231))\ncore.LIBRARY.overrides = core.copy.deepcopy(worker_library231)\ncore.LIBRARY.teams = core.copy.deepcopy(worker_teams231)\ncore._asset_checked_library = None\ncore.save()\ncore.LIBRARY.path.write_text(core.json.dumps(core.LIBRARY.overrides, ensure_ascii=False))\nglobals().pop('worker_pending231', None)");
}
function database(){return new Promise((resolve,reject)=>{const r=indexedDB.open('gridiron-pages:'+new URL('.',location.href).pathname,1);r.onupgradeneeded=()=>r.result.createObjectStore('show');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function read(){return new Promise((resolve,reject)=>{const r=db.transaction('show').objectStore('show').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function write(value){return new Promise((resolve,reject)=>{const tx=db.transaction('show','readwrite');tx.objectStore('show').put(value,'current');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Save aborted'));});}
async function init(){
 db=await database();const saved=await read();
 py=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.29.2/full/'});
 py.FS.mkdirTree('/studio/data');py.FS.mkdirTree('/studio/catalog');py.FS.mkdirTree('/studio/broadcast-logos226');py.FS.mkdirTree('/studio/broadcast-logos236');
 for(const [url,path] of [['core.py?v=update238','/studio/core.py'],['broadcast-logos226/assignments.json','/studio/broadcast-logos226/assignments.json'],['broadcast-logos236/mlb-assignments.json','/studio/broadcast-logos236/mlb-assignments.json'],['team_library.py?v=photos163','/studio/team_library.py'],['nfl-2026.json?v=photos163','/studio/catalog/nfl-2026.json']]){
  const r=await fetch(url);if(!r.ok)throw Error('Cannot load '+url);py.FS.writeFile(path,await r.text());
 }
 if(saved){py.FS.writeFile('/studio/data/game.json',JSON.stringify(saved.state));py.FS.writeFile('/studio/data/team-library.json',JSON.stringify(saved.library));}
 await py.runPythonAsync("import sys; sys.path.insert(0, '/studio'); import core");
 if(!cloudMode)py.runPython('worker_checkpoint231 = '+checkpoint231);
}
const ready=init();let queue=Promise.resolve();
onmessage=({data})=>{queue=queue.then(async()=>{let needsRollback=false;try{
 await ready;
 if(recoveryError)throw recoveryError;
 if(data.request.endpoint==='cloud_snapshot'){
  postMessage({id:data.id,result:JSON.parse(py.runPython('core.pages_snapshot()'))});return;
 }
 if(data.request.endpoint==='cloud_load'){
  if(!cloudMode)throw Error('Cloud snapshot loading is disabled in local mode.');
  const s=data.request.snapshot;
  if(!s?.state?.teams||!s.state.game||!s.state.program||!s.library)throw Error('Invalid cloud snapshot.');
  py.globals.set('cloud_snapshot_json',JSON.stringify(s));
  py.runPython("cloud_snapshot = core.json.loads(cloud_snapshot_json)\ncore.STATE.clear()\ncore.STATE.update(cloud_snapshot['state'])\ncore.LIBRARY.overrides = cloud_snapshot['library']\ncore.LIBRARY.teams = core.copy.deepcopy(core.LIBRARY.seed)\ncore.LIBRARY.teams.update(core.LIBRARY.overrides)\ncore.ensure_assets()");
  postMessage({id:data.id,result:{status:200}});return;
 }
 needsRollback=!cloudMode;
 py.globals.set('request_json',JSON.stringify(data.request));
 const result=JSON.parse(py.runPython('core.pages_request(request_json)'));
 const snapshot=JSON.parse(py.runPython('core.pages_snapshot()'));
 const encoded=JSON.stringify(snapshot);
 if(!cloudMode&&encoded!==lastSaved){
  // Stage the next checkpoint before committing. A quota/transaction failure
  // must never publish the edit or leave it for a later poll to save silently.
  py.runPython('worker_pending231 = '+checkpoint231);
  await write(snapshot);
  needsRollback=false;
  try{py.runPython('worker_checkpoint231 = worker_pending231\ndel worker_pending231');}
  catch(e){recoveryError=Error('The show was saved, but the controller must reload before continuing. '+String(e.message||e));throw recoveryError;}
  lastSaved=encoded;
 }
 needsRollback=false;
 postMessage({id:data.id,result});
 }catch(e){
  if(needsRollback){try{rollback231();}catch(rollbackError){recoveryError=Error('The controller could not recover from a save failure. Reload before continuing. '+String(rollbackError.message||rollbackError));e=recoveryError;}}
  postMessage({id:data.id,error:String(e.message||e)});
 }});};
