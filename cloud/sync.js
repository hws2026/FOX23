import config from './config.js?v=cloud222';
import {changes,applyChanges} from './delta.js?v=cloud222';
export const cloudEnabled = config.enabled && location.origin === config.origin &&
  new URL('../', import.meta.url).pathname === config.path;

// Serialize this device's requests, and use the database version to arbitrate devices.
export function createSharedRPC(local, db, {readOnly=false}={}) {
  let tail = Promise.resolve(), version = null, baseline = null;
  async function refresh() {
    const head = await db.head();
    if (!head) throw Error('Shared show is missing. No local data has been uploaded.');
    if (head.version !== version) {
      const row = baseline && head.version === version+1 && Array.isArray(head.last_patch)
        ? {version:head.version,snapshot:applyChanges(baseline,head.last_patch)} : await db.read();
      if (!row) throw Error('Shared show is missing.');
      await local({endpoint:'cloud_load', snapshot:row.snapshot});
      version = row.version; baseline = row.snapshot;
    }
  }
  return request => {
    const task = tail.then(async () => {
      if(readOnly && request.endpoint!=='state')throw Error('Cloud output is read-only.');
      try {
        await refresh();
        const result = await local(request);
        if(readOnly || result.status !== 200)return result;
        const snapshot = await local({endpoint:'cloud_snapshot'});
        const edits = changes(baseline,snapshot);
        if (edits.length) {
          const saved = await db.save(version, snapshot, edits);
          if (saved == null) {
            version = null; await refresh();
            if (request.endpoint === 'action') return {status:409,data:{error:'Another device changed the shared show. Try again.'}};
            return local(request);
          }
          version = saved; baseline = snapshot;
        }
        return result;
      } catch (error) {
        // Never replay an uncertain action (e.g. score +6) or save offline changes later.
        version = null;
        throw Error((readOnly?'Cloud output reconnecting. ':'Cloud sync unavailable. Action not confirmed; check the shared show before retrying. ') + error.message);
      }
    });
    tail = task.catch(()=>{}); return task;
  };
}

