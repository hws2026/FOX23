import{zip}from'./zip.js?v=crew111';
import{base}from'./bridge.js?v=crew111';
import{pairingKey}from'./deck-connect.js?v=crew111';
const button=document.createElement('button');button.textContent='Download Stream Deck plugin';button.className='button subtle';document.querySelector('.topbar-right').prepend(button);
button.onclick=async()=>{button.disabled=true;const old=button.textContent;button.textContent='Building installer…';try{
 const r=await fetch(new URL('stream-deck-template.json',base));if(!r.ok)throw Error('Installer assets unavailable');const template=await r.json(),files={};
 for(const [name,encoded] of Object.entries(template))files[name]=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
 files['com.gridiron.studio.sdPlugin/site-config.json']=JSON.stringify({site:base.href,key:pairingKey(),port:18765});
 const blob=zip(files),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Gridiron-Stream-Deck.streamDeckPlugin';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
 alert('Installer downloaded for '+base.href+'\n\nDouble-click it to install in Stream Deck. Replace the old plugin, then click Connect Stream Deck in this panel. Drag Gridiron actions or Configurable control onto your keys. 135 presets and advanced settings are included. Commands use a direct local connection and never open a browser window. Install on the same PC as this control panel. Physical device installation still needs testing on your setup.');
 }catch(e){alert(e.message);}finally{button.disabled=false;button.textContent=old;}};
