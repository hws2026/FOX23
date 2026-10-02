const W=160/3;
export function fieldGraphics(s){const v=s.graphicsVisibility,sign=s.directionOfPlay==='RIGHT'?1:-1,x=s.lineOfScrimmage;const team=s[s.possession+'Team'];const shapes=[];let group="redZone";
const poly=(points,color,opacity)=>shapes.push({id:group,points,color,opacity});
const line=(x,style)=>poly([[x-style.width/2,0],[x+style.width/2,0],[x+style.width/2,W],[x-style.width/2,W]],style.color,style.opacity);
const label=(x,y,text,w=12,h=3.5,color='#ffffff',plate='#122c36')=>shapes.push({id:group,text,fieldX:x,fieldY:y,width:w,height:h,color,plate,opacity:.9,direction:s.directionOfPlay});
if(v.redZone){const a=sign>0?90:10,b=sign>0?110:30;if(v.redZoneMode==='tint')poly([[a,0],[b,0],[b,W],[a,W]],'#de4a48',.18);else if(v.redZoneMode==='line')line(sign>0?90:30,{width:.2,color:'#f16e63',opacity:.8});else label((a+b)/2,38,'RED ZONE',14,4,'#ffb3a7');}
group="los";if(v.los.visible)line(x,{...v.los,color:'#294fae'});group="firstDown";if(v.firstDown.visible)line(s.firstDownPosition,{...v.firstDown,color:'#e5e300'});
group="downDistance";if(v.downDistance){const down=['','1ST','2ND','3RD','4TH'][s.down];shapes.push({id:group,text:`${down} & ${s.goalToGo?'GOAL':s.distance}`,fieldX:Math.max(13,Math.min(107,x-sign*3)),fieldY:10,width:26,height:5,color:team.color,style:'turf',opacity:.48,direction:s.directionOfPlay});}
group="distanceMarkers";if(v.distanceMarkers)for(const distance of [5,10,15,20]){const p=x+sign*distance;if(p>=10&&p<=110)label(p,43,`${distance} YDS`,6,2,'#eef5f9','#1c343e');}
group="fieldGoal";if(v.fieldGoal.visible&&s.fieldGoalRange!==null){line(s.fieldGoalRange,v.fieldGoal);label(s.fieldGoalRange,34,s.fieldGoalLabel,12,3,v.fieldGoal.color);}
group="possession";if(v.possession)label(x,20,`${sign>0?'▶':'◀'}`,4,3,'#ffffff',team.color);
if(v.custom)for(const c of s.customGraphics){group=c.id;if(c.type==='line'){const [a,b]=c.points,dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,n=[-dy/l*c.height/2,dx/l*c.height/2];poly([[a[0]+n[0],a[1]+n[1]],[b[0]+n[0],b[1]+n[1]],[b[0]-n[0],b[1]-n[1]],[a[0]-n[0],a[1]-n[1]]],c.color,c.opacity);}else if(c.type==='polygon')poly(c.points,c.color,c.opacity);else shapes.push({...c,plate:'#102a33',reverse:false});}
return shapes.map(shape=>adjustShape(shape,s.layout?.[shape.id]));}

// Field-space edits remain separate from synchronized game data.
export function adjustShape(shape,edit={}){
 const sx=Math.max(.05,Math.min(4,Number(edit.sx)||1)),sy=Math.max(.05,Math.min(4,Number(edit.sy)||1));
 const dx=Number.isFinite(edit.dx)?edit.dx:0,dy=Number.isFinite(edit.dy)?edit.dy:0;
 if(shape.points?.length){const cx=shape.points.reduce((n,p)=>n+p[0],0)/shape.points.length,cy=shape.points.reduce((n,p)=>n+p[1],0)/shape.points.length;
 return {...shape,points:shape.points.map(([x,y])=>[cx+(x-cx)*sx+dx,cy+(y-cy)*sy+dy])};}
 return {...shape,fieldX:shape.fieldX+dx,fieldY:shape.fieldY+dy,width:shape.width*sx,height:shape.height*sy};
}
export function unproject(h,u,v){
 const a=h[0][0]-u*h[2][0],b=h[0][1]-u*h[2][1],c=u*h[2][2]-h[0][2],d=h[1][0]-v*h[2][0],e=h[1][1]-v*h[2][1],f=v*h[2][2]-h[1][2],det=a*e-b*d;
 if(Math.abs(det)<1e-8)throw Error('Cannot drag at the field horizon.');
 return [(c*e-b*f)/det,(a*f-c*d)/det];
}
