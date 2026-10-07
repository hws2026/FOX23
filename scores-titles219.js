export const titleLeagues=['NFL','MLB','NBA','MLS','NCAAF','NCAAM','NCAAW','UFL'];
export function leagueNetwork(cfg,league,branding={}){return cfg.leagueNetworks?.[league]||branding.network||'WLD SPORTS';}
export function leagueLabels(cfg,league){return cfg.leagueTitleCards?.[league]||['{network}','{league} SCORES & UPDATES'];}
export function titleLabels(cfg,league,branding={}){return leagueLabels(cfg,league).map(label=>String(label).replace(/\{(network|league|nfl|mlb|nba|mls|ncaaf|ncaam|ncaaw|ufl)\}/gi,(_,key)=>key.toLowerCase()==='network'?leagueNetwork(cfg,league,branding):key.toLowerCase()==='league'?league:key.toUpperCase()));}