export async function connectCloud(local, {readOnly=false}={}) {
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.url) || !config.publishableKey)
    throw Error('Complete cloud/config.js with your Supabase project URL and publishable key.');
  if (config.publishableKey.startsWith('sb_secret_')) throw Error('Use a publishable key, never a secret key.');
  try { if (JSON.parse(atob(config.publishableKey.split('.')[1])).role === 'service_role') throw Error('secret'); }
  catch(e) { if(e.message==='secret') throw Error('Never use a service_role key in this panel.'); }
  const root=config.url.replace(/\/$/,''), key='wld-cloud-session:'+root;
  let session; try { session=JSON.parse(sessionStorage.getItem(key)); } catch {}
  function remember(s) { session={...s,expires_at:Date.now()+s.expires_in*1000}; sessionStorage.setItem(key,JSON.stringify(session)); }
  async function call(path,body,authenticated=true) {
    if(authenticated && (!session || session.expires_at < Date.now()+60000)) {
      if(!session?.refresh_token) throw Error('Sign in again by reloading the panel.');
      remember(await call('/auth/v1/token?grant_type=refresh_token',{refresh_token:session.refresh_token},false));
    }
    const response=await fetch(root+path,{method:body===undefined?'GET':'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json',...(authenticated?{Authorization:'Bearer '+session.access_token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(body===undefined&&!path.includes('snapshot')?20000:60000)});
    const data=await response.json();
    if(!response.ok) throw Error(data.msg||data.message||data.error_description||'Cloud request failed');
    return data;
  }
  let patches=true;
  const db={
    head:async()=> {
      try{return (await call('/rest/v1/wld_shows?select='+ (patches?'version,last_patch':'version') +'&limit=1'))[0];}
      catch(error){if(patches && /last_patch/.test(error.message)){patches=false;return (await call('/rest/v1/wld_shows?select=version&limit=1'))[0];}throw error;}
    },
    read:async()=> (await call('/rest/v1/wld_shows?select=version,snapshot&limit=1'))[0],
    save:(v,s,edits)=>patches?call('/rest/v1/rpc/wld_patch_show',{expected_version:v,edits}):call('/rest/v1/rpc/wld_save_show',{expected_version:v,s}),
  };
  const sharedRPC=createSharedRPC(local,db,{readOnly});
  const box=document.createElement('section');box.className='card';
  box.innerHTML='<h2>WLD shared show</h2><p>Sign in with the same show account on every device. Your Desktop/local show stays separate.</p><button type="button" data-continue hidden>Continue saved session</button><form><label>Email<input name="email" type="email" autocomplete="username" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button type="submit">Sign in</button></form><div hidden data-setup><p>No shared show exists for this account. On the computer with your existing GitHub playlist, download its backup, then create the shared show. Other devices should wait and use Join.</p><button data-backup>Download this browser’s show backup</button><button data-create disabled>Create shared show from this GitHub playlist</button><button data-join>Join existing shared show</button></div><p role="status"></p>';
  document.querySelector('#controls').replaceChildren(box);
  document.body.classList.add('cloud-login222');
  const style=document.createElement('style');style.textContent='.cloud-login222 .sidebar,.cloud-login222 .monitor-grid,.cloud-login222 .transport,.cloud-login222 .app-footer{display:none!important}.cloud-login222 main{margin-left:0!important}.cloud-login222 #controls{max-width:620px;margin:32px auto}.cloud-login222 #controls label{display:block;margin:18px 0}.cloud-login222 #controls input{display:block;width:100%;box-sizing:border-box;margin-top:8px}.cloud-login222 #controls button{margin:8px 8px 8px 0}';document.head.append(style);
  document.querySelector('#connection').textContent='Sign in to shared show';
  document.querySelector('#page-title').textContent='Shared show sign in';
  const status=box.querySelector('[role=status]'), setup=box.querySelector('[data-setup]');
  let backedUp;
  await new Promise(resolve=>{
    let busy=false;
    const task=fn=>async e=>{e?.preventDefault();if(busy)return;busy=true;box.setAttribute('aria-busy','true');status.textContent='Connecting…';try{await fn();}catch(error){status.textContent=error.message;}finally{busy=false;box.removeAttribute('aria-busy');}};
    const join=async()=>{const row=await db.head();if(row){status.textContent='Loading shared show…';await sharedRPC({endpoint:'state'});box.remove();document.body.classList.remove('cloud-login222');style.remove();resolve();}else{setup.hidden=readOnly;status.textContent=readOnly?'No shared show for this account. Sign into the same account used by your control panel.':'No shared show yet. Nothing has been replaced or uploaded.';}};
    box.querySelector('form').onsubmit=task(async()=>{const fields=new FormData(box.querySelector('form'));session=null;sessionStorage.removeItem(key);remember(await call('/auth/v1/token?grant_type=password',{email:fields.get('email'),password:fields.get('password')},false));box.querySelector('[name=password]').value='';await join();});
    box.querySelector('[data-backup]').onclick=task(async()=>{
      backedUp=await local({endpoint:'cloud_snapshot'});
      const blob=new Blob([JSON.stringify({...backedUp.state,cloudLibraryBackup:backedUp.library},null,2)],{type:'application/json'});
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='WLD-GitHub-show-before-cloud-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),60000);
      box.querySelector('[data-create]').disabled=false;
      status.textContent='Backup download requested. Keep the file before creating the shared show.';
    });
    box.querySelector('[data-create]').onclick=task(async()=>{if(!backedUp)throw Error('Download your backup first.');await call('/rest/v1/rpc/wld_create_show',{s:backedUp});await join();});
    box.querySelector('[data-join]').onclick=task(join);
    const resume=box.querySelector('[data-continue]');resume.hidden=!session;resume.onclick=task(join);
  });
  const badge=document.createElement('span');badge.textContent='Shared cloud show';badge.title='All devices signed into this show account use the same playlist and controls.';
  document.querySelector('.topbar-right')?.prepend(badge);
  return sharedRPC;
}
