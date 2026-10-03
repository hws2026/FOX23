export const leagues=['NFL','MLB','NBA','MLS','NCAAF','NCAAM','NCAAW'];
export const paths={NFL:'football/nfl',NBA:'basketball/nba',MLS:'soccer/usa.1',MLB:'baseball/mlb',NCAAF:'football/college-football',NCAAM:'basketball/mens-college-basketball',NCAAW:'basketball/womens-college-basketball'};
const text=v=>String(v??'');
function extraData(c,league,live,sit){
 const lines=[];
 if(live&&league==='MLB'&&sit.outs!==undefined)lines.push(`${sit.balls??0} B · ${sit.strikes??0} S · ${sit.outs} OUT`);
 const tv=c.broadcasts?.flatMap(b=>b.names||[]).join(' / ');if(tv)lines.push(tv);
 for(const group of c.leaders||[])for(const lead of (group.leaders||[]).slice(0,1))if(lead.athlete?.shortName&&lead.displayValue)lines.push(`${lead.athlete.shortName} · ${lead.displayValue}`);
 return lines.slice(0,4).join('\n');
}

export function espnGames(data,league){return (data.events||[]).flatMap(e=>{const c=e.competitions?.[0],status=c?.status||e.status;if(!c||!status)return [];const team=side=>{const t=c.competitors.find(x=>x.homeAway===side);if(!t)return null;return{id:text(t.id),name:t.team?.shortDisplayName||t.team?.name||t.team?.abbreviation,abbr:t.team?.abbreviation,logo:t.team?.logo||'',score:status.type?.state==='pre'?'':text(t.score),record:t.records?.find(r=>r.type==='total')?.summary||''};};const away=team('away'),home=team('home');if(!away||!home)return [];const live=status.type?.state==='in',sit=c.situation||{},poss=text(sit.possession);return [{id:league+':'+e.id,espnId:text(e.id),provider:'ESPN',league,away,home,start:e.date,status:status.type?.shortDetail||status.type?.description||'',state:status.type?.state||'pre',possession:live?poss:'',ball:live?text(sit.possessionText):'',down:live?text(sit.downDistanceText):'',detail:extraData(c,league,live,sit)}];});}
export function mlbGames(data){return (data.dates||[]).flatMap(d=>d.games||[]).map(g=>{const live=g.status.abstractGameState==='Live',pre=g.status.abstractGameState==='Preview',l=g.linescore||{};const team=side=>{const t=g.teams[side];return{id:text(t.team.id),name:t.team.teamName||t.team.name,abbr:t.team.abbreviation||t.team.name,logo:`https://www.mlbstatic.com/team-logos/${t.team.id}.svg`,score:pre?'':text(t.score),record:t.leagueRecord?`${t.leagueRecord.wins}-${t.leagueRecord.losses}`:''};};return {id:'MLB:'+g.gamePk,provider:'MLB',league:'MLB',away:team('away'),home:team('home'),start:g.gameDate,state:pre?'pre':live?'in':'post',status:live&&l.currentInning?`${l.inningHalf||''} ${l.currentInningOrdinal||l.currentInning}`:g.status.detailedState,possession:live?text(l.offense?.team?.id):'',ball:'',down:'',detail:live&&l.outs!==undefined?`${l.balls??0} B · ${l.strikes??0} S · ${l.outs??0} OUT${l.offense?.first?' · 1B':''}${l.offense?.second?' · 2B':''}${l.offense?.third?' · 3B':''}`:[g.teams.away.probablePitcher?.fullName,g.teams.home.probablePitcher?.fullName].filter(Boolean).join(' vs ')};});}
export function nbaGames(data){return (data.scoreboard?.games||[]).map(g=>{const team=t=>({id:text(t.teamId),name:t.teamName,abbr:t.teamTricode,logo:'',score:g.gameStatus===1?'':text(t.score),record:t.wins!==undefined?`${t.wins}-${t.losses}`:''});return{id:'NBA:'+g.gameId,provider:'NBA',league:'NBA',away:team(g.awayTeam),home:team(g.homeTeam),start:g.gameTimeUTC,status:g.gameStatus===2?`Q${g.period}  |  ${text(g.gameClock).replace(/^PT(\d+)M([\d.]+)S$/,(_,m,sec)=>m+':'+String(Math.floor(Number(sec))).padStart(2,'0'))}`:g.gameStatusText,state:g.gameStatus===1?'pre':g.gameStatus===2?'in':'post',possession:'',ball:'',down:'',detail:''};});}
async function json(url){const r=await fetch(url,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error(`Feed HTTP ${r.status}`);return r.json();}

export const leagueLabels={NFL:'NFL',MLB:'MLB',NBA:'NBA',MLS:'MLS',NCAAF:'College football',NCAAM:"College basketball · Men",NCAAW:"College basketball · Women"};
const normalized=v=>String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
// Require both teams and a close start time. Never merge ambiguous doubleheaders.
export function mergeGames(primary,secondary){return primary.map(g=>{
 const matches=secondary.filter(other=>other.league===g.league&&Math.abs(Date.parse(g.start)-Date.parse(other.start))<90*60000&&['away','home'].every(side=>['abbr','name'].some(k=>normalized(g[side][k])&&normalized(g[side][k])===normalized(other[side][k]))));
 if(matches.length!==1)return g;const other=matches[0],out={...g,espnId:other.espnId||g.espnId};
 for(const side of ['away','home']){out[side]={...g[side]};for(const k of ['record','logo','name','abbr'])if(!out[side][k]&&other[side][k])out[side][k]=other[side][k];}
 // Fill extra data only when both feeds agree on the game snapshot.
 const aligned=g.state===other.state&&['away','home'].every(side=>g[side].score===other[side].score)&&(g.state!=='in'||g.status===other.status);
 if(aligned){for(const key of ['detail','ball','down'])if(!out[key]&&other[key])out[key]=other[key];if(!out.possession&&other.possession){const side=['away','home'].find(side=>other[side].id===other.possession);if(side)out.possession=out[side].id;}}
 return out;
});}
const summaryCache=new Map();
async function fillRecords(games,league){let cursor=0;await Promise.all(Array.from({length:3},async()=>{while(cursor<games.length){const g=games[cursor++];if(g.away.record&&g.home.record)continue;const id=g.espnId;if(!id)continue;try{let hit=summaryCache.get(league+id);if(!hit||Date.now()-hit.time>60000){hit={time:Date.now(),data:await json('https://site.api.espn.com/apis/site/v2/sports/'+paths[league]+'/summary?event='+id)};summaryCache.set(league+id,hit);}const competitors=hit.data.header?.competitions?.[0]?.competitors||[];for(const side of ['away','home']){const t=competitors.find(t=>t.homeAway===side);const record=t?.record?.find?.(r=>r.type==='total'||r.type==='overall')?.summary||t?.records?.find?.(r=>r.type==='total')?.summary;if(!g[side].record&&record)g[side].record=record;}}catch{ /* Keep unknown records blank. */ }}}));return games;}
export async function fetchLeague(league,date=''){
 if(!paths[league])throw Error('Unknown league');
 const espn=()=>json('https://site.api.espn.com/apis/site/v2/sports/'+paths[league]+'/scoreboard?limit=1000'+(league==='NCAAF'?'&groups=80':'')+(date?'&dates='+date.replaceAll('-',''):'')).then(d=>espnGames(d,league));
 let official=null,label='';
 if(league==='MLB'){label='MLB';official=json('https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=team,linescore,probablePitcher,broadcasts'+(date?'&date='+date:'')).then(mlbGames);}
 if(league==='NBA'&&!date){label='NBA';official=json('https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json').then(nbaGames);}
 const [a,b]=await Promise.allSettled([official||Promise.resolve(null),espn()]);
 const primary=a.status==='fulfilled'?a.value:null,secondary=b.status==='fulfilled'?b.value:null;
 if(!primary&&!secondary)throw Error('Score feeds unavailable');
 const usePrimary=primary?.length, games=usePrimary?mergeGames(primary,secondary||[]):secondary||primary||[];
 await fillRecords(games,league);
 return{games,source:usePrimary?label+(secondary?.length?' + ESPN':' official'):'ESPN'};
}
