import config from './config.js';
export const cloudEnabled = config.enabled && location.origin === config.origin &&
  new URL('../', import.meta.url).pathname === config.path;

// Serialize this device's requests, and use the database version to arbitrate devices.
export function createSharedRPC(local, db) {
  let tail = Promise.resolve(), version = null, encoded = null;
  async function refresh() {
    const head = await db.head();
    if (!head) throw Error('Shared show is missing. No local data has been uploaded.');
    if (head.version !== version) {
      const row = await db.read();
      if (!row) throw Error('Shared show is missing.');
      await local({endpoint:'cloud_load', snapshot:row.snapshot});
      version = row.version; encoded = JSON.stringify(row.snapshot);
    }
  }
  return request => {
    const task = tail.then(async () => {
      try {
        await refresh();
        const result = await local(request);
        const snapshot = await local({endpoint:'cloud_snapshot'});
        const next = JSON.stringify(snapshot);
        if (next !== encoded) {
          const saved = await db.save(version, snapshot);
          if (saved == null) {
            version = null; await refresh();
            if (request.endpoint === 'action') return {status:409,data:{error:'Another device changed the shared show. Try again.'}};
            return local(request);
          }
          version = saved; encoded = next;
        }
        return result;
      } catch (error) {
        // Never replay an uncertain action (e.g. score +6) or save offline changes later.
        version = null;
        throw Error('Cloud sync unavailable. Action not confirmed; check the shared show before retrying. ' + error.message);
      }
    });
    tail = task.catch(()=>{}); return task;
  };
}

export async function connectCloud(local) {
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
    const response=await fetch(root+path,{method:body===undefined?'GET':'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json',...(authenticated?{Authorization:'Bearer '+session.access_token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
    const data=await response.json();
    if(!response.ok) throw Error(data.msg||data.message||data.error_description||'Cloud request failed');
    return data;
  }
  const db={
    head:async()=> (await call('/rest/v1/wld_shows?select=version&limit=1'))[0],
    read:async()=> (await call('/rest/v1/wld_shows?select=version,snapshot&limit=1'))[0],
    save:(v,s)=>call('/rest/v1/rpc/wld_save_show',{expected_version:v,s}),
  };
  const box=document.createElement('section');box.className='card';
  box.innerHTML='<h2>WLD shared show</h2><p>Sign in with the same show account on every device. Your Desktop/local show stays separate.</p><form><label>Email<input name="email" type="email" autocomplete="username" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button type="submit">Sign in</button></form><div hidden data-setup><p>No shared show exists for this account. On the computer with your existing GitHub playlist, download its backup, then create the shared show. Other devices should wait and use Join.</p><button data-backup>Download this browser’s show backup</button><button data-create disabled>Create shared show from this GitHub playlist</button><button data-join>Join existing shared show</button></div><p role="status"></p>';
  document.querySelector('#controls').replaceChildren(box);
  const status=box.querySelector('[role=status]'), setup=box.querySelector('[data-setup]');
  let backedUp;
  await new Promise(resolve=>{
    let busy=false;
    const task=fn=>async e=>{e?.preventDefault();if(busy)return;busy=true;try{await fn();}catch(error){status.textContent=error.message;}finally{busy=false;}};
    const join=async()=>{const row=await db.head();if(row){box.remove();resolve();}else{setup.hidden=false;status.textContent='No shared show yet. Nothing has been replaced or uploaded.';}};
    box.querySelector('form').onsubmit=task(async()=>{const fields=new FormData(box.querySelector('form'));remember(await call('/auth/v1/token?grant_type=password',{email:fields.get('email'),password:fields.get('password')},false));box.querySelector('[name=password]').value='';await join();});
    box.querySelector('[data-backup]').onclick=task(async()=>{
      backedUp=await local({endpoint:'cloud_snapshot'});
      const blob=new Blob([JSON.stringify({...backedUp.state,cloudLibraryBackup:backedUp.library},null,2)],{type:'application/json'});
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='WLD-GitHub-show-before-cloud-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),60000);
      box.querySelector('[data-create]').disabled=false;
      status.textContent='Backup download requested. Keep the file before creating the shared show.';
    });
    box.querySelector('[data-create]').onclick=task(async()=>{if(!backedUp)throw Error('Download your backup first.');await call('/rest/v1/rpc/wld_create_show',{s:backedUp});await join();});
    box.querySelector('[data-join]').onclick=task(join);
    if(session) task(join)();
  });
  const badge=document.createElement('span');badge.textContent='Shared cloud show';badge.title='All devices signed into this show account use the same playlist and controls.';
  document.querySelector('.topbar-right')?.prepend(badge);
  return createSharedRPC(local,db);
}
