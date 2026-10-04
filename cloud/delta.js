// JSON-only differences. Large unchanged photos and rosters stay in the database.
export function changes(before, after, path=[]) {
  if(before===after)return [];
  const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  if(object(before)&&object(after)){
    const out=[];
    for(const key of Object.keys(before))if(!Object.hasOwn(after,key))out.push({path:[...path,key],remove:true});
    for(const key of Object.keys(after))out.push(...changes(before[key],after[key],[...path,key]));
    return out;
  }
  if(JSON.stringify(before)===JSON.stringify(after))return [];
  return [{path,value:after}];
}
export function applyChanges(snapshot, edits) {
  const result=structuredClone(snapshot);
  for(const edit of edits){
    if(!Array.isArray(edit.path)||!edit.path.length||edit.path.some(k=>['__proto__','constructor','prototype'].includes(k)))throw Error('Invalid cloud change path');
    let at=result;
    for(const key of edit.path.slice(0,-1)){if(!Object.hasOwn(at,key))throw Error('Missing cloud change parent');at=at[key];}
    const key=edit.path.at(-1);
    if(edit.remove)delete at[key];else Object.defineProperty(at,key,{value:structuredClone(edit.value),enumerable:true,writable:true,configurable:true});
  }
  return result;
}
