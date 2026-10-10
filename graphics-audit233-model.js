// Pure fixture helpers: no controller, storage, cloud, feed API or media access.
import {gameDetails,readingTime} from './scores-timing209.js?v=update239';
export function mergeFixture(base,patch){
 const out=structuredClone(base);
 for(const [key,value]of Object.entries(patch||{})){
  if(['__proto__','prototype','constructor'].includes(key))continue;
  out[key]=value&&typeof value==='object'&&!Array.isArray(value)?mergeFixture(out[key]&&typeof out[key]==='object'?out[key]:{},value):structuredClone(value);
 }
 return out;
}
export function demoScores233(s,options={},now=Date.now()){
 const team=(side,score)=>({id:side==='away'?'dal':'phi',side,abbr:s.teams[side].abbr,name:s.teams[side].name,record:'5-2',score,color:s.teams[side].color,logo:s.teams[side].logo});
 const nfl={id:'audit-nfl',league:'NFL',state:'in',status:'3rd · 8:42',period:3,quarter:'3RD',clock:'8:42',down:'2nd & 7',ball:'PHI 38',possession:'away',updatedAt:now,playersUpdatedAt:now,away:team('away',17),home:team('home',21),players:[{teamId:'dal',name:'Jordan Ellis',position:'QB',text:'19/27, 248 YDS, 2 TD'},{teamId:'phi',name:'Cameron Davis',position:'QB',text:'17/24, 212 YDS, 1 TD'}]};
 const mlb={id:'audit-mlb',league:'MLB',state:'in',status:'TOP 7 · 2 OUTS',updatedAt:now,away:{id:'nyy',abbr:'NYY',name:'New York Yankees',score:3,record:'81-62',color:'#132448'},home:{id:'bos',abbr:'BOS',name:'Boston Red Sox',score:2,record:'76-67',color:'#bd3039'}};
 const details=gameDetails(nfl,true),holds=details.map(readingTime),total=Math.max(30000,holds.reduce((a,b)=>a+b,0));
 const awayIndex=details.findIndex(x=>x.includes('Jordan Ellis')),homeIndex=details.findIndex(x=>x.includes('Cameron Davis'));
 const at=index=>4000+holds.slice(0,Math.max(0,index)).reduce((a,b)=>a+b,0)+500;
 const elapsed={deck:0,game:4500,away:at(awayIndex),home:at(homeIndex),next:4000+total+500,mlb:8000+total+500}[options.feedSlot]??0;
 return{visible:!!options.bottom,feedBugVisible:!!options.feed,leagues:['NFL','MLB'],league:'ALL',games:[nfl,mlb],playerStats:true,titlesEnabled:true,anchor:now-elapsed,holdAt:now,updatedAt:now,network:'WLD SPORTS',speed:30};
}
export function caseState233(data,entry,options={},now=Date.now()){
 const s=mergeFixture(data.base,entry.statePatch||{}),cue=structuredClone(options.cue||entry.cue);
 if(entry.statePatch?.program?.emptyShow)for(const key of ['teams','lineups','branding','game','program'])if(entry.statePatch[key])s[key]=structuredClone(entry.statePatch[key]);
 // Media choices are inventoried, but the visual fixture never opens hardware,
 // other-origin pages, or the user's saved-media database.
 for(const slot of [1,2]){cue['splitSource'+slot]='none';cue['splitCamera'+slot]='';cue['splitVideo'+slot]='';cue['splitUrl'+slot]='';}
 const motion=options.motion==='fade'?'fade':'auto';cue.transition=motion;cue.outTransition=motion;
 if(options.logos&&!entry.statePatch?.program?.emptyShow){
  Object.assign(s.teams.away,{name:'Dallas Cowboys',shortName:'Cowboys',abbr:'DAL',color:'#003594',secondary:'#b0b7bc',logo:'./broadcast-logos226/teams/DAL.png',heroLogo:'./broadcast-logos226/teams/DAL.png'});
  Object.assign(s.teams.home,{name:'Philadelphia Eagles',shortName:'Eagles',abbr:'PHI',color:'#004c54',secondary:'#a5acaf',logo:'./broadcast-logos226/teams/PHI.png',heroLogo:'./broadcast-logos226/teams/PHI.png'});
 }
 s.branding.gameStart=new Date(now+3600000).toISOString();if(!s.program.emptyShow)s.branding.network='WLD SPORTS';s.branding.networkLogo='';s.branding.secondaryLogo='';s.branding.sponsorLogo='';s.branding.introLogo='';
 s.game.clock.running=false;s.game.playClock.running=false;
 s.preview=cue;s.program={...s.program,graphic:cue,bug:options.mainBug!==false,watermark:false,takeId:1,cueLibrary:{},qbStats:{visible:false},countdown:{visible:false}};
 if(cue.type==='qbstats'||options.sideStats)s.program.qbStats={...(cue.type==='qbstats'?cue:{type:'qbstats',team:'away',sideStatsLayout:'qb',qbName:'Jordan Ellis',qbComp:19,qbAtt:27,qbYards:248,qbTD:2,qbINT:1}),visible:true};
 if(cue.type==='countdown'||options.countdown)s.program.countdown={...cue,type:'countdown',visible:true};
 // Overlay cases intentionally retain the accompanying main graphic from the inventory.
 const independent=entry.statePatch?.program?.graphic;if(independent)s.program.graphic=mergeFixture(cue,independent);
 s.bottomScores=demoScores233(s,options,now);s.serverTime=now/1000;return s;
}
export function updateFixture233(s){
 const n=structuredClone(s),c=n.preview;n.revision=(n.revision||0)+1;
 n.game.scores.away=Number(n.game.scores.away||0)+3;n.game.scores.home=Number(n.game.scores.home||0)+7;n.game.possession=n.game.possession==='home'?'away':'home';n.game.down=n.game.down==='2ND'?'3RD':'2ND';n.game.distance='8';
 c.title=c.title==='UPDATED GRAPHIC'?'ANOTHER UPDATE':'UPDATED GRAPHIC';c.subtitle='CONTENT UPDATE · SAME GRAPHIC';c.spotlightDetail='3 TOUCHDOWNS THIS GAME';c.qbValue=String(Number(c.qbValue||248)+12);c.qbSeasonYards=Number(c.qbSeasonYards||1540)+25;c.qbYards=Number(c.qbYards||248)+12;c.qbDetail='UPDATED GAME STATS';c.reporterName='ALEXANDRIA RICHARDSON';c.refereeName='UPDATED OFFICIAL';c.staffName='UPDATED COACH';c.leftName='KEVIN BURKHARDT';c.rightName=c.rightName==='GREG OLSEN'?'MIKE PEREIRA':'GREG OLSEN';c.newsText='UPDATED INFORMATION FROM AROUND THE LEAGUE';c.featureText='UPDATED FEATURE INFORMATION';c.lowerContextText='UPDATED CONTEXT';c.sponsorPickStat='26/35 · 325 YDS · 3 TD';c.sponsorPickLine='UPDATED GAME PICK';
 if(['offense','defense'].includes(c.type)){c.lineupPhase=c.lineupPhase==='players'?'title':'players';c.lineupGroup=Number(c.lineupGroup||0);}
 if(Array.isArray(c.stats))c.stats=c.stats.map(r=>({...r,away:String((Number(r.away)||0)+7),home:String((Number(r.home)||0)+3)}));
 const p=n.teams[c.team||'away']?.roster.find(p=>p.id===c.playerId);if(p)p.stats={YDS:'325',TD:'3',CMP:'26/35'};
 if(n.program.graphic.type===c.type)n.program.graphic=c;
 if(n.program.qbStats?.visible)n.program.qbStats={...n.program.qbStats,qbYards:Number(n.program.qbStats.qbYards||248)+12};
 n.bottomScores.games.forEach(g=>{g.away.score=Number(g.away.score)+3;g.updatedAt=Date.now();g.playersUpdatedAt=Date.now();});
 return n;
}
