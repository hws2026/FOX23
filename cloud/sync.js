import config from './config.js?v=update238';
import {changes,applyChanges} from './delta.js?v=cloud226';
export function isCloudSite(config, origin, path) {
  return !!config.enabled && [{origin:config.origin,path:config.path},...(config.sites||[])]
    .some(site=>site.origin===origin && site.path===path);
}
export const cloudEnabled = isCloudSite(config,location.origin,new URL('../', import.meta.url).pathname);

// Serialize each controller's requests. Ownership and show edits use the same
// database compare-and-swap, so a yielded controller cannot commit a late action.
export function createSharedRPC(local, db, {readOnly=false,controllerId=null,onControlChange=()=>{},now=Date.now}={}) {
  let tail=Promise.resolve(),version=null,baseline=null,localDirty=false,active=controllerId?false:!readOnly;
  const owns=()=>!readOnly&&(!controllerId||baseline?.state?.cloudControl?.id===controllerId);
  function notify(){const next=owns();if(next!==active){active=next;onControlChange(active);}}
  const yielded=()=>({status:423,data:{code:'CONTROL_YIELDED',error:'Control moved to another session. This page is watching. Choose Take control to use this page again.'}});
  const confirmed=()=>({status:200,data:{...structuredClone(baseline.state),serverTime:now()/1000}});
  function serialize(fn){const task=tail.then(fn);tail=task.catch(()=>{});return task;}
  async function refresh(){
    const head=await db.head();
    if(!head)throw Error('Shared show is missing. No local data has been uploaded.');
    if(head.version!==version||localDirty){
      let row;
      if(baseline&&head.version===version)row={version,snapshot:baseline};
      else if(baseline&&head.version===version+1){
        const patch=db.patch?await db.patch(head.version):head;
        if(patch?.version===head.version&&Array.isArray(patch.last_patch))row={version:head.version,snapshot:applyChanges(baseline,patch.last_patch)};
      }
      row ||= await db.read();if(!row)throw Error('Shared show is missing.');
      localDirty=true;await local({endpoint:'cloud_load',snapshot:row.snapshot});
      version=row.version;baseline=row.snapshot;localDirty=false;
    }
    notify();
  }
  const rpc=request=>serialize(async()=>{
    if(readOnly&&request.endpoint!=='state')throw Error('Cloud output is read-only.');
    try{
      for(let attempt=0;attempt<3;attempt++){
        await refresh();
        if(controllerId&&!owns()){
          if(request.endpoint==='action')return yielded();
          if(request.endpoint==='state')return confirmed();
          localDirty=true;return await local(request); // export/catalog, never save standby timers
        }
        if(!readOnly)localDirty=true;
        let currentRequest=request;
        if(controllerId&&request.endpoint==='action'){
          // Refresh/rebase inside this serialized operation, not in a second
          // browser round trip where a timer or feed poll can change revision.
          const current=await local({endpoint:'state'});
          if(current.status!==200)throw Error('Unable to read the current show.');
          currentRequest={...request,body:{...request.body,revision:current.data.revision}};
        }
        const result=await local(currentRequest);
        if(readOnly)return result;
        if(result.status!==200){
          // This explicit rejection means the action never ran. A timer may
          // have expired between the revision read and action processing.
          if(controllerId&&request.endpoint==='action'&&result.status===409&&attempt<2)continue;
          return result;
        }
        const snapshot=await local({endpoint:'cloud_snapshot'});
        // Restores/reset-show keep the controlling session, while replacing only
        // show content. No metadata from a backup can seize control.
        if(controllerId)snapshot.state.cloudControl=structuredClone(baseline.state.cloudControl);
        const edits=changes(baseline,snapshot);
        if(edits.length){
          const saved=await db.save(version,snapshot,edits);
          if(saved==null){
            await refresh();
            if(controllerId&&!owns())return request.endpoint==='action'?yielded():confirmed();
            // CAS returned null: the attempted edit was definitely not committed.
            if(controllerId&&request.endpoint==='action'&&attempt<2)continue;
            if(request.endpoint==='action')return {status:409,data:{error:'The show changed while applying this command. Refresh and try again.'}};
            return confirmed();
          }
          version=saved;baseline=snapshot;
        }
        localDirty=false;return result;
      }
    }catch(error){
      // A lost response may already have committed. Never replay an uncertain
      // score increment/take, and never upload speculative local edits later.
      const failure=Error((readOnly?'Cloud output reconnecting. ':'Cloud sync unavailable. Action not confirmed; check the shared show before retrying. ')+error.message);
      failure.code=error.code;throw failure;
    }
  });
  Object.defineProperty(rpc,'hasControl',{get:owns});
  rpc.claimControl=()=>serialize(async()=>{
    if(readOnly||!controllerId)throw Error('This connection cannot take control.');
    for(let attempt=0;attempt<3;attempt++){
      await refresh();
      if(owns())return confirmed();
      const snapshot=structuredClone(baseline);
      snapshot.state.cloudControl={id:controllerId,claimedAt:now()};
      // Keep the visible show revision/content unchanged for an ownership-only edit.
      const saved=await db.save(version,snapshot,changes(baseline,snapshot));
      if(saved==null)continue;
      version=saved;baseline=snapshot;localDirty=true;
      await local({endpoint:'cloud_load',snapshot});localDirty=false;notify();return confirmed();
    }
    throw Error('Control changed during handoff. Choose Take control again.');
  });
  return rpc;
}

