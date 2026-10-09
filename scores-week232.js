const easternCalendar=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'});
export function easternDate(now=Date.now()){
 const parts=easternCalendar.formatToParts(new Date(now));
 return ['year','month','day'].map(type=>parts.find(part=>part.type===type).value).join('-');
}
export function scoreWeek(date='',now=Date.now()){
 const chosen=date||easternDate(now),match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(chosen);
 if(!match)throw Error('Choose a valid schedule date.');
 const day=new Date(chosen+'T00:00:00Z');
 if(!Number.isFinite(day.getTime())||day.toISOString().slice(0,10)!==chosen)throw Error('Choose a valid schedule date.');
 // Calendar arithmetic in UTC avoids DST changing a seven-day local week.
 day.setUTCDate(day.getUTCDate()-(day.getUTCDay()+6)%7);
 const start=day.toISOString().slice(0,10);day.setUTCDate(day.getUTCDate()+6);
 const end=day.toISOString().slice(0,10);
 return {start,end,espn:start.replaceAll('-','')+'-'+end.replaceAll('-','')};
}
export function leagueScoreWeek(league,date='',now=Date.now()){
 const calendar=scoreWeek(date,now);
 // Current NFL slates finish on Monday. Keep that slate on Monday rather than
 // dropping its Thursday/Sunday games. Explicit dates retain calendar weeks.
 if(league!=='NFL'||date)return calendar;
 const day=new Date(easternDate(now)+'T00:00:00Z');
 day.setUTCDate(day.getUTCDate()-(day.getUTCDay()+5)%7);
 const start=day.toISOString().slice(0,10);day.setUTCDate(day.getUTCDate()+6);
 const end=day.toISOString().slice(0,10);
 return {start,end,espn:start.replaceAll('-','')+'-'+end.replaceAll('-','')};
}
export function gameInWeek(game,week){
 const start=Date.parse(game.start);
 // Keep provider-returned TBD games rather than silently dropping a fixture.
 if(!Number.isFinite(start))return true;
 const date=easternDate(start);return date>=week.start&&date<=week.end;
}
export function scoreWeekLabel(week){
 const format=new Intl.DateTimeFormat('en-US',{timeZone:'UTC',month:'short',day:'numeric',year:'numeric'});
 return format.format(new Date(week.start+'T12:00:00Z'))+' – '+format.format(new Date(week.end+'T12:00:00Z'));
}
