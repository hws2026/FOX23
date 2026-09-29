// Small ZIP STORE writer: installer contents are small and need no compression library.
export function zip(files){
 const encoder=new TextEncoder(),parts=[],central=[];let offset=0;
 const crc=bytes=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;};
 const header=(size,signature)=>{const b=new Uint8Array(size);new DataView(b.buffer).setUint32(0,signature,true);return b;};
 for(const [name,value] of Object.entries(files)){
  const path=encoder.encode(name),data=typeof value==='string'?encoder.encode(value):value,checksum=crc(data);
  const local=header(30,0x04034b50),l=new DataView(local.buffer);l.setUint16(4,20,true);l.setUint16(6,0x0800,true);l.setUint32(14,checksum,true);l.setUint32(18,data.length,true);l.setUint32(22,data.length,true);l.setUint16(26,path.length,true);
  parts.push(local,path,data);const c=header(46,0x02014b50),v=new DataView(c.buffer);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint16(8,0x0800,true);v.setUint32(16,checksum,true);v.setUint32(20,data.length,true);v.setUint32(24,data.length,true);v.setUint16(28,path.length,true);v.setUint32(42,offset,true);central.push(c,path);offset+=30+path.length+data.length;
 }
 const length=central.reduce((n,b)=>n+b.length,0),end=header(22,0x06054b50),e=new DataView(end.buffer);e.setUint16(8,Object.keys(files).length,true);e.setUint16(10,Object.keys(files).length,true);e.setUint32(12,length,true);e.setUint32(16,offset,true);return new Blob([...parts,...central,end],{type:'application/octet-stream'});
}
