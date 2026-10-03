import {position} from './math.js';
export function gameFields(packet){
 const g=packet.game,t=packet.teams;if(!g||!t?.home||!t?.away)throw Error('Waiting for main panel game data');
 const direction=g.arDirection==='LEFT'?'LEFT':'RIGHT';
 let ball=String(g.ballOn??'').trim().toUpperCase();if(/^\d+(\.\d+)?$/.test(ball)&&ball!=='50')ball=(g.arTerritory==='OPP'?'OPP':'OWN')+' '+ball;
 const ballPosition=position(ball,direction),down=parseInt(g.down),distance=String(g.distance).toUpperCase()==='GOAL'?(direction==='RIGHT'?110-ballPosition:ballPosition-10):Number(g.distance);
 if(!Number.isFinite(distance)||distance<0||distance>100)throw Error('Set a valid distance in the main panel');
 return {possession:g.possession,directionOfPlay:direction,down:Number.isFinite(down)?down:1,distance,ballPosition,homeTeam:{...t.home},awayTeam:{...t.away},fieldGoalRange:g.arFieldGoal?position(g.arFieldGoal,direction):null,gameDataValid:['home','away'].includes(g.possession)&&down>=1&&down<=4};
}
