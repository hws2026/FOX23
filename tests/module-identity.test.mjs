import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';

const root=new URL('../',import.meta.url);
const singletonPaths=['panel.js','bridge.js','cloud/sync.js','split-capture238.js','scores-panel203.js','playlist.js','deck-connect.js','stream-playlist208.js','asset-library228.js'];
function graph(html,overrides={}){
 const identities=new Map(),seen=new Set();
 const read=path=>overrides[path]??fs.readFileSync(new URL(path,root),'utf8');
 function visit(url){
  if(url.origin!=='https://test.invalid'||seen.has(url.href))return;
  seen.add(url.href);const path=url.pathname.slice(1);
  if(!path.endsWith('.js'))return;
  const keys=identities.get(path)||new Set();keys.add(url.search);identities.set(path,keys);
  for(const match of read(path).matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)(['"])([^'"\n]+)\1/g)){
   if(match[2].startsWith('.'))visit(new URL(match[2],url));
  }
 }
 for(const tag of read(html).matchAll(/<script\b[^>]*>/g)){
  if(!/type=["']module["']/.test(tag[0]))continue;
  const src=tag[0].match(/src=["']([^"']+)["']/)?.[1];
  if(src)visit(new URL(src,'https://test.invalid/'+html));
 }
 return identities;
}
for(const entry of ['index.html','overlay.html'])test(entry+' loads one instance of each shared controller module',()=>{
 const found=graph(entry);assert.ok(found.size>0);
 for(const path of singletonPaths)if(found.has(path))assert.equal(found.get(path).size,1,path+' has competing versions: '+[...found.get(path)].join(', '));
});
test('controller and both Stream Deck adapters resolve the same panel module',()=>{
 const found=graph('index.html');assert.ok(found.has('deck-connect.js'));assert.ok(found.has('stream-playlist208.js'));
 assert.equal(found.get('panel.js').size,1);
});
test('the import audit detects the stale Stream Deck panel reference that caused duplicate polling',()=>{
 const source=fs.readFileSync(new URL('stream-playlist208.js',root),'utf8');
 const stale=source.replace(/panel\.js\?v=update\d+/,'panel.js?v=stale-test');
 const found=graph('index.html',{'stream-playlist208.js':stale});assert.equal(found.get('panel.js').size,2);
});
