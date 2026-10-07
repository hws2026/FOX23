import {groupedPlayerOptions} from './player-options228.js';
import {nflLogoAssignments226} from './nfl-logos226.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kinds = {team:'Team logos', player:'Players', coach:'Coaches', branding:'Show logos', other:'Other images'};
const slots = {teamLogo:'Team logo', heroLogo:'Raised team logo / helmet', player:'Player photo', coach:'Coach photo', networkLogo:'Network logo', sponsorLogo:'Sponsor logo', secondaryLogo:'Secondary show logo', introLogo:'Intro logo', conferenceLogo:'Transition logo', storyImage:'Story wall image'};
const brandingLabels = {networkLogo:'Network logo', sponsorLogo:'Sponsor logo', secondaryLogo:'Secondary show logo', introLogo:'Intro logo', conferenceLogo:'Transition logo'};
const option = (value, label, selected) => `<option value="${esc(value)}"${value === selected ? ' selected' : ''}>${esc(label)}</option>`;

export function assetUses(state) {
  const uses = new Map();
  const add = (src, label) => { if (src) uses.set(src, [...(uses.get(src) || []), label]); };
  // These assignments predate the library and apply to every NFL score feed,
  // even when that team is not the current home or away team.
  for (const team of nflLogoAssignments226) {
    const src = 'broadcast-logos226/teams/' + team.file;
    const label = `${team.code} · Bottom scores & Feed scorebug`;
    add(src, label); add(new URL('./' + src, import.meta.url).href, label);
  }
  for (const [side, team] of Object.entries(state.teams || {})) {
    const label = team.abbr || team.name || (side === 'away' ? 'Away team' : 'Home team');
    add(team.logo, `${label} · team logo`); add(team.heroLogo, `${label} · raised logo`);
    for (const player of team.roster || []) add(player.photo, `${label} · ${player.number || ''} ${player.name}`.trim());
    for (const coach of team.staff || []) add(coach.photo, `${label} · ${coach.name}`);
  }
  for (const [field, label] of Object.entries(brandingLabels)) add(state.branding?.[field], label);
  add(state.preview?.storyImage, 'Story wall · preview');
  return uses;
}

