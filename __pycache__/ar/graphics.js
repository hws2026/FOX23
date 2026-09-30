const W=160/3;
export function fieldGraphics(s){const v=s.graphicsVisibility,sign=s.directionOfPlay==='RIGHT'?1:-1,x=s.lineOfScrimmage;const team=s[s.possession+'Team'];const shapes=[];
const poly=(points,color,opacity)=>shapes.push({points,color,opacity});
const line=(x,style)=>poly([[x-style.width/2,0],[x+style.width/2,0],[x+style.width/2,W],[x-style.width/2,W]],style.color,style.opacity);
const label=(x,y,text,w=12,h=3.5,color='#ffffff',plate='#122c36')=>shapes.push({text,fieldX:x,fieldY:y,width:w,height:h,color,plate,opacity:.9,direction:s.directionOfPlay});
if(v.redZone){const a=sign>0?90:10,b=sign>0?110:30;if(v.redZoneMode==='tint')poly([[a,0],[b,0],[b,W],[a,W]],'#de4a48',.18);else if(v.redZoneMode==='line')line(sign>0?90:30,{width:.2,color:'#f16e63',opacity:.8});else label((a+b)/2,38,'RED ZONE',14,4,'#ffb3a7');}
if(v.los.visible)line(x,{...v.los,color:'#294fae'});if(v.firstDown.visible)line(s.firstDownPosition,{...v.firstDown,color:'#e5e300'});
if(v.downDistance){const down=['','1ST','2ND','3RD','4TH'][s.down];shapes.push({text:`${down} & ${s.goalToGo?'GOAL':s.distance}`,fieldX:Math.max(13,Math.min(107,x-sign*3)),fieldY:10,width:26,height:5,color:team.color,style:'turf',opacity:.48,direction:s.directionOfPlay});}
if(v.distanceMarkers)for(const distance of [5,10,15,20]){const p=x+sign*distance;if(p>=10&&p<=110)label(p,43,`${distance} YDS`,6,2,'#eef5f9','#1c343e');}
if(v.fieldGoal.visible&&s.fieldGoalRange!==null){line(s.fieldGoalRange,v.fieldGoal);label(s.fieldGoalRange,34,s.fieldGoalLabel,12,3,v.fieldGoal.color);}
if(v.possession)label(x,20,`${sign>0?'▶':'◀'}`,4,3,'#ffffff',team.color);
if(v.custom)for(const c of s.customGraphics){if(c.type==='line'){const [a,b]=c.points,dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,n=[-dy/l*c.height/2,dx/l*c.height/2];poly([[a[0]+n[0],a[1]+n[1]],[b[0]+n[0],b[1]+n[1]],[b[0]-n[0],b[1]-n[1]],[a[0]-n[0],a[1]-n[1]]],c.color,c.opacity);}else if(c.type==='polygon')poly(c.points,c.color,c.opacity);else shapes.push({...c,plate:'#102a33',reverse:false});}
return shapes;}
