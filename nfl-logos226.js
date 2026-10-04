// Assignments preserve each supplied filename. A suffix such as -1 denotes an
// alternate logo; add future variants alongside originals and select them here.
export const nflLogoAssignments226=Object.freeze([
 {
  "code": "ARI",
  "name": "Arizona Cardinals",
  "shortName": "Cardinals",
  "file": "ARI.png",
  "variant": "base"
 },
 {
  "code": "ATL",
  "name": "Atlanta Falcons",
  "shortName": "Falcons",
  "file": "ATL.png",
  "variant": "base"
 },
 {
  "code": "BAL",
  "name": "Baltimore Ravens",
  "shortName": "Ravens",
  "file": "BAL.png",
  "variant": "base"
 },
 {
  "code": "BUF",
  "name": "Buffalo Bills",
  "shortName": "Bills",
  "file": "BUF.png",
  "variant": "base"
 },
 {
  "code": "CAR",
  "name": "Carolina Panthers",
  "shortName": "Panthers",
  "file": "CAR.png",
  "variant": "base"
 },
 {
  "code": "CHI",
  "name": "Chicago Bears",
  "shortName": "Bears",
  "file": "CHI.png",
  "variant": "base"
 },
 {
  "code": "CIN",
  "name": "Cincinnati Bengals",
  "shortName": "Bengals",
  "file": "CIN.png",
  "variant": "base"
 },
 {
  "code": "CLE",
  "name": "Cleveland Browns",
  "shortName": "Browns",
  "file": "CLE.png",
  "variant": "base"
 },
 {
  "code": "DAL",
  "name": "Dallas Cowboys",
  "shortName": "Cowboys",
  "file": "DAL.png",
  "variant": "base"
 },
 {
  "code": "DEN",
  "name": "Denver Broncos",
  "shortName": "Broncos",
  "file": "DEN-1.png",
  "variant": "alternate 1"
 },
 {
  "code": "DET",
  "name": "Detroit Lions",
  "shortName": "Lions",
  "file": "DET.png",
  "variant": "base"
 },
 {
  "code": "GB",
  "name": "Green Bay Packers",
  "shortName": "Packers",
  "file": "GB.png",
  "variant": "base"
 },
 {
  "code": "HOU",
  "name": "Houston Texans",
  "shortName": "Texans",
  "file": "HOU.png",
  "variant": "base"
 },
 {
  "code": "IND",
  "name": "Indianapolis Colts",
  "shortName": "Colts",
  "file": "IND.png",
  "variant": "base"
 },
 {
  "code": "JAX",
  "name": "Jacksonville Jaguars",
  "shortName": "Jaguars",
  "file": "JAX.png",
  "variant": "base"
 },
 {
  "code": "KC",
  "name": "Kansas City Chiefs",
  "shortName": "Chiefs",
  "file": "KC.png",
  "variant": "base"
 },
 {
  "code": "LV",
  "name": "Las Vegas Raiders",
  "shortName": "Raiders",
  "file": "LV.png",
  "variant": "base"
 },
 {
  "code": "LAC",
  "name": "Los Angeles Chargers",
  "shortName": "Chargers",
  "file": "LAC.png",
  "variant": "base"
 },
 {
  "code": "LAR",
  "name": "Los Angeles Rams",
  "shortName": "Rams",
  "file": "LAR.png",
  "variant": "base"
 },
 {
  "code": "MIA",
  "name": "Miami Dolphins",
  "shortName": "Dolphins",
  "file": "MIA.png",
  "variant": "base"
 },
 {
  "code": "MIN",
  "name": "Minnesota Vikings",
  "shortName": "Vikings",
  "file": "MIN.png",
  "variant": "base"
 },
 {
  "code": "NE",
  "name": "New England Patriots",
  "shortName": "Patriots",
  "file": "NE.png",
  "variant": "base"
 },
 {
  "code": "NO",
  "name": "New Orleans Saints",
  "shortName": "Saints",
  "file": "NO.png",
  "variant": "base"
 },
 {
  "code": "NYG",
  "name": "New York Giants",
  "shortName": "Giants",
  "file": "NYG.png",
  "variant": "base"
 },
 {
  "code": "NYJ",
  "name": "New York Jets",
  "shortName": "Jets",
  "file": "NYJ.png",
  "variant": "base"
 },
 {
  "code": "PHI",
  "name": "Philadelphia Eagles",
  "shortName": "Eagles",
  "file": "PHI.png",
  "variant": "base"
 },
 {
  "code": "PIT",
  "name": "Pittsburgh Steelers",
  "shortName": "Steelers",
  "file": "PIT.png",
  "variant": "base"
 },
 {
  "code": "SF",
  "name": "San Francisco 49ers",
  "shortName": "49ers",
  "file": "SF.png",
  "variant": "base"
 },
 {
  "code": "SEA",
  "name": "Seattle Seahawks",
  "shortName": "Seahawks",
  "file": "SEA.png",
  "variant": "base"
 },
 {
  "code": "TB",
  "name": "Tampa Bay Buccaneers",
  "shortName": "Buccaneers",
  "file": "TB.png",
  "variant": "base"
 },
 {
  "code": "TEN",
  "name": "Tennessee Titans",
  "shortName": "Titans",
  "file": "TEN.png",
  "variant": "base"
 },
 {
  "code": "WAS",
  "name": "Washington Commanders",
  "shortName": "Commanders",
  "file": "WAS.png",
  "variant": "base"
 }
].map(team=>Object.freeze(team)));
const aliases=Object.freeze({WSH:'WAS',JAC:'JAX',LA:'LAR'});
const byCode=new Map(nflLogoAssignments226.map(team=>[team.code,team]));
const normalize=value=>String(value||'').trim().toUpperCase();
const byName=new Map(nflLogoAssignments226.flatMap(team=>[[normalize(team.name),team],[normalize(team.shortName),team]]));
export function nflBroadcastLogo226(league,team={}){
 if(normalize(league)!=='NFL')return '';
 const code=normalize(team.abbr),entry=byCode.get(aliases[code]||code)||byName.get(normalize(team.name));
 return entry?new URL(`./broadcast-logos226/teams/${entry.file}`,import.meta.url).href:'';
}
