import {scoreWeek,gameInWeek} from './scores-week232.js?v=audit232';
import {playerDetailText} from './scores-timing209.js?v=audit232';
export const leagues=['NFL','MLB','NBA','MLS','NCAAF','NCAAM','NCAAW','UFL'];
export const paths={NFL:'football/nfl',NBA:'basketball/nba',MLS:'soccer/usa.1',MLB:'baseball/mlb',NCAAF:'football/college-football',NCAAM:'basketball/mens-college-basketball',NCAAW:'basketball/womens-college-basketball',UFL:'football/ufl'};
const text=v=>String(v??'');
function extraData(c,league,live,sit,completed){
 const items=[];
 if(live&&league==='MLB'&&sit.outs!==undefined)items.push({line:`${sit.balls??0} B · ${sit.strikes??0} S · ${sit.outs} OUT`});
 const tv=c.broadcasts?.flatMap(b=>b.names||[]).join(' / ')||'';if(tv&&!completed)items.push({line:tv});
 const competitors=c.competitors||[],teams=Object.fromEntries(['away','home'].map(side=>{const t=competitors.find(t=>t.homeAway===side);return [side,{id:text(t?.id||t?.team?.id),abbr:t?.team?.abbreviation||''}];}));
 for(const group of c.leaders||[])for(const lead of (group.leaders||[]).slice(0,1)){
  const name=lead.athlete?.shortName||lead.athlete?.displayName;if(!name||!lead.displayValue)continue;
  // Only provider-supplied team identity associates a leader with an opponent.
  // The player's name is never used to infer a team, including after trades.
  const id=text(lead.team?.id||lead.athlete?.team?.id),abbr=text(lead.team?.abbreviation||lead.athlete?.team?.abbreviation).trim().toUpperCase();
  const matches=competitors.filter(t=>id?[t.id,t.team?.id].some(value=>value!=null&&text(value)===id):abbr&&text(t.team?.abbreviation).trim().toUpperCase()===abbr);
  const team=matches.length===1?matches[0]:null;
  if(team?.team?.abbreviation){
   const row={team:team.team.abbreviation,teamId:text(team.id||team.team.id),name,position:lead.athlete?.position?.abbreviation||'',text:lead.displayValue};
   items.push({line:playerDetailText(teams,row),leader:row});
  }else items.push({line:`${name} · ${lead.displayValue}`});
 }
 const included=items.slice(0,4);
 return {broadcast:tv,detail:included.map(item=>item.line).join('\n'),leaders:included.flatMap(item=>item.leader?[item.leader]:[])};
}

export function espnGames(data,league){return (data.events||[]).flatMap(e=>{const c=e.competitions?.[0],status=c?.status||e.status;if(!c||!status||!Array.isArray(c.competitors))return [];const team=side=>{const t=c.competitors.find(x=>x.homeAway===side);if(!t)return null;return{id:text(t.id),name:t.team?.shortDisplayName||t.team?.name||t.team?.abbreviation,abbr:t.team?.abbreviation,logo:t.team?.logo||'',color:t.team?.color||'',secondary:t.team?.alternateColor||'',score:status.type?.state==='pre'?'':text(t.score),record:t.records?.find(r=>r.type==='total')?.summary||''};};const away=team('away'),home=team('home');if(!away||!home)return [];const live=status.type?.state==='in',sit=c.situation||{},poss=text(sit.possession);return [{id:league+':'+e.id,espnId:text(e.id),provider:'ESPN',league,away,home,start:e.date,status:status.type?.shortDetail||status.type?.description||'',state:status.type?.state||'pre',clock:live?text(status.displayClock):'',period:live?text(status.period):'',quarter:live&&['NFL','NCAAF','UFL','NBA'].includes(league)&&status.period?Number(status.period)>4?'OT':'Q'+text(status.period):'',distance:live?text(sit.distance):'',possession:live?poss:'',ball:live?text(sit.possessionText):'',down:live?text(sit.downDistanceText):'',...extraData(c,league,live,sit,status.type?.state==='post')}];});}
export function mlbGames(data){return (data.dates||[]).flatMap(d=>d.games||[]).map(g=>{const live=g.status.abstractGameState==='Live',pre=g.status.abstractGameState==='Preview',l=g.linescore||{};const team=side=>{const t=g.teams[side];return{id:text(t.team.id),name:t.team.teamName||t.team.name,abbr:t.team.abbreviation||t.team.name,logo:`https://www.mlbstatic.com/team-logos/${t.team.id}.svg`,score:pre?'':text(t.score),record:t.leagueRecord?`${t.leagueRecord.wins}-${t.leagueRecord.losses}`:''};};return {id:'MLB:'+g.gamePk,provider:'MLB',league:'MLB',away:team('away'),home:team('home'),start:g.gameDate,state:pre?'pre':live?'in':'post',status:live&&l.currentInning?`${l.inningHalf||''} ${l.currentInningOrdinal||l.currentInning}`:g.status.detailedState,possession:live?text(l.offense?.team?.id):'',ball:'',down:'',detail:live&&l.outs!==undefined?`${l.balls??0} B · ${l.strikes??0} S · ${l.outs??0} OUT${l.offense?.first?' · 1B':''}${l.offense?.second?' · 2B':''}${l.offense?.third?' · 3B':''}`:[g.teams.away.probablePitcher?.fullName,g.teams.home.probablePitcher?.fullName].filter(Boolean).join(' vs ')};});}
export function nbaGames(data){return (data.scoreboard?.games||[]).map(g=>{const team=t=>({id:text(t.teamId),name:t.teamName,abbr:t.teamTricode,logo:'',score:g.gameStatus===1?'':text(t.score),record:t.wins!==undefined?`${t.wins}-${t.losses}`:''});return{id:'NBA:'+g.gameId,provider:'NBA',league:'NBA',away:team(g.awayTeam),home:team(g.homeTeam),start:g.gameTimeUTC,status:g.gameStatus===2?`Q${g.period}  |  ${text(g.gameClock).replace(/^PT(\d+)M([\d.]+)S$/,(_,m,sec)=>m+':'+String(Math.floor(Number(sec))).padStart(2,'0'))}`:g.gameStatusText,state:g.gameStatus===1?'pre':g.gameStatus===2?'in':'post',clock:g.gameStatus===2?text(g.gameClock).replace(/^PT(\d+)M([\d.]+)S$/,(_,m,sec)=>m+':'+String(Math.floor(Number(sec))).padStart(2,'0')):'',period:text(g.period),quarter:g.gameStatus===2?(Number(g.period)>4?'OT':'Q'+g.period):'',possession:'',ball:'',down:'',detail:''};});}
async function json(url,signal=AbortSignal.timeout(10000)){const r=await fetch(url,{signal});if(!r.ok)throw Error(`Feed HTTP ${r.status}`);return r.json();}

