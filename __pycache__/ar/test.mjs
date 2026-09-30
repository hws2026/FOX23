import assert from 'node:assert/strict';
import{readFile}from'node:fs/promises';
const load=async name=>import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL(name,import.meta.url))).toString('base64'));
const {calibrate,project,position,broadcast,demoPoints}=await load('./math.js');
const {h,error}=calibrate(demoPoints);assert.ok(error<.00001);for(const p of demoPoints){const q=project(h,...p.field);assert.ok(Math.hypot(q[0]-p.image[0],q[1]-p.image[1])<.001);}
assert.throws(()=>calibrate(demoPoints.slice(0,3)));assert.throws(()=>calibrate(Array(4).fill(demoPoints[0])));
assert.equal(position('OWN 20','RIGHT'),30);assert.equal(position('OWN 20','LEFT'),90);assert.equal(position('OPP 20','LEFT'),30);assert.throws(()=>position('OWN 80','LEFT'));
assert.equal(broadcast({ballPosition:90,directionOfPlay:'LEFT',distance:10}).firstDownPosition,80);
assert.equal(broadcast({ballPosition:15,directionOfPlay:'LEFT',distance:10}).firstDownPosition,10);
const {fieldGraphics}=await load('./graphics.js');const base={graphicsVisibility:{los:{visible:true,width:.2,color:'#ff0000',opacity:1},firstDown:{visible:true,width:.2,color:'#ff0000',opacity:1},fieldGoal:{visible:false},downDistance:true,custom:true},lineOfScrimmage:45,firstDownPosition:55,directionOfPlay:'LEFT',possession:'home',homeTeam:{color:'#123456'},down:2,distance:10,customGraphics:[{type:'logo',image:'data:image/png;base64,AA',points:[],fieldX:60,fieldY:20,width:10,height:4}]};const shapes=fieldGraphics(base);assert.equal(shapes[0].color,'#294fae');assert.equal(shapes[1].color,'#e5e300');assert.equal(shapes[2].style,'turf');assert.ok(shapes.some(s=>s.image));
console.log('PASS: browser calibration, bad points, football directions, fixed line colors, custom shapes');
