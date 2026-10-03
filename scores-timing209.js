export function gameDetails(game,includePlayers=false){
 if(game._tickerDetails)return game._tickerDetails;
 let status=game.status||'';
 if(game.state==='pre'&&game.start&&!/postpon|cancel|delay|suspend|TBD/i.test(status)){const date=new Date(game.start);if(!isNaN(date))status=date.toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' ET';}
 const details=[status];if(game.state==='in'){if(game.ball)details.push(`BALL ON  |  ${game.ball}`);if(game.down)details.push(game.down);}if(game.detail)details.push(...game.detail.split('\n'));
 if(includePlayers&&Date.now()-Number(game.playersUpdatedAt||0)<90000)for(const row of game.players||[])details.push(`${row.team} · ${row.name}${row.position?' · '+row.position:''}  |  ${row.text}`);
 return [...new Set(details.filter(Boolean))];
}
export const readingTime=text=>Math.max(10000,Math.min(18000,4000+String(text).length*120));
export function tickerFrame(games,elapsed,fixedId,includePlayers=false){
 if(!games.length)return null;
 const schedule=games.map(game=>{const details=gameDetails(game,includePlayers),holds=details.map(readingTime);if(!holds.length){details.push('');holds.push(30000);}const duration=Math.max(30000,holds.reduce((a,b)=>a+b,0));holds[holds.length-1]+=duration-holds.reduce((a,b)=>a+b,0);return{game,details,holds,duration};});
 const fixed=schedule.find(x=>x.game.id===fixedId),total=fixed?.duration||schedule.reduce((n,x)=>n+x.duration,0);let time=Math.max(0,elapsed)%total;
 for(const row of fixed?[fixed]:schedule){if(time>=row.duration){time-=row.duration;continue;}for(let i=0;i<row.holds.length;i++){if(time<row.holds[i])return{game:row.game,detail:row.details[i],slot:i,duration:row.duration};time-=row.holds[i];}}
 return{game:games[0],detail:gameDetails(games[0])[0]||''};
}
