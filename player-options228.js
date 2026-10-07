// Shared by control-panel player pickers. The roster itself is never reordered.
const positions = [
  ['QB', 'QUARTERBACKS'], ['RB', 'RUNNING BACKS'], ['FB', 'FULLBACKS'],
  ['WR', 'WIDE RECEIVERS'], ['TE', 'TIGHT ENDS'],
  ['OT', 'OFFENSIVE TACKLES'], ['G', 'GUARDS'], ['C', 'CENTERS'], ['OL', 'OFFENSIVE LINEMEN'],
  ['DE', 'DEFENSIVE ENDS'], ['DT', 'DEFENSIVE TACKLES'], ['NT', 'NOSE TACKLES'],
  ['DL', 'DEFENSIVE LINEMEN'], ['EDGE', 'EDGE RUSHERS'],
  ['LB', 'LINEBACKERS'], ['CB', 'CORNERBACKS'], ['FS', 'FREE SAFETIES'],
  ['SS', 'STRONG SAFETIES'], ['S', 'SAFETIES'], ['DB', 'DEFENSIVE BACKS'],
  ['K', 'KICKERS'], ['P', 'PUNTERS'], ['LS', 'LONG SNAPPERS'],
  ['KR', 'KICK RETURNERS'], ['PR', 'PUNT RETURNERS'], ['H', 'HOLDERS']
];
const positionNames = new Map(positions);
const positionOrder = new Map(positions.map(([key], index) => [key, index]));
const aliases = {
  QUARTERBACK: 'QB', 'RUNNING BACK': 'RB', HB: 'RB', HALFBACK: 'RB', FULLBACK: 'FB',
  'WIDE RECEIVER': 'WR', 'TIGHT END': 'TE',
  T: 'OT', LT: 'OT', RT: 'OT', TACKLE: 'OT', 'OFFENSIVE TACKLE': 'OT',
  LG: 'G', RG: 'G', OG: 'G', GUARD: 'G', CENTER: 'C',
  'OFFENSIVE LINE': 'OL', 'OFFENSIVE LINEMAN': 'OL',
  'DEFENSIVE END': 'DE', 'DEFENSIVE TACKLE': 'DT', 'NOSE TACKLE': 'NT',
  'DEFENSIVE LINE': 'DL', 'DEFENSIVE LINEMAN': 'DL', 'EDGE RUSHER': 'EDGE',
  ILB: 'LB', OLB: 'LB', MLB: 'LB', WLB: 'LB', SLB: 'LB', LINEBACKER: 'LB',
  CORNERBACK: 'CB', NB: 'CB', NICKEL: 'CB', 'FREE SAFETY': 'FS', 'STRONG SAFETY': 'SS',
  SAFETY: 'S', 'DEFENSIVE BACK': 'DB', PK: 'K', KICKER: 'K', PUNTER: 'P',
  'LONG SNAPPER': 'LS', 'KICK RETURNER': 'KR', 'PUNT RETURNER': 'PR', HOLDER: 'H'
};
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const textOrder = (a, b) => String(a ?? '').localeCompare(String(b ?? ''), 'en', { sensitivity: 'base', numeric: true });
const jerseyNumber = player => {
  const number = String(player.number ?? '').trim().replace(/^#\s*/, '');
  return /^\d+$/.test(number) ? Number(number) : Infinity;
};
const positionKey = player => {
  // Slash-separated entries use the first listed position, e.g. WR/KR.
  const position = String(player.position ?? '').trim().toUpperCase().split(/\s*\/\s*/)[0];
  return aliases[position] || position || 'UNASSIGNED';
};

/** Return position groups with jersey numbers in ascending order, without mutating players. */
export function groupPlayersByPosition(roster = []) {
  const grouped = new Map();
  for (const player of roster) {
    const key = positionKey(player);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(player);
  }
  return [...grouped].sort(([a], [b]) => {
    const rankA = positionOrder.get(a) ?? (a === 'UNASSIGNED' ? positions.length + 1 : positions.length);
    const rankB = positionOrder.get(b) ?? (b === 'UNASSIGNED' ? positions.length + 1 : positions.length);
    return rankA - rankB || textOrder(a, b);
  }).map(([key, players]) => ({
    key,
    label: positionNames.get(key) || (key === 'UNASSIGNED' ? 'UNASSIGNED POSITION' : key),
    players: players.sort((a, b) => jerseyNumber(a) - jerseyNumber(b) || textOrder(a.name, b.name) || textOrder(a.id, b.id))
  }));
}

/** Build safe native <optgroup> markup. Use placeholder: null when no empty option is wanted. */
export function groupedPlayerOptions(roster = [], selected = '', { placeholder = 'Unassigned' } = {}) {
  const selectedId = String(selected ?? '');
  const option = (value, label) => `<option value="${escapeHTML(value)}"${String(value) === selectedId ? ' selected' : ''}>${escapeHTML(label)}</option>`;
  const empty = placeholder === null ? '' : option('', placeholder);
  return empty + groupPlayersByPosition(roster).map(group => `<optgroup label="${escapeHTML(group.label)}">${group.players.map(player => {
    const number = String(player.number ?? '').trim().replace(/^#\s*/, '');
    const label = [number, String(player.name ?? '').trim()].filter(Boolean).join(' ');
    return option(player.id, label);
  }).join('')}</optgroup>`).join('');
}
