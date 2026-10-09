import {scoreWeek,leagueScoreWeek,scoreWeekLabel,gameInWeek} from './scores-week232.js?v=update238';
import{leagueLabels as cardLabels,leagueNetwork}from'./scores-titles219.js?v=update238';
import{enrichPlayers}from'./scores-players208.js?v=update238';
import{leagues,leagueLabels,fetchLeague,selectedFeedLeagues}from'./scores-data203.js?v=update238';
export function createScores({getState,act,esc,toast,canControl=()=>true}){
 let busy=false,last=0,lastKey='',queued=false,statsEnabled=false;
 const cfg=()=>getState()?.bottomScores||{league:'NFL',games:[]};
 const selected=selectedFeedLeagues;
 const key=(c,now=Date.now())=>`${c.date?'date:'+c.date:'current'}:${selected(c).map(league=>{const w=leagueScoreWeek(league,c.date||'',now);return league+':'+w.start+':'+w.end;}).join(',')}`;
 const weekLabel=c=>c.date?'Selected calendar week · '+scoreWeekLabel(scoreWeek(c.date))+' · Pinned to '+c.date+' · Eastern Time':[
  selected(c).includes('NFL')?'NFL · Tuesday–Monday · '+scoreWeekLabel(leagueScoreWeek('NFL')):null,
  selected(c).some(l=>l!=='NFL')?'Other selected leagues · Monday–Sunday · '+scoreWeekLabel(scoreWeek()):null
 ].filter(Boolean).join(' / ')+' · Current week · Eastern Time';
 const dateLabel=g=>{const date=new Date(g.start);return Number.isFinite(date.getTime())?date.toLocaleString('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' ET':'Time TBD';};
 const feedGames=c=>(c.games||[]).filter(g=>selected(c).includes(g.league));
 const gameOptions=c=>{
  const games=feedGames(c),chosen=c.feedBugGameId||'';
  return `<option value="">Follow the current bottom-scores game</option>${chosen&&!games.some(g=>g.id===chosen)?`<option value="${esc(chosen)}">Selected game unavailable · ${esc(chosen)}</option>`:''}${games.map(g=>`<option value="${esc(g.id)}">${esc(leagueLabels[g.league]||g.league)} · ${esc(g.away.name)} at ${esc(g.home.name)} · ${esc(dateLabel(g))} · ${esc(g.status)}</option>`).join('')}`;
 };
 async function refresh(){
  if(!canControl())return;
  if(busy){queued=true;return;}
  const before=cfg(),wanted=selected(before),date=before.date||'',now=Date.now();let weeks,requestKey;
  try{weeks=Object.fromEntries(wanted.map(league=>[league,leagueScoreWeek(league,date,now)]));requestKey=key(before,now);}catch(error){status(error.message);return;}
  // Freeze the mode and each league's week while feeds or player details await.
  busy=true;last=Date.now();lastKey=requestKey;status('Updating feeds…');
  try{
   const results=await Promise.allSettled(wanted.map(l=>fetchLeague(l,date,now)));if(!canControl()||requestKey!==key(cfg()))return;
   let games=[],sources={},errors=[];
   results.forEach((r,i)=>{const league=wanted[i];if(r.status==='fulfilled'){games.push(...r.value.games.map(g=>({...g,updatedAt:Date.now()})));sources[league]=r.value.source;}else{games.push(...(before.games||[]).filter(g=>g.league===league&&gameInWeek(g,weeks[league])));errors.push(league+' unavailable');sources[league]=before.sources?.[league]||'';}});
   await act('bottom_scores',{games,sources,error:errors.join(' · '),updatedAt:Date.now()});
   if(cfg().playerStats){await enrichPlayers(games);if(canControl()&&requestKey===key(cfg()))await act('bottom_scores',{games});}
  }catch(e){status(e.message);}finally{busy=false;sync();if(queued){queued=false;refresh();}}
 }
 function status(message){const el=document.querySelector('#scores203-status');if(el)el.textContent=message;}
 function sync(){
  const c=cfg();
  const weekNote=document.querySelector('#scores232-week');if(weekNote)weekNote.textContent=weekLabel(c);
  const current=document.querySelector('#scores238-current');if(current){current.setAttribute('aria-pressed',String(!c.date));current.textContent=c.date?'Current week':'Current week · active';}
  if(busy)return;
  status(`BOTTOM SCORES ${c.visible?'ON':'OFF'} · FEED SCOREBUG ${c.feedBugVisible?'ON':'OFF'} · ${c.error||'Feeds ready'} · ${feedGames(c).length} games${c.updatedAt?' · Checked '+new Date(c.updatedAt).toLocaleTimeString():''} · ${Object.entries(c.sources||{}).filter(([l])=>selected(c).includes(l)).map(([l,s])=>l+': '+feedGames(c).filter(g=>g.league===l).length+' games · '+s).join(' / ')}`);
  const list=document.querySelector('#scores203-games');if(list)list.innerHTML=feedGames(c).map(g=>`<p><b>${esc(g.league)}</b> · ${esc(g.away.name)} ${esc(g.away.score)} — ${esc(g.home.score)} ${esc(g.home.name)} <small>${esc(dateLabel(g))} · ${esc(g.status)}</small></p>`).join('')||'<p>No games loaded yet.</p>';
  const show=document.querySelector('#scores203-show');if(show)show.textContent=c.visible?'Hide bottom scores':'Show bottom scores';
  const hold=document.querySelector('#scores203-hold');if(hold)hold.textContent=c.holdAt?'Resume rotation':'Hold current game';
  const feedShow=document.querySelector('#scores224-feed-show');if(feedShow){feedShow.textContent=c.feedBugVisible?'Hide feed scorebug':'Show feed scorebug';feedShow.setAttribute('aria-pressed',String(!!c.feedBugVisible));}
  const choice=document.querySelector('#scores224-feed-game');if(choice){const options=gameOptions(c);if(choice._options!==options){choice.innerHTML=options;choice._options=options;}choice.value=c.feedBugGameId||'';}
  const note=document.querySelector('#scores224-feed-status');if(note)note.textContent=c.feedBugGameId?(feedGames(c).some(g=>g.id===c.feedBugGameId)?'Pinned to the selected feed game. Scores update with each refresh.':'The selected game is unavailable in the loaded schedule. Choose another game or follow the rotation.'):'Follows the same game rotation, including while the bottom ticker is hidden. Holds the last game during league cards, then changes when the next game begins.';
 }
 setInterval(()=>{
  if(!canControl()){sync();return;}
  const c=cfg();if(c.playerStats&&!statsEnabled){statsEnabled=true;refresh();}else statsEnabled=!!c.playerStats;
  if((c.visible||c.feedBugVisible)&&c.auto!==false&&(key(c)!==lastKey||Date.now()-last>=30000))refresh();sync();
 },1000);
 function view(){
  const c=cfg();return `<div class="section-title"><h2>Bottom score updates</h2><p>Choose leagues, rotate their scores, and control a separate feed scorebug.</p></div><article class="card"><div class="form-grid"><div><span>Leagues</span><details class="scores-league-picker" open><summary>Choose leagues · ${selected(c).length} selected</summary><div style="display:flex;flex-wrap:wrap;gap:8px;padding:12px 0">${leagues.map(l=>`<label style="border:1px solid #64748b;border-radius:18px;padding:7px 12px;cursor:pointer"><input type="checkbox" name="score-league211" value="${l}" ${selected(c).includes(l)?'checked':''}> ${leagueLabels[l]}</label>`).join('')}</div><button type="button" id="scores211-all">Select all leagues</button></details></div><label>Week containing (blank = current week)<input id="scores203-date" type="date" value="${esc(c.date||'')}"></label><button type="button" id="scores238-current" aria-pressed="${!c.date}">${c.date?'Current week':'Current week · active'}</button><label>Updates<select id="scores203-auto"><option value="on" ${c.auto!==false?'selected':''}>Automatic · every 30 seconds</option><option value="off" ${c.auto===false?'selected':''}>Manual refresh</option></select></label></div><p class="help" id="scores232-week">${esc(weekLabel(c))}</p><p class="help">Current week follows the NFL slate from Tuesday through Monday, including Thursday and Monday night games. Other leagues follow Monday–Sunday. Selecting a date pins its Monday–Sunday calendar week until you choose Current week again. All dates use Eastern Time. Selected leagues play in the order above. All selected league cards appear first. Every game and available detail in the first league plays, then the full deck returns: the completed league slides out and the next league slides in. This repeats through all selected leagues.</p><details><summary>Title cards · customize text and order</summary><label><input type="checkbox" id="scores213-titles" ${c.titlesEnabled!==false?'checked':''}> Show title decks at the start and before league changes</label>${leagues.map(l=>`<details style="margin:10px 0"><summary>${esc(leagueLabels[l])} · network and title card</summary><label>Network assigned to ${esc(leagueLabels[l])}<input data-network-league="${l}" maxlength="40" value="${esc(leagueNetwork(c,l,getState()?.branding))}" placeholder="WLD SPORTS"></label><label>${esc(leagueLabels[l])} labels · one per line<textarea data-title-league="${l}" rows="4">${esc(cardLabels(c,l).join('\n'))}</textarea></label></details>`).join('')}<p class="help">Each league has its own complete title box and network assignment. Lines appear left to right. Move a line to change its order. Use {league} for the current league or {network} for the network assigned above. You can also use {nfl}, {mlb}, {nba}, {mls}, or {ufl}. Each label can contain up to 40 characters. The left league identifier stays visible.</p><button type="button" id="scores213-save">Save title cards</button><p id="scores213-feedback" role="status"></p></details><label><input type="checkbox" id="scores209-players" ${c.playerStats?'checked':''}> Include player statistics</label><p class="help">NFL / UFL: reported starting/sole QB, two WR/RB leaders, then defense for each team. Unavailable player data is skipped. Other leagues show reported player leaders. Player data may arrive after scores.</p><div class="scores203-actions"><button id="scores203-show" class="primary">${c.visible?'Hide':'Show'} bottom scores</button><button id="scores203-refresh">Refresh scores</button><button id="scores203-hold">${c.holdAt?'Resume rotation':'Hold current game'}</button></div><p id="scores203-status" role="status"></p><p class="help">MLB and NBA combine matched league and ESPN feeds when available. NFL, UFL and MLS use ESPN, with game-summary record lookups when needed. All scheduled matchups in each selected league’s week are included, including MLB doubleheaders. The on-air league label identifies each category as it rotates. Each game stays at least 30 seconds. Each data item gets at least 10 seconds, with extra time for longer text; all available details finish before the next game. NFL possession and ball location, and MLB count/base information appear when provided. Feeds can lag the broadcast; after 90 seconds without fresh game data, possession is hidden and the strip says UPDATES DELAYED. Keep this controller open for automatic refresh.</p></article><article class="card"><h3>Feed scorebug</h3><p>Show a duplicate of your main scorebug using the same selected-league games. It appears at the bottom center above the scores strip with the original rails, team gradients and entrance/exit animations. Matchups, teams and scores update under a quick light sweep. Its visibility is independent of the bottom ticker and your main scorebug.</p><label>Game<select id="scores224-feed-game">${gameOptions(c)}</select></label><p id="scores224-feed-status" class="help" role="status"></p><div class="scores203-actions"><button id="scores224-feed-show" class="primary" aria-pressed="${!!c.feedBugVisible}">${c.feedBugVisible?'Hide':'Show'} feed scorebug</button></div><p class="help">Shows team logos, scores, game status, and reported period, clock, down/distance, and possession when available. Automatic refresh runs while either output is shown. Feed clocks update from the provider and may lag the live broadcast.</p><details><summary>Feed scorebug logos</summary><p class="help">NFL teams use your assigned broadcast logos. MLB uses your supplied broadcast logos while preserving custom assignments. Teams without a supplied logo and other leagues use their score-feed logos. Team initials appear if a logo is unavailable. Alternate logo filenames are kept separately so future uploads can be assigned without replacing the originals.</p></details></article><article class="card"><h3>Loaded feed games</h3><div id="scores203-games" class="scores203-list"></div></article>`;
 }
 function bind(root){
  const guard=fn=>(...args)=>Promise.resolve().then(()=>fn(...args)).catch(e=>toast(e.message,true));
  root.querySelector('#scores213-save').onclick=async()=>{
   const feedback=root.querySelector('#scores213-feedback'),enabled=root.querySelector('#scores213-titles').checked,leagueTitleCards={},leagueNetworks={};
   for(const field of root.querySelectorAll('[data-network-league]'))leagueNetworks[field.dataset.networkLeague]=field.value.trim();
   for(const field of root.querySelectorAll('[data-title-league]')){const labels=field.value.split('\n').map(t=>t.trim()).filter(Boolean);if(!labels.length||labels.length>6||labels.some(t=>t.length>40)){feedback.textContent=leagueLabels[field.dataset.titleLeague]+': enter one to six labels, each 40 characters or fewer.';return;}leagueTitleCards[field.dataset.titleLeague]=labels;}
   try{await act('bottom_scores',{leagueTitleCards,leagueNetworks,titlesEnabled:enabled});feedback.textContent='Title cards saved separately for every league.';}catch(e){feedback.textContent=e.message;}
  };
  root.querySelector('#scores209-players').onchange=guard(async e=>{await act('bottom_scores',{playerStats:e.target.checked});if(cfg().playerStats)refresh();});
  const scheduleChange=async()=>{await act('bottom_scores',{league:'ALL',leagues:[...root.querySelectorAll('[name=score-league211]:checked')].map(el=>el.value),date:root.querySelector('#scores203-date').value,games:[],sources:{},error:'',updatedAt:0,anchor:Date.now(),holdAt:0});sync();await refresh();};
  for(const box of root.querySelectorAll('[name=score-league211]'))box.onchange=guard(async()=>{if(!root.querySelector('[name=score-league211]:checked')){box.checked=true;toast('Keep at least one league selected.');return;}root.querySelector('.scores-league-picker summary').textContent='Choose leagues · '+root.querySelectorAll('[name=score-league211]:checked').length+' selected';await scheduleChange();});
  root.querySelector('#scores211-all').onclick=guard(async()=>{root.querySelectorAll('[name=score-league211]').forEach(el=>el.checked=true);root.querySelector('.scores-league-picker summary').textContent='Choose leagues · '+leagues.length+' selected';await scheduleChange();});
  root.querySelector('#scores203-date').onchange=guard(scheduleChange);
  root.querySelector('#scores238-current').onclick=guard(async()=>{
   const input=root.querySelector('#scores203-date'),previous=input.value;input.value='';
   try{await scheduleChange();}catch(error){input.value=previous;throw error;}
  });
  root.querySelector('#scores203-auto').onchange=guard(async e=>{await act('bottom_scores',{auto:e.target.value==='on'});if(cfg().auto&&(cfg().visible||cfg().feedBugVisible))refresh();});
  root.querySelector('#scores203-refresh').onclick=refresh;
  root.querySelector('#scores203-show').onclick=guard(async()=>{const visible=!cfg().visible;await act('bottom_scores',{visible,...(visible?{anchor:Date.now(),holdAt:0}:{})});sync();if(cfg().visible)refresh();});
  root.querySelector('#scores203-hold').onclick=guard(async()=>{const c=cfg();await act('bottom_scores',c.holdAt?{anchor:(c.anchor||0)+Date.now()-c.holdAt,holdAt:0}:{holdAt:Date.now()});sync();});
  root.querySelector('#scores224-feed-game').onchange=guard(async e=>{await act('bottom_scores',{feedBugGameId:e.target.value});sync();});
  root.querySelector('#scores224-feed-show').onclick=guard(async()=>{const c=cfg();await act('bottom_scores',{feedBugVisible:!c.feedBugVisible,...(!c.anchor?{anchor:Date.now()}: {})});sync();if(cfg().feedBugVisible)refresh();});
  sync();
 }
 return{view,bind,sync};
}
