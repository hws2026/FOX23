export function playerTeam(game,row){
 const keys=[row.teamId,row.team].filter(v=>v!=null&&String(v).trim()).map(v=>String(v).trim().toUpperCase());
 return ['away','home'].map(side=>({side,...game[side]})).find(t=>[t.side,t.id,t.abbr,t.name].some(v=>v!=null&&keys.includes(String(v).trim().toUpperCase())));
}
export function playerTeamAbbr(game,row){return playerTeam(game,row)?.abbr||String(row.team||'').trim()||'TEAM';}
export function playerDetailText(game,row){return `${playerTeamAbbr(game,row)} · ${row.name}${row.position?' · '+row.position:''}  |  ${row.text}`;}
export function gameDetails(game,includePlayers=false){
 const finished=game.state==='post',broadcast=String(game.broadcast||'').trim();
 const withoutNetwork=rows=>rows.filter(line=>!finished||!broadcast||String(line).trim()!==broadcast);
 if(game._tickerDetails)return withoutNetwork(game._tickerDetails);
 let status=game.status||'';
 if(game.state==='pre'&&game.start&&!/postpon|cancel|delay|suspend|TBD/i.test(status)){const date=new Date(game.start);if(!isNaN(date))status=date.toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' ET';}
 const details=[status];if(game.state==='in'){if(game.ball)details.push(`BALL ON  |  ${game.ball}`);if(game.down)details.push(game.down);}if(game.detail)details.push(...game.detail.split('\n'));
 if(includePlayers&&Date.now()-Number(game.playersUpdatedAt||0)<90000)for(const row of game.players||[])details.push(playerDetailText(game,row));
 return [...new Set(withoutNetwork(details.filter(Boolean)))];
}
export const readingTime=text=>Math.max(10000,Math.min(60000,4000+String(text).length*140));
export function tickerFrame(games,elapsed,fixedId,includePlayers=false){
 if(!games.length)return null;
 const schedule=games.map(game=>{if(game._titleCard)return{game,details:[''],holds:[4000],duration:4000};const details=gameDetails(game,includePlayers),holds=details.map(readingTime);if(!holds.length){details.push('');holds.push(30000);}const duration=Math.max(30000,holds.reduce((a,b)=>a+b,0));holds[holds.length-1]+=duration-holds.reduce((a,b)=>a+b,0);return{game,details,holds,duration};});
 const fixed=schedule.find(x=>x.game.id===fixedId),total=fixed?.duration||schedule.reduce((n,x)=>n+x.duration,0);let time=Math.max(0,elapsed)%total;
 for(const row of fixed?[fixed]:schedule){if(time>=row.duration){time-=row.duration;continue;}for(let i=0;i<row.holds.length;i++){if(time<row.holds[i])return{game:row.game,detail:row.details[i],slot:i,hold:row.holds[i],remaining:row.holds[i]-time,duration:row.duration};time-=row.holds[i];}}
 return{game:games[0],detail:gameDetails(games[0])[0]||''};
}