// Token refresh is shared by concurrent requests. Failed network reads keep the
// refresh token; a rejected token requires an explicit sign-in.
export function createCloudTransport({root,publishableKey,storage=sessionStorage,fetcher=fetch,now=Date.now}) {
  const key='wld-cloud-session:'+root;
  let session, refreshing;
  try { session=JSON.parse(storage.getItem(key)); } catch {}
  const signInRequired=()=>Object.assign(Error('Sign in again to reconnect the shared show.'),{code:'CLOUD_AUTH_REQUIRED'});
  function clear() { session=null;try { storage.removeItem(key); } catch {} }
  function remember(s) {
    if(!s?.access_token || !s.refresh_token || !Number.isFinite(Number(s.expires_in)))
      throw Error('Cloud sign-in returned an incomplete session. Try signing in again.');
    session={...s,expires_at:now()+Number(s.expires_in)*1000};
    try { storage.setItem(key,JSON.stringify(session)); } catch {}
  }
  async function request(path,body,token) {
    const response=await fetcher(root+path,{method:body===undefined?'GET':'POST',cache:'no-store',headers:{apikey:publishableKey,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(body===undefined&&!path.includes('snapshot')?20000:60000)});
    let data;
    try { data=await response.json(); } catch {
      throw Object.assign(Error('Cloud returned an unreadable response (HTTP '+response.status+').'),{status:response.status});
    }
    if(!response.ok)throw Object.assign(Error(data?.msg||data?.message||data?.error_description||'Cloud request failed (HTTP '+response.status+').'),{status:response.status,code:data?.code});
    return data;
  }
  async function refresh() {
    if(refreshing)return refreshing;
    if(!session?.refresh_token)throw signInRequired();
    const previous=session;
    refreshing=(async()=>{
      try {
        const next=await request('/auth/v1/token?grant_type=refresh_token',{refresh_token:previous.refresh_token});
        if(session===previous)remember(next);
      } catch(error) {
        if([400,401,403].includes(error.status)) {
          if(session===previous)clear();
          throw signInRequired();
        }
        throw error;
      } finally { refreshing=null; }
    })();
    return refreshing;
  }
  async function call(path,body,authenticated=true) {
    if(!authenticated)return request(path,body);
    if(!session?.access_token || !Number.isFinite(session.expires_at) || session.expires_at<now()+60000)await refresh();
    const token=session?.access_token;
    if(!token)throw signInRequired();
    try { return await request(path,body,token); }
    catch(error) {
      if(error.status!==401)throw error;
      // An explicit 401 did not execute the action; retry once with a fresh token.
      if(session?.access_token===token)await refresh();
      if(!session?.access_token)throw signInRequired();
      try { return await request(path,body,session.access_token); }
      catch(retryError) {
        if(retryError.status===401){clear();throw signInRequired();}
        throw retryError;
      }
    }
  }
  return {call,remember,clear,get session(){return session;}};
}

export async function connectCloud(local, {readOnly=false}={}) {
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.url) || !config.publishableKey)
    throw Error('Complete cloud/config.js with your Supabase project URL and publishable key.');
  if (config.publishableKey.startsWith('sb_secret_')) throw Error('Use a publishable key, never a secret key.');
  try { if (JSON.parse(atob(config.publishableKey.split('.')[1])).role === 'service_role') throw Error('secret'); }
  catch(e) { if(e.message==='secret') throw Error('Never use a service_role key in this panel.'); }
  const transport=createCloudTransport({root:config.url.replace(/\/$/,''),publishableKey:config.publishableKey});
  const {call,remember}=transport;
  let patches=true;
  const db={
    head:async()=> (await call('/rest/v1/wld_shows?select=version&limit=1'))[0],
    patch:async version=> {
      if(!patches)return null;
      try{return (await call('/rest/v1/wld_shows?select=version,last_patch&version=eq.'+encodeURIComponent(version)+'&limit=1'))[0];}
      catch(error){if(/last_patch/.test(error.message) && [400,404].includes(error.status)){patches=false;return null;}throw error;}
    },
    read:async()=> (await call('/rest/v1/wld_shows?select=version,snapshot&limit=1'))[0],
    save:async(v,s,edits)=> {
      if(patches)try{return await call('/rest/v1/rpc/wld_patch_show',{expected_version:v,edits});}
      catch(error){if(error.code==='PGRST202' && /wld_patch_show/.test(error.message))patches=false;else throw error;}
      return call('/rest/v1/rpc/wld_save_show',{expected_version:v,s});
    },
  };
  let controlBadge,controlButton;
  const controlChanged=active=>{
    if(controlBadge)controlBadge.textContent=active?'You control the shared show':'Watching shared show';
    if(controlButton)controlButton.hidden=active;
    dispatchEvent(new CustomEvent('gridiron-control',{detail:{active}}));
  };
  const sharedRPC=createSharedRPC(local,db,{readOnly,controllerId:readOnly?null:crypto.randomUUID(),onControlChange:controlChanged});
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
    const join=async()=>{const row=await db.head();if(row){status.textContent=readOnly?'Loading shared show…':'Taking control of shared show…';if(!readOnly)await sharedRPC.claimControl();await sharedRPC({endpoint:'state'});box.remove();document.body.classList.remove('cloud-login222');style.remove();resolve();}else{setup.hidden=readOnly;status.textContent=readOnly?'No shared show for this account. Sign into the same account used by your control panel.':'No shared show yet. Nothing has been replaced or uploaded.';}};
    box.querySelector('form').onsubmit=task(async()=>{const fields=new FormData(box.querySelector('form'));transport.clear();remember(await call('/auth/v1/token?grant_type=password',{email:fields.get('email'),password:fields.get('password')},false));box.querySelector('[name=password]').value='';await join();});
    box.querySelector('[data-backup]').onclick=task(async()=>{
      backedUp=await local({endpoint:'cloud_snapshot'});
      const blob=new Blob([JSON.stringify({...backedUp.state,cloudLibraryBackup:backedUp.library},null,2)],{type:'application/json'});
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='WLD-GitHub-show-before-cloud-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),60000);
      box.querySelector('[data-create]').disabled=false;
      status.textContent='Backup download requested. Keep the file before creating the shared show.';
    });
    box.querySelector('[data-create]').onclick=task(async()=>{if(!backedUp)throw Error('Download your backup first.');await call('/rest/v1/rpc/wld_create_show',{s:backedUp});await join();});
    box.querySelector('[data-join]').onclick=task(join);
    const resume=box.querySelector('[data-continue]');resume.hidden=!transport.session;resume.onclick=task(join);
  });
  if(!readOnly){
    const holder=document.createElement('span');holder.style.cssText='display:inline-flex;gap:8px;align-items:center';
    controlBadge=document.createElement('span');controlBadge.setAttribute('role','status');
    controlButton=document.createElement('button');controlButton.type='button';controlButton.textContent='Take control';
    controlButton.onclick=async()=>{
      controlButton.disabled=true;
      try{await sharedRPC.claimControl();controlChanged(sharedRPC.hasControl);}
      catch(error){controlBadge.textContent=error.message;}
      finally{controlButton.disabled=false;}
    };
    holder.append(controlBadge,controlButton);document.querySelector('.topbar-right')?.prepend(holder);
    controlChanged(sharedRPC.hasControl);
  }
  return sharedRPC;
}
