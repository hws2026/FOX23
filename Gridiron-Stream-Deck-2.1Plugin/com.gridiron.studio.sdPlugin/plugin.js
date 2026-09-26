const WebSocket=require('ws');
const crypto=require('node:crypto');
function createBridge(config,feedback=()=>{}){
 const origin=new URL(config.site).origin;
 const server=new WebSocket.WebSocketServer({host:'127.0.0.1',port:config.port??18765,maxPayload:65536});
 const clients=new Set(),pending=new Map();let controller;
 server.on('error',error=>console.error('Gridiron bridge:',error.message));
 server.on('connection',(client,req)=>{
  if(req.headers.origin!==origin){client.close(1008,'Site not allowed');return;}
  const timer=setTimeout(()=>client.close(1008,'Authentication required'),4000);clients.add(client);
  client.on('message',raw=>{try{
   const message=JSON.parse(raw);
   if(!client.authenticated){
    const got=Buffer.from(String(message.key||'')),expected=Buffer.from(String(config.key||''));
    if(message.type!=='hello'||expected.length<32||got.length!==expected.length||!crypto.timingSafeEqual(got,expected)||message.site!==config.site){client.close(1008,'Pairing mismatch');return;}
    if(controller&&controller.readyState===WebSocket.OPEN){client.close(1008,'Controller already connected');return;}
    clearTimeout(timer);client.authenticated=true;controller=client;client.send(JSON.stringify({type:'ready',controls:Object.keys(require('./deck-controls.json')).length}));return;
   }
   if(message.type==='ack'){
    const item=pending.get(message.id);if(!item)return;clearTimeout(item.timer);pending.delete(message.id);feedback(item.context,!message.error,message.error);
   }
  }catch{client.close(1008,'Invalid message');}});
  client.on('close',()=>{clearTimeout(timer);clients.delete(client);if(controller===client)controller=null;});
  client.on('error',()=>{});
 });
 function dispatch(spec,context){
  if(!controller||controller.readyState!==WebSocket.OPEN){feedback(context,false,'Open and connect the control panel');return;}
  const id=crypto.randomUUID();const timer=setTimeout(()=>{pending.delete(id);feedback(context,false,'No acknowledgement; check the show before retrying');},8000);
  pending.set(id,{context,timer});controller.send(JSON.stringify({type:'command',id,spec}));
 }
 function close(){for(const p of pending.values())clearTimeout(p.timer);for(const c of clients)c.terminate();return new Promise(resolve=>server.close(resolve));}
 return {server,dispatch,close};
}
function start(){
 const config=require('./site-config.json'),mapping=require('./commands.json'),catalog=require('./deck-controls.json');
 const args={};for(let i=2;i<process.argv.length;i+=2)args[process.argv[i]]=process.argv[i+1];
 const socket=new WebSocket('ws://127.0.0.1:'+args['-port']);
 const send=message=>{if(socket.readyState===WebSocket.OPEN)socket.send(JSON.stringify(message));};
 const bridge=createBridge(config,(context,ok)=>send({event:ok?'showOk':'showAlert',context}));
 socket.on('open',()=>send({event:args['-registerEvent'],uuid:args['-pluginUUID']}));
 socket.on('message',raw=>{try{
  const message=JSON.parse(raw);if(message.event!=='keyDown')return;
  const settings=message.payload?.settings||{};let spec;
  if(settings.command==='custom'||catalog[settings.command]?.advanced){
   const action=settings.action||catalog[settings.command]?.action;if(!require('./api-actions.json').includes(action))throw Error('Choose an action');
   const payload=JSON.parse(settings.payload||'{}');if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('Payload must be an object');
   spec={action,payload};
  }else spec=catalog[settings.command||mapping[message.action]||'take'];
  if(!spec)throw Error('Unknown control');spec=JSON.parse(JSON.stringify(spec));if(spec.parameter){const v=settings.value??spec.parameter.default;const value=spec.parameter.type==='number'?Number(v):String(v);if(typeof value==='number'&&!Number.isFinite(value))throw Error('Enter a numeric value');spec.payload[spec.parameter.field]=value;delete spec.parameter;}if(settings.overrides){const target=spec.cue||spec.payload||{};Object.assign(target,settings.overrides);if(spec.cue)spec.cue=target;else spec.payload=target;}if(spec.mode==='graphic'&&settings.behavior==='select')spec.mode='select';bridge.dispatch(spec,message.context);
 }catch(error){const message=JSON.parse(raw);send({event:'showAlert',context:message.context});console.error(error.message);}});
 socket.on('error',error=>console.error(error.message));
 socket.on('close',()=>bridge.close());
}
module.exports={createBridge,start};if(require.main===module)start();
