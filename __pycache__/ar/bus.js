const name='wld-ar-local:'+new URL('.',import.meta.url).pathname;
const channel=new BroadcastChannel(name);let last=null;const listeners=new Set();
channel.onmessage=e=>{if(e.data?.request){if(last)channel.postMessage(last);return;}if(e.data?.cameras){last=e.data;for(const fn of listeners)fn(last);}};
export function publish(value){last=value;for(const fn of listeners)fn(value);channel.postMessage(value);}
export function connect(fn){listeners.add(fn);if(last)fn(last);channel.postMessage({request:true});return {close(){listeners.delete(fn);}};}
