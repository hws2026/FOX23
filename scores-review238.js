import {createScores} from './scores-panel203.js?v=update239';
import {selectedFeedLeagues} from './scores-data203.js?v=update239';
import {leagueScoreWeek,easternDate} from './scores-week232.js?v=update239';
const state={branding:{network:'WLD SPORTS'},bottomScores:{league:'ALL',leagues:['NFL'],date:'2023-11-05',auto:false,visible:false,feedBugVisible:false,games:[],sources:{},updatedAt:0}};
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const report=()=>{
 const c=state.bottomScores,selected=selectedFeedLeagues(c),games=c.games||[],outcome=c.error?'provider-unavailable':c.updatedAt?(games.length?'loaded':'empty-week'):'not-requested';
 const result={isolated:true,productionStateWrites:false,outcome,checkedAt:c.updatedAt?new Date(c.updatedAt).toISOString():null,todayEastern:easternDate(),mode:c.date?'pinned':'current',date:c.date,leagues:selected,windows:Object.fromEntries(selected.map(l=>[l,leagueScoreWeek(l,c.date||'')])),error:c.error||'',sources:c.sources,games:games.map(g=>({id:g.id,league:g.league,start:g.start,easternDate:Number.isFinite(Date.parse(g.start))?easternDate(Date.parse(g.start)):'TBD',away:g.away.name,home:g.home.name,status:g.status}))};
 document.querySelector('#review238-result').textContent=JSON.stringify(result,null,2);
 document.querySelector('#review238-status').textContent=outcome==='provider-unavailable'?'Provider request failed or was blocked. This is not evidence that the week has no games.':outcome==='loaded'?`${games.length} scheduled games loaded from the public providers.`:outcome==='empty-week'?'Provider request succeeded; no scheduled games were returned for these windows.':'No completed public feed request yet.';
};
const controls=createScores({getState:()=>state,esc,toast:message=>{document.querySelector('#review238-status').textContent=message;},act:async(action,payload)=>{
 if(action!=='bottom_scores')throw Error('Only isolated score controls are enabled.');
 Object.assign(state.bottomScores,payload);report();
}});
const panel=document.querySelector('#scores238-panel');panel.innerHTML=controls.view();controls.bind(panel);report();