export const leagueLabels={NFL:'NFL',MLB:'MLB',NBA:'NBA',MLS:'MLS',NCAAF:'College football',NCAAM:"College basketball · Men",NCAAW:"College basketball · Women",UFL:'UFL'};
const normalized=v=>String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
function uniqueGames(games){const seen=new Set();return games.filter(game=>{if(!game)return false;if(game.id==null)return true;const key=game.league+'\u0000'+game.id;if(seen.has(key))return false;seen.add(key);return true;});}
function chronological(games){return games.map((game,index)=>({game,index,time:Date.parse(game.start)})).sort((a,b)=>{const left=Number.isFinite(a.time)?a.time:Infinity,right=Number.isFinite(b.time)?b.time:Infinity;return left===right?a.index-b.index:left-right;}).map(row=>row.game);}
function enrichMatch(g,other){const out={...g,espnId:other.espnId||g.espnId,broadcast:g.broadcast||other.broadcast||''};
 for(const side of ['away','home']){out[side]={...g[side]};for(const k of ['record','logo','name','abbr','color','secondary'])if(!out[side][k]&&other[side][k])out[side][k]=other[side][k];}
 // Fill extra data only when both feeds agree on the game snapshot.
 const aligned=g.state===other.state&&['away','home'].every(side=>g[side].score===other[side].score)&&(g.state!=='in'||g.status===other.status);
 if(aligned){if(!out.detail&&other.leaders)out.leaders=other.leaders.map(row=>({...row}));for(const key of ['detail','ball','down','clock','period','quarter','distance'])if(!out[key]&&other[key])out[key]=other[key];if(!out.possession&&other.possession){const side=['away','home'].find(side=>other[side].id===other.possession);if(side)out.possession=out[side].id;}}
 return out;
}
// Union both schedules. Match each event only once, preferring provider identity,
// then exact start time, then a mutually unique close time. A shared team pairing
// alone must never collapse doubleheaders or suppress secondary-only games.
export function mergeGames(primary,secondary){
 const first=uniqueGames(primary),second=uniqueGames(secondary),pairs=new Map(),used=new Set();
 const sameTeams=(g,other)=>other.league===g.league&&['away','home'].every(side=>['abbr','name'].some(k=>normalized(g[side]?.[k])&&normalized(g[side]?.[k])===normalized(other[side]?.[k])));
 const identity=(g,other)=>g.league===other.league&&((g.id!=null&&g.provider===other.provider&&g.id===other.id)||(g.espnId&&other.espnId&&g.espnId===other.espnId));
 const delta=(g,other)=>Math.abs(Date.parse(g.start)-Date.parse(other.start));
 for(const match of [identity,(g,other)=>sameTeams(g,other)&&delta(g,other)===0,(g,other)=>sameTeams(g,other)&&delta(g,other)<90*60000]){
  const candidates=first.map((g,i)=>pairs.has(i)?[]:second.flatMap((other,j)=>!used.has(j)&&match(g,other)?[j]:[]));
  candidates.forEach((matches,i)=>{if(matches.length!==1)return;const j=matches[0];if(candidates.filter(rows=>rows.includes(j)).length===1){pairs.set(i,j);used.add(j);}});
 }
 return chronological([...first.map((g,i)=>pairs.has(i)?enrichMatch(g,second[pairs.get(i)]):g),...second.filter((g,j)=>!used.has(j))]);
}
const ESPN_LIMIT=1000;
async function espnSchedule(league,week){
 const groups=league==='NCAAF'?[80,81]:['NCAAM','NCAAW'].includes(league)?[50]:[null];
 const dates=week.espn;
 const batches=await Promise.all(groups.map(async group=>{
  const base='https://site.api.espn.com/apis/site/v2/sports/'+paths[league]+'/scoreboard?limit='+ESPN_LIMIT+(group?'&groups='+group:'')+(dates?'&dates='+dates:'');
  const records=[],seen=new Set();let page=1;
  for(;;){
   const data=await json(base+(page>1?'&page='+page:'')),events=Array.isArray(data.events)?data.events:[];
   let added=0;for(const event of events){const key=event.id;if(key!=null&&seen.has(key))continue;if(key!=null)seen.add(key);records.push(event);added++;}
   const pagination=data.pagination||data,pageCount=Number(pagination.pageCount||1),reportedCount=Number(pagination.count||pagination.total||0);
   if(page>1&&events.length&&!added)throw Error('Score feed pagination is incomplete');
   if(page<pageCount){if(!added||page>=100)throw Error('Score feed pagination is incomplete');page++;continue;}
   const complete=(reportedCount>0&&records.length>=reportedCount)||(pagination.pageCount!=null&&page>=pageCount);
   if(reportedCount>records.length||(events.length>=ESPN_LIMIT&&!complete))throw Error('Score feed schedule is incomplete');
   return espnGames({events:records},league);
  }
 }));
 return chronological(uniqueGames(batches.flat()));
}
const summaryCache=new Map();
// Records are optional enrichment: one shared deadline bounds the whole slate,
// including body reads, and stops new requests once the budget is exhausted.
async function fillRecords(games,league){
 const signal=AbortSignal.timeout(1500);let cursor=0;
 await Promise.all(Array.from({length:3},async()=>{
  while(cursor<games.length&&!signal.aborted){
   const g=games[cursor++];if(g.away.record&&g.home.record)continue;const id=g.espnId;if(!id)continue;
   try{
    let hit=summaryCache.get(league+id);
    if(!hit||Date.now()-hit.time>60000){
     hit={time:Date.now(),data:await json('https://site.api.espn.com/apis/site/v2/sports/'+paths[league]+'/summary?event='+id,signal)};
     if(signal.aborted)break;
     summaryCache.set(league+id,hit);
    }
    const competitors=hit.data.header?.competitions?.[0]?.competitors||[];
    for(const side of ['away','home']){const t=competitors.find(t=>t.homeAway===side);const record=t?.record?.find?.(r=>r.type==='total'||r.type==='overall')?.summary||t?.records?.find?.(r=>r.type==='total')?.summary;if(!g[side].record&&record)g[side].record=record;}
   }catch{ /* Keep every game, with unknown records blank. */ }
  }
 }));
 return games;
}
export async function fetchLeague(league,date='',now=Date.now()){
 if(!paths[league])throw Error('Unknown league');
 const week=scoreWeek(date,now),espn=()=>espnSchedule(league,week);
 let official=null,label='';
 if(league==='MLB'){label='MLB';official=json('https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=team,linescore,probablePitcher,broadcasts'+'&startDate='+week.start+'&endDate='+week.end).then(mlbGames);}
 if(league==='NBA'&&scoreWeek('',now).start===week.start){label='NBA';official=json('https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json').then(nbaGames);}
 const [a,b]=await Promise.allSettled([official||Promise.resolve(null),espn()]);
 const primary=a.status==='fulfilled'?a.value?.filter(game=>gameInWeek(game,week)):null,secondary=b.status==='fulfilled'?b.value.filter(game=>gameInWeek(game,week)):null;
 if(!primary&&!secondary)throw Error('Score feeds unavailable');
 const usePrimary=primary?.length, games=usePrimary?mergeGames(primary,secondary||[]):chronological(uniqueGames(secondary||primary||[]));
 await fillRecords(games,league);
 return{games,week,source:usePrimary?label+(secondary?.length?' + ESPN':' official'):secondary?'ESPN':label+' official'};
}
