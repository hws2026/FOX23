import {titleLeagues} from './scores-titles219.js?v=audit232';

/** The saved picker order is authoritative; legacy ALL keeps the standard order. */
export function selectedScoreLeagues(cfg = {}) {
  const selected = Array.isArray(cfg.leagues) && cfg.leagues.length
    ? cfg.leagues
    : cfg.league === 'ALL' ? titleLeagues : [cfg.league || 'NFL'];
  return [...new Set(selected)].filter(league => titleLeagues.includes(league));
}

/**
 * Build one repeatable cycle without reading the clock or mutating feed records.
 * Every title shows the entire selected deck. _completedLeagues styles completed
 * cards, _leavingLeague identifies the card to slide out, and _activeLeague is
 * the league whose games follow. The final title closes the last league before
 * tickerFrame wraps to the opening deck. Empty leagues get a labeled title only.
 * Decks retain the last completed game for the separate feed scorebug; only the
 * opening deck previews the first scheduled game. Include league in that identity
 * because different score providers can reuse a game ID.
 * Game details and their existing timing are left to the caller/tickerFrame.
 */
export function buildScorePlan(games = [], cfg = {}) {
  const selected = selectedScoreLeagues(cfg);
  const groups = new Map(selected.map(league => [league, []]));
  const seenIds = new Set();
  const seenRecords = new Set();
  for (const game of games) {
    if (!game || game._titleCard || !groups.has(game.league)) continue;
    const key = game.id == null ? null : `${game.league}\u0000${game.id}`;
    if (key === null ? seenRecords.has(game) : seenIds.has(key)) continue;
    if (key === null) seenRecords.add(game);
    else seenIds.add(key);
    groups.get(game.league).push({...game});
  }

  const groupedGames = selected.flatMap(league => groups.get(league));
  if (cfg.gameId) return groupedGames.filter(game => game.id === cfg.gameId).slice(0, 1);
  if (cfg.titlesEnabled === false || !selected.length) return groupedGames;

  const deckFrame = index => {
    const active = selected[index] || null;
    const leaving = index > 0 ? selected[index - 1] : null;
    const empty = active !== null && groups.get(active).length === 0;
    const completedGames = selected.slice(0, index).flatMap(league => groups.get(league));
    const feedGame = completedGames[completedGames.length - 1] || groupedGames[0] || null;
    return {
      id: `deck224:${selected.join(',')}:${index}`,
      league: active || leaving,
      _titleCard: true,
      _leagueDeck: [...selected],
      _remainingLeagues: selected.slice(index),
      _completedLeagues: selected.slice(0, index),
      _leavingLeague: leaving,
      _activeLeague: active,
      _feedGameId: feedGame?.id ?? null,
      _feedGameLeague: feedGame?.league ?? null,
      _deckStep: index,
      _cycleEnd: index === selected.length,
      _emptyLeague: empty,
      _emptyMessage: empty ? 'No games scheduled' : '',
      _tickerDetails: [''],
      away: {},
      home: {},
    };
  };

  const plan = [];
  selected.forEach((league, index) => {
    plan.push(deckFrame(index), ...groups.get(league));
  });
  plan.push(deckFrame(selected.length));
  return plan;
}
