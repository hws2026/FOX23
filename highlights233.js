// Highlight the actual text nodes, including nested numeric/stat spans.
const tiers={
 player:['.spotlight-copy h1','.spotlight-detail'],
 stats:['.spotlight-copy h1','.spotlight-stat-context','.spotlight-stat-grid'],
 lowerthird:['.spotlight-copy h1','.spotlight-detail:not(.lower-body)','.lower-body'],
 coach:['.staff-plate h1,.staff-ribbon-name','.staff-tab,.staff-ribbon-role','.staff-plate p,.staff-ribbon-detail'],
 referee:['.referee-copy h1','.referee-copy p'],
 announcers:['.announcer-person h1','.announcer-person p'],
};
export function applyCueHighlights(root,cue){
 for(const el of root.querySelectorAll('.cue-yellow233'))el.classList.remove('cue-yellow233');
 for(const [i,selector] of (tiers[cue.type]||[]).entries()){
  const value=cue['tier'+(i+1)+'Yellow'];
  if(value===true||value==='true')for(const el of root.querySelectorAll(selector))el.classList.add('cue-yellow233');
 }
 if(cue.type==='quarterback'&&(cue.qbContextYellow===true||cue.qbContextYellow==='true'))
  for(const el of root.querySelectorAll('.qb-feature>p,.qb-season>header'))el.classList.add('cue-yellow233');
}
