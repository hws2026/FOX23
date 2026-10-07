import{paths}from'./scores-data203.js?v=audit232';
const cached=new Map();
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Player stats unavailable');return r.json();}
const number=v=>Number.parseFloat(String(v))||0;
const compact=(labels,values,wanted)=>wanted.map(key=>{const i=labels.indexOf(key);return i>=0&&values[i]!==undefined?`${values[i]} ${key}`:'';}).filter(Boolean).join(' · ');
export function espnPlayerRows(data,league,positions={}){
 const rows=[];
 for(const team of data.boxscore?.players||[]){
  const groups=team.statistics||[],abbr=team.team?.abbreviation||'',make=(group,row,keys)=>({name:row.athlete?.shortName||row.athlete?.displayName||'',team:abbr,text:compact(group.labels||[],row.stats||[],keys),position:row.athlete?.position?.abbreviation||positions[row.athlete?.id]||'',id:String(row.athlete?.id||'')});
  const group=name=>groups.find(g=>g.name===name);
  if(['NFL','NCAAF','UFL'].includes(league)){
   const passing=group('passing'),passers=passing?.athletes||[];
   // Only use an explicit starter or a sole reported passer; never choose a backup by yardage.
   const qb=passers.find(p=>p.starter===true||p.athlete?.starter===true)||(passers.length===1?passers[0]:null);
   if(qb)rows.push({...make(passing,qb,['C/ATT','YDS','TD','INT']),position:'QB'});
   const candidates=[];
   for(const name of ['receiving','rushing']){const g=group(name);for(const player of g?.athletes||[]){const r=make(g,player,name==='receiving'?['REC','YDS','TD']:['CAR','YDS','TD']);if(['WR','RB','HB','FB'].includes(r.position))candidates.push({...r,rank:number(player.stats[g.labels.indexOf('YDS')])});}}
   const used=new Set();for(const row of candidates.sort((a,b)=>b.rank-a.rank)){if(used.has(row.id))continue;rows.push(row);used.add(row.id);if(used.size===2)break;}
   const defense=group('defensive');if(defense?.athletes?.length){const best=[...defense.athletes].sort((a,b)=>number(b.stats[defense.labels.indexOf('TOT')])-number(a.stats[defense.labels.indexOf('TOT')]))[0];rows.push(make(defense,best,['TOT','SACKS','TFL']));}
  }else{
   const candidates=[];for(const g of groups)for(const player of g.athletes||[]){const keys=['NBA','NCAAM','NCAAW'].includes(league)?['PTS','REB','AST','STL','BLK']:league==='MLB'?['H','AB','HR','RBI','IP','K','ER']:['G','A','SH','SOG','SV'];const r=make(g,player,keys);if(r.text)candidates.push({...r,rank:number(player.stats[(g.labels||[]).indexOf(['NBA','NCAAM','NCAAW'].includes(league)?'PTS':'G')])});}
   rows.push(...candidates.sort((a,b)=>b.rank-a.rank).slice(0,3));
  }
 }
 // Some soccer feeds supply individual leaders instead of a player box score.
 if(!rows.length&&!['NFL','NCAAF','UFL'].includes(league))for(const t of data.leaders||[])for(const category of t.leaders||[])for(const lead of (category.leaders||[]).slice(0,1))if(lead.athlete&&lead.displayValue)rows.push({name:lead.athlete.shortName||lead.athlete.displayName,team:t.team?.abbreviation||'',position:lead.athlete.position?.abbreviation||'',text:`${lead.displayValue} ${category.displayName||category.name||''}`});
 return rows.filter(r=>r.name&&r.text).slice(0,8).map(({rank,id,...r})=>r);
}
export function mlbPlayerRows(data){const rows=[];for(const side of ['away','home']){const team=data.liveData?.boxscore?.teams?.[side];if(!team)continue;const players=Object.values(team.players||{}),abbr=team.team?.abbreviation||team.team?.name||'';const pitcher=players.find(p=>String(p.person?.id)===String(team.pitchers?.[0]));if(pitcher?.stats?.pitching){const s=pitcher.stats.pitching;rows.push({name:pitcher.person.fullName,team:abbr,position:'P',text:`${s.inningsPitched} IP · ${s.strikeOuts} K · ${s.earnedRuns} ER`});}for(const p of players.filter(p=>p.stats?.batting&&p.battingOrder).sort((a,b)=>number(b.stats.batting.hits)-number(a.stats.batting.hits)).slice(0,2)){const s=p.stats.batting;rows.push({name:p.person.fullName,team:abbr,position:p.position?.abbreviation||'',text:`${s.hits}-${s.atBats} · ${s.homeRuns} HR · ${s.rbi} RBI`});}}return rows;}
async function positionsFor(teamId,league){const key='roster:'+league+teamId,hit=cached.get(key);if(hit&&Date.now()-hit.time<3600000)return hit.data;const data=await get(`https://site.api.espn.com/apis/site/v2/sports/${paths[league]}/teams/${teamId}/roster`),out={};for(const group of data.athletes||[])for(const a of group.items||[])out[a.id]=a.position?.abbreviation||'';cached.set(key,{time:Date.now(),data:out});return out;}
export async function playerRows(game){
 const hit=cached.get(game.id);if(hit&&Date.now()-hit.time<30000)return hit;
 let rows;const id=game.espnId||game.id.split(':')[1];if(!id||game.state==='pre')return{rows:[],time:Date.now()};
 if(game.league==='MLB'&&game.provider!=='ESPN')rows=mlbPlayerRows(await get(`https://statsapi.mlb.com/api/v1.1/game/${game.id.split(':')[1]}/feed/live`));
 else{const path=paths[game.league];if(!path)return{rows:[],time:Date.now()};const data=await get(`https://site.api.espn.com/apis/site/v2/sports/${path}/summary?event=${id}`);let positions={};if(['NFL','NCAAF','UFL'].includes(game.league)){const all=await Promise.allSettled([game.away.id,game.home.id].map(id=>positionsFor(id,game.league)));for(const r of all)if(r.status==='fulfilled')Object.assign(positions,r.value);}rows=espnPlayerRows(data,game.league,positions);}
 const value={rows,time:Date.now()};cached.set(game.id,value);return value;
}
export async function enrichPlayers(games){let index=0;await Promise.all(Array.from({length:3},async()=>{while(index<games.length){const g=games[index++];try{const r=await playerRows(g);g.players=r.rows;g.playersUpdatedAt=r.time;}catch{g.players=[];g.playersUpdatedAt=0;}}}));return games;}