export function createAssetLibrary({getState, act, imageFile, toast, render, sampleLogo, isOpen = () => false}) {
  let selected = '', search = '', filter = '', page = 0, slot = 'teamLogo', side = 'away', person = '', pending = false, signature = '';
  const pageSize = 24;
  const items = () => getState()?.assetLibrary?.items || [];
  const visibleItems = () => items().filter(a => (!filter || a.kind === filter) && `${a.name} ${a.filename}`.toLowerCase().includes(search.toLowerCase().trim()));
  const current = () => items().find(a => a.id === selected);
  const teamSelect = state => `<label>Team<select id="asset-team228">${Object.entries(state.teams).map(([key,t]) => option(key, t.name || (key === 'away' ? 'Away team' : 'Home team'), side)).join('')}</select></label>`;
  function assignment(state) {
    const team = state.teams[side];
    let extra = '';
    if (['teamLogo','heroLogo','player','coach'].includes(slot)) extra += teamSelect(state);
    if (slot === 'player') extra += `<label>Player<select id="asset-person228" required>${groupedPlayerOptions(team.roster, person, {placeholder:'Choose a player'})}</select></label>`;
    if (slot === 'coach') extra += `<label>Coach<select id="asset-person228" required>${option('', 'Choose a coach', person)}${(team.staff || []).map(p => option(p.id, `${p.name} · ${p.role}`, person)).join('')}</select></label>`;
    return `<form id="asset-assign228"><h3>Assign asset</h3><label>Use as<select id="asset-slot228">${Object.entries(slots).map(([key,label]) => option(key,label,slot)).join('')}</select></label><div class="asset-target228">${extra}</div>${slot === 'storyImage' ? '<p class="help">Opens this image in the Story wall preview. Use Take Live when ready.</p>' : '<p class="help">Assigning replaces the image in this slot. Current team and show images update wherever they are used.</p>'}<button class="primary">Assign asset</button><p id="asset-assignment-status228" role="status"></p></form>`;
  }
  function cards() {
    const list = visibleItems(), pages = Math.max(1, Math.ceil(list.length / pageSize)); page = Math.min(page, pages - 1);
    const uses = assetUses(getState());
    return `<div class="asset-count228" role="status">${list.length} asset${list.length === 1 ? '' : 's'}${search || filter ? ' found' : ''}</div><div class="asset-grid228">${list.slice(page * pageSize, (page + 1) * pageSize).map(a => `<button type="button" class="asset-tile228${a.id === selected ? ' is-selected' : ''}" data-asset228="${esc(a.id)}" aria-pressed="${a.id === selected}" title="${esc(a.name)}"><span class="asset-thumb228"><img src="${esc(a.src)}" alt="" loading="lazy"></span><strong>${esc(a.name)}</strong><small>${esc(kinds[a.kind] || 'Image')}${uses.has(a.src) ? ' · Assigned' : ''}</small></button>`).join('') || '<p class="help">No matching assets. Try another search or upload images above.</p>'}</div><div class="asset-paging228"><button type="button" data-asset-page228="-1"${page === 0 ? ' disabled' : ''}>Previous</button><span>Page ${page + 1} of ${pages}</span><button type="button" data-asset-page228="1"${page >= pages - 1 ? ' disabled' : ''}>Next</button></div>`;
  }
  function detail() {
    const a = current();
    if (!a) return '<div class="asset-empty228"><h3>Select an asset</h3><p>Choose an image to rename it or assign it to a team, player, coach, or show graphic.</p></div>';
    const uses = assetUses(getState()).get(a.src) || [];
    return `<div class="asset-detail-image228"><img src="${esc(a.src)}" alt="${esc(a.name)}"></div><form id="asset-rename228"><label>Asset name<input name="name" maxlength="120" required value="${esc(a.name)}"></label><p class="help asset-filename228">Original file: ${esc(a.filename || 'Existing show image')}</p><button>Save name</button></form><div class="asset-usage228"><h3>Assignments</h3>${uses.length ? `<ul>${uses.map(u => `<li>${esc(u)}</li>`).join('')}</ul>` : '<p class="help">No current assignments.</p>'}</div>${assignment(getState())}`;
  }
  function view() {
    if (!selected && items().length) selected = items()[0].id;
    return `<div class="asset-library228"><div class="section-top"><div><h2>Asset library</h2><p>Your NFL logos keep their existing team assignments. Manage names, upload more images, or assign other slots here.</p></div><span class="pill">${items().length} IMAGES</span></div><form class="card asset-upload228" id="asset-upload228"><div><h3>Upload images</h3><p class="help">PNG, JPEG, or WebP · up to 2 MB each · up to 20 files at once. Alternate filenames such as -1 stay separate. Your library stays available when you import or clear a game.</p></div><label>Images<input id="asset-files228" type="file" accept="image/png,image/jpeg,image/webp" multiple required></label><label>Category<select id="asset-kind228">${Object.entries(kinds).map(([key,label]) => option(key,label,'other')).join('')}</select></label><button class="primary">Upload to library</button><p id="asset-upload-status228" role="status"></p></form><div class="asset-layout228"><article class="card asset-browser228"><div class="asset-filters228"><label>Search assets<input type="search" id="asset-search228" value="${esc(search)}" placeholder="Name or original filename"></label><label>Category<select id="asset-filter228">${option('','All images',filter)}${Object.entries(kinds).map(([key,label]) => option(key,label,filter)).join('')}</select></label></div><div id="asset-results228">${cards()}</div></article><aside class="card asset-detail228" id="asset-detail228" aria-label="Selected asset">${detail()}</aside></div></div>`;
  }
  function wireCards(root) {
    root.querySelectorAll('[data-asset228]').forEach(button => button.onclick = () => { selected = button.dataset.asset228; refresh(root); });
    root.querySelectorAll('[data-asset-page228]').forEach(button => button.onclick = () => { page += Number(button.dataset.assetPage228); refresh(root); });
  }
  function refresh(root) {
    if (!root.isConnected || !root.querySelector('#asset-results228')) return;
    root.querySelector('#asset-results228').innerHTML = cards();
    root.querySelector('#asset-detail228').innerHTML = detail();
    wireCards(root); wireDetail(root);
  }
  async function run(button, task) {
    if (pending) return;
    pending = true; if (button) button.disabled = true;
    try { await task(); } catch (error) { toast(error.message || 'Unable to save asset.', true); }
    finally { pending = false; if (button?.isConnected) button.disabled = false; const status=document.querySelector('#asset-upload-status228'); if(status)status.textContent=''; }
  }
  function wireDetail(root) {
    const rename = root.querySelector('#asset-rename228');
    if (rename) rename.onsubmit = e => { e.preventDefault(); const a = current(), name = rename.elements.name.value.trim(); run(e.submitter, async () => { await act('asset_rename', {id:a.id,name}); toast('Asset name saved. Original filename kept.'); refresh(root); }); };
    const choose = root.querySelector('#asset-slot228');
    if (choose) choose.onchange = () => { slot = choose.value; person = ''; root.querySelector('#asset-detail228').innerHTML = detail(); wireDetail(root); };
    const team = root.querySelector('#asset-team228');
    if (team) team.onchange = () => { side = team.value; person = ''; root.querySelector('#asset-detail228').innerHTML = detail(); wireDetail(root); };
    const player = root.querySelector('#asset-person228'); if (player) player.onchange = () => { person = player.value; };
    const assign = root.querySelector('#asset-assign228');
    if (assign) assign.onsubmit = e => { e.preventDefault(); const a = current(), chosenSlot = slot, chosenSide = side, chosenPerson = person; run(e.submitter, async () => {
      let target;
      if (['teamLogo','heroLogo'].includes(chosenSlot)) target = {type:'team',side:chosenSide,field:chosenSlot === 'teamLogo' ? 'logo' : 'heroLogo'};
      else if (['player','coach'].includes(chosenSlot)) { if (!chosenPerson) throw Error(`Choose a ${chosenSlot}.`); target = {type:chosenSlot,side:chosenSide,personId:chosenPerson}; }
      else if (chosenSlot === 'storyImage') target = {type:'preview',field:'storyImage'};
      else { target = {type:'branding',field:chosenSlot}; if (chosenSlot === 'conferenceLogo' && sampleLogo) target.autoColor = await sampleLogo(a.src); }
      await act('asset_assign', {id:a.id,target}); refresh(root); toast(`Assigned ${a.name} to ${slots[chosenSlot].toLowerCase()}.`);
    }); };
  }
  function bind(root) {
    wireCards(root); wireDetail(root);
    root.querySelector('#asset-search228').oninput = e => { search = e.target.value; page = 0; refresh(root); };
    root.querySelector('#asset-filter228').onchange = e => { filter = e.target.value; page = 0; refresh(root); };
    root.querySelector('#asset-upload228').onsubmit = e => { e.preventDefault(); const files = [...root.querySelector('#asset-files228').files], kind = root.querySelector('#asset-kind228').value; run(e.submitter, async () => {
      if (!files.length || files.length > 20) throw Error('Choose between 1 and 20 images.');
      root.querySelector('#asset-upload-status228').textContent = 'Reading images…';
      const uploaded = [];
      for (const file of files) { const src = await imageFile(file); if (!src) throw Error(`${file.name} is empty.`); uploaded.push({name:file.name.replace(/\.[^.]+$/, '').slice(0,120),filename:file.name,src,kind}); }
      await act('asset_upload', {items:uploaded});
      selected = items().find(a => a.src === uploaded[0].src)?.id || selected; search = ''; filter = ''; page = 0;
      toast(`${files.length} image${files.length === 1 ? '' : 's'} added to your library.`); pending = false; render();
    }); };
  }
  function observe() {
    const next = JSON.stringify(items().map(a => [a.id,a.name,a.kind,a.filename,a.src?.length]));
    const changed = signature && signature !== next; signature = next;
    if (changed && isOpen() && !pending && !document.querySelector('#controls')?.contains(document.activeElement)) render();
  }
  return {view,bind,observe};
}
