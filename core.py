#!/usr/bin/env python3
"""Local broadcast controller. Python 3.9+, no third-party dependencies."""
import argparse, copy, json, math, mimetypes, os, threading, time, sys
from pathlib import Path
from urllib.parse import urlparse, parse_qs
ROOT = Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
from team_library import TeamLibrary, empty_lineup
PUBLIC = ROOT / 'public'
LOCK = threading.RLock()
DATA = Path(os.environ.get('BROADCAST_DATA', str(ROOT / 'data')))
DATA.mkdir(parents=True, exist_ok=True)
STATE_FILE = DATA / 'game.json'
LIBRARY=TeamLibrary(ROOT,DATA)
POSITIONS = ['QB','LT','LG','C','RG','RT','WR','WR','TE','RB','WR','DE','DT','DT','DE','LB','LB','LB','CB','CB','FS','SS','K','P']
NAMES = ['Jordan Ellis','Marcus Reed','Cameron Price','Alex Morgan','Drew Collins','Taylor Brooks','Jalen Carter','Noah Hayes','Mason Cole','Evan Grant','Devin Ross','Cole Bennett','Tyler James','Owen Parker','Blake Foster','Avery Scott','Logan West','Riley Davis','Kai Turner','Miles Ward','Nolan King','Isaiah Bell','Sam Lewis','Jesse Gray']
FORMATION_LABELS = {'4-3-4': ['DL', 'DL', 'DL', 'DL', 'LB', 'LB', 'LB', 'CB', 'FS', 'SS', 'CB'], '3-4-4': ['DL', 'DL', 'DL', 'LB', 'LB', 'LB', 'LB', 'CB', 'FS', 'SS', 'CB'], '4-2-5': ['DL', 'DL', 'DL', 'DL', 'LB', 'LB', 'CB', 'CB', 'FS', 'SS', 'CB'], '3-3-5': ['DL', 'DL', 'DL', 'LB', 'LB', 'LB', 'CB', 'CB', 'FS', 'SS', 'CB'], '5-2-4': ['DL', 'DL', 'DL', 'DL', 'DL', 'LB', 'LB', 'CB', 'FS', 'SS', 'CB'], '4-1-6': ['DL', 'DL', 'DL', 'DL', 'LB', 'CB', 'CB', 'FS', 'SS', 'CB', 'CB']}
GRAPHICS = {'referee','tiers','standings','transition','scoringdrive','none','qbstats','scorebug','matchup','offense','defense','quarterback','player','coach','lowerthird','stats','teamstats','roster','event','period','final','upcoming','announcers','sponsor','weather','reporter','situation','break'}
def roster(side):
    return [{'id':f'{side}-{i+1}', 'name':name, 'number':str(([7,72,64,55,68,77,11,18,86,24,13,90,95,98,91,50,54,56,21,23,30,32,3,9][i]+(2 if side=='home' else 0))%100), 'position':pos,'photo':'','stats':{'YDS':'248','TD':'2','CMP':'19/27'}} for i,(name,pos) in enumerate(zip(NAMES,POSITIONS))]
def default_state():
    teams={side:{'name':name,'shortName':name.split()[-1],'heroLogo':'','abbr':abbr,'record':'0–0','color':color,'secondary':secondary,'logo':'','coach':coach,'roster':roster(side)} for side,name,abbr,color,secondary,coach in [('away','Metro Wolves','MW','#163d68','#b7cce5','Chris Walker'),('home','Harbor Hawks','HH','#07524e','#8ad3c5','Casey Mitchell')]}
    lineups={side:{'formation':'4-3-4','offense':[f'{side}-{i}' for i in range(2,12)],'defense':[f'{side}-{i}' for i in range(12,23)],'quarterback':f'{side}-1','specialTeams':{'kicker':f'{side}-23','punter':f'{side}-24','holder':'','longSnapper':'','kickReturner':'','puntReturner':''}} for side in teams}
    cue={'type':'matchup','team':'away','playerId':'away-1','title':'FRIDAY NIGHT FOOTBALL','subtitle':'Live from Memorial Stadium','event':'TOUCHDOWN','period':'HALFTIME','nextAway':'NORTH RIDGE','nextHome':'EAST VALLEY','nextTime':'FRIDAY • 7:00 PM','rosterPage':1,'transition':'auto','leftName':'ALEX MORGAN','leftRole':'PLAY-BY-PLAY','rightName':'JORDAN REED','rightRole':'ANALYST','sponsorTitle':'POSTGAME','sponsorSubtitle':'PRESENTED BY OUR PARTNER','sponsorNext':'COMING UP NEXT','weatherTemp':'67°','weatherWind':'NW 6 MPH','weatherForecast':'CLEAR','reporterName':'REPORTER NAME','qbValue':'','qbLabel':'','qbDetail':'SEASON STATS','staffName':'','staffRole':'HEAD COACH','staffDetail':'','stats':[{'label':'PASSING YDS','away':'248','home':'212'},{'label':'RUSHING YDS','away':'126','home':'98'},{'label':'FIRST DOWNS','away':'19','home':'17'}]}
    return {'revision':0,'teams':teams,'lineups':lineups,'game':{'scores':{'away':0,'home':0},'timeouts':{'away':3,'home':3},'possession':'away','quarter':'1ST','down':'1ST','distance':'10','ballOn':'25','flag':False,'clock':{'remaining':900,'running':False,'anchor':time.time()},'playClock':{'remaining':40,'running':False,'anchor':time.time()},'showPlayClock':True,'showDownDistance':True,'bottomStatus':'LIVE','overtimePeriod':1,'showInfo':True,'showBallPosition':False},'branding':{'network':'GRIDIRON','competition':'FRIDAY NIGHT FOOTBALL','venue':'MEMORIAL STADIUM','accent':'#f9cb40','bugScale':1.0,'bugBottom':64,'networkLogo':'','sponsorName':'YOUR SPONSOR','sponsorLogo':'','sponsorColor':'#101349','secondaryLogo':''},'program':{'qbStats':{'visible':False,'team':'away'},'bug':True,'watermark':False,'graphic':{'type':'none'},'takeId':0},'preview':cue}
TEAM_CUES={'transition','scoringdrive','offense','defense','quarterback','qbstats','player','stats','coach','roster','event','lowerthird','situation'}
def cue_key(c):
    if c['type']=='transition':
        style=c.get('transitionStyle','team')
        return 'transition:'+style+(':'+c.get('team','away') if style in ['team','person'] else '')
    return c['type']+(':'+c.get('team','away') if c['type'] in TEAM_CUES else '')
def initial_cue(kind,team='away'):
    cue=copy.deepcopy(default_state()['preview']);cue.update(type=kind,team=team,playerId=STATE['lineups'][team]['quarterback'])
    if kind in ['event','lowerthird','matchup']:cue.update(title='',subtitle='')
    if STATE.get('program',{}).get('emptyShow'):
        for key,value in list(cue.items()):
            if isinstance(value,str) and key not in ['type','team','transition','outTransition']:cue[key]=''
        cue['stats']=[]
    return cue

def expire_timed_graphic(now=None):
    now=time.time() if now is None else now
    program=STATE['program'];timer=program.get('timedGraphic')
    if not timer: return False
    if timer['takeId']!=program['takeId']:
        program.pop('timedGraphic',None);return False
    if now<timer['until']: return False
    program.pop('timedGraphic',None);program['graphic']={'type':'none'};program['takeId']+=1
    STATE['revision']+=1;save();return True

def expire_play_clock(now=None):
    now=time.time() if now is None else now
    g=STATE['game'];deadline=g.get('playClockHideAt')
    if deadline is None or now<deadline: return False
    g.pop('playClockHideAt',None)
    if not g['playClock']['running']: g['showPlayClock']=False
    STATE['revision']+=1;save();return True

def remaining(c):
    return max(0,c['remaining']-(time.time()-c['anchor'] if c['running'] else 0))
def save():
    tmp=STATE_FILE.with_suffix('.tmp'); tmp.write_text(json.dumps(STATE,ensure_ascii=False)); tmp.replace(STATE_FILE)
def valid_image(v):
    return isinstance(v,str) and (v=='' or (len(v)<3500000 and any(v.startswith('data:image/'+x+';base64,') for x in ['png','jpeg','webp'])))
def bounded_text(v,n=120):
    if not isinstance(v,str) or len(v)>n: raise ValueError('Text is too long or invalid.')
    return v.strip()
def color(v):
    import re
    if not isinstance(v,str) or not re.fullmatch(r'#[0-9a-fA-F]{6}',v): raise ValueError('Use a six-digit hex color.')
    return v
STATE=default_state()
if STATE_FILE.exists():
    try:
        saved=json.loads(STATE_FILE.read_text())
        if set(STATE).issubset(saved):
            STATE=saved
            defaults=default_state()
            STATE['game']={**defaults['game'],**STATE['game']}
            if STATE['game'].get('bottomStatus')=='OT': STATE['game']['bottomStatus']='LIVE'
            if STATE['game'].get('down') in ['KICK','PAT']: STATE['game']['down']='1ST'
            STATE['branding']={**defaults['branding'],**STATE['branding']}
            STATE['preview']={**defaults['preview'],**STATE['preview']}
            for cue in [STATE['preview'],STATE['program']['graphic']]:
                cue['type']={'matchupfull':'matchup','finalboard':'final'}.get(cue['type'],cue['type'])
            STATE['program'].setdefault('watermark',False)
            STATE['program'].setdefault('qbStats',{'visible':False,'team':'away'})
            for side in ['away','home']:
                STATE['teams'][side].setdefault('shortName',(STATE['teams'][side]['name'].split() or [''])[-1])
                STATE['teams'][side].setdefault('heroLogo','')
            STATE['revision'] += 1
            for k in ['clock','playClock']:
                c=STATE['game'][k];c.update(remaining=remaining(c),running=False,anchor=time.time())
    except (ValueError,KeyError,TypeError): pass

for side in ['away','home']:
    team=STATE['teams'][side]
    team.setdefault('staff',[{'id':side+'-head-coach','name':team['coach'],'role':'HEAD COACH','detail':''}] if team.get('coach') else [])
    STATE['lineups'][side].setdefault('specialTeams',{key:next((p['id'] for p in team['roster'] if p['position']==pos),'') if pos else '' for key,pos in [('kicker','K'),('punter','P'),('holder',None),('longSnapper',None),('kickReturner',None),('puntReturner',None)]})

# Keep each graphic's fields, and each team's person/stats, independently.
STATE['program'].setdefault('cueLibrary',{})
if not STATE['program']['cueLibrary']:
    current=copy.deepcopy(STATE['preview'])
    STATE['program']['cueLibrary'][cue_key(current)]=current
    if current.get('title')==STATE['branding'].get('venue'):
        match=initial_cue('matchup');match.update(title=current['title'],subtitle=current.get('subtitle',''))
        STATE['program']['cueLibrary']['matchup']=match
    if current.get('staffName'):
        matches=[side for side,t in STATE['teams'].items() if t.get('coach')==current['staffName']]
        if len(matches)==1:
            coach=initial_cue('coach',matches[0])
            coach.update({k:current.get(k,'') for k in ['staffName','staffRole','staffDetail']})
            STATE['program']['cueLibrary'][cue_key(coach)]=coach
    qb=STATE['program'].get('qbStats',{})
    if qb.get('type')=='qbstats':
        qb=copy.deepcopy(qb);qb.pop('visible',None);STATE['program']['cueLibrary'][cue_key(qb)]=qb

# Migrate older team-keyed transition settings without discarding saved designs.
_transition_library=STATE['program']['cueLibrary']
_legacy_transition=STATE['preview'] if STATE['preview']['type']=='transition' else _transition_library.get('transition:'+STATE['preview'].get('team','away'),{})
STATE['program'].setdefault('lastTransitionStyle',_legacy_transition.get('transitionStyle','team'))
for _key,_cue in list(_transition_library.items()):
    if _cue.get('type')=='transition':
        _transition_library.setdefault(cue_key(_cue),copy.deepcopy(_cue))
        if _key in ['transition:away','transition:home']:del _transition_library[_key]

def update(action,p):
    _update(action,p)
    if action in ['team','roster','staff','lineup']:
        side=p.get('team','away');key=STATE.get('teamSelections',{}).get(side)
        if key:
            old=LIBRARY.get(key);old.update(copy.deepcopy(STATE['teams'][side]));old['lineup']=copy.deepcopy(STATE['lineups'][side]);LIBRARY.put(old)

def _update(action,p):
    g=STATE['game'];side=p.get('team','away')
    if side not in ['away','home']: raise ValueError('Select a team.')
    if action=='library_create':
        name=bounded_text(p.get('name',''),50)
        if not name:raise ValueError('Enter a team name.')
        key=LIBRARY.put({'name':name,'shortName':name.split()[-1],'abbr':bounded_text(p.get('abbr',''),5),'color':color(p.get('color','#163d68')),'secondary':color(p.get('secondary','#ffffff')),'logo':'','heroLogo':'','coach':'','record':'','roster':[],'staff':[]})
        STATE['lastLibraryTeam']=key
    elif action=='library_branding':
        key=bounded_text(p.get('id',''),120);t=LIBRARY.get(key)
        for field,value in p.items():
            if field in ['id','team']:continue
            if field in ['name','shortName','abbr','record']:t[field]=bounded_text(value,5 if field=='abbr' else 50)
            elif field in ['color','secondary']:t[field]=color(value)
            elif field in ['logo','heroLogo'] and valid_image(value):t[field]=value
            else:raise ValueError('Invalid saved team field.')
        if not t['name']:raise ValueError('Enter a team name.')
        LIBRARY.put(t)
        for slot,assigned in STATE.get('teamSelections',{}).items():
            if assigned==key:
                for field in ['name','shortName','abbr','record','color','secondary','logo','heroLogo']:STATE['teams'][slot][field]=t[field]
    elif action=='library_capture':
        t=copy.deepcopy(STATE['teams'][side]);t['lineup']=copy.deepcopy(STATE['lineups'][side]);key=LIBRARY.put(t)
        STATE.setdefault('teamSelections',{})[side]=key;STATE['lastLibraryTeam']=key
    elif action=='library_assign':
        key=bounded_text(p.get('id',''),120);t=LIBRARY.get(key)
        other='home' if side=='away' else 'away'
        if STATE.get('teamSelections',{}).get(other)==key:raise ValueError('This team is already assigned to the other side.')
        if not STATE.get('teamSelections',{}).get(side):
            original=copy.deepcopy(STATE['teams'][side]);original['lineup']=copy.deepcopy(STATE['lineups'][side]);LIBRARY.put(original)
        # Switching teams retains scores/clocks, but removes stale player-specific cues.
        STATE.setdefault('teamSelections',{})[side]=key
        STATE['teams'][side]={k:copy.deepcopy(t[k]) for k in ['name','shortName','abbr','color','secondary','logo','heroLogo','coach','record','roster','staff']}
        STATE['lineups'][side]=copy.deepcopy(t.get('lineup') or empty_lineup(t))
        for ck in list(STATE['program']['cueLibrary']):
            if ck.endswith(':'+side):del STATE['program']['cueLibrary'][ck]
        if STATE['preview'].get('team')==side:STATE['preview']=initial_cue(STATE['preview']['type'],side)
        if STATE['program']['graphic'].get('team')==side and STATE['program']['graphic']['type'] in TEAM_CUES:
            STATE['program']['graphic']={'type':'none'};STATE['program']['takeId']+=1
        if STATE['program'].get('qbStats',{}).get('team')==side:STATE['program']['qbStats']={'visible':False,'team':side}
    elif action=='load_season_stats':
        player=next((x for x in STATE['teams'][side]['roster'] if x['id']==p.get('playerId')),None)
        passing=(player or {}).get('seasonStats',{}).get('passing',{})
        if not passing:raise ValueError('No published 2026 passing stats for this player.')
        fields={'qbSeasonComp':'completions','qbSeasonAtt':'passingAttempts','qbSeasonYards':'passingYards','qbSeasonTD':'passingTouchdowns','qbSeasonINT':'interceptions'}
        cue={'type':'quarterback','team':side,'qbIntroMode':'season','qbSeasonLabel':'2026 REGULAR SEASON'}
        for key,stat in fields.items():cue[key]=int(passing.get(stat,{}).get('value') or 0)
        update('lineup',{'team':side,'quarterback':player['id']});update('preview',cue)
    elif action=='score':
        old=g['scores'][side]
        g['scores'][side]=max(0,min(999,int(p.get('value',old+int(p.get('delta',0))))))
        if g['scores'][side]!=old:
            notices=STATE['program'].setdefault('scoreNotices',{})
            if g['scores'][side]>old:
                notice={'team':side,'delta':g['scores'][side]-old,'until':time.time()+1.8}
                notices[side]=notice;STATE['program']['scoreNotice']=notice
            else:
                notices.pop(side,None)
                if STATE['program'].get('scoreNotice',{}).get('team')==side: STATE['program'].pop('scoreNotice',None)
    elif action=='timeout':
        old=g['timeouts'][side]
        g['timeouts'][side]=max(0,min(3,int(p['value']) if 'value' in p else old+int(p.get('delta',0))))
        if g['timeouts'][side]<old:
            STATE['program']['timeoutNotice']={'team':side,'until':time.time()+6,'remaining':g['timeouts'][side]}

    elif action=='game':
        for k,v in p.items():
            if k in ['flag','showPlayClock','showDownDistance','showInfo','showBallPosition']:
                if type(v) is not bool: raise ValueError('Invalid toggle.')
            elif k=='possession':
                if v not in ['away','home','none']: raise ValueError('Invalid possession.')
            elif k=='overtimePeriod':
                v=int(v)
                if not 1<=v<=99: raise ValueError('Overtime number must be between 1 and 99.')
            elif k=='quarter':
                if v not in ['1ST','2ND','3RD','4TH','OT','HALF','FINAL']: raise ValueError('Invalid quarter.')
            elif k=='bottomStatus':
                if v=='OT': v='LIVE'
                if v not in ['LIVE','HALFTIME','FINAL','FINAL/OT','END OF REGULATION']: raise ValueError('Invalid bottom-strip status.')
            elif k=='down':
                if v in ['KICK','PAT']: v='1ST'
                if v not in ['1ST','2ND','3RD','4TH','2ND DOWN','3RD DOWN','4TH DOWN']: raise ValueError('Invalid down.')
            elif k in ['distance','ballOn']: v=bounded_text(v,10)
            else: raise ValueError('Invalid game field.')
            if k=='quarter': g['bottomStatus']={'HALF':'HALFTIME','FINAL':'FINAL'}.get(v,'LIVE')
            g[k]=v
            if k=='showPlayClock': g.pop('playClockHideAt',None)
    elif action=='play_clock_preset':
        seconds=int(p['seconds'])
        if not 1<=seconds<=99: raise ValueError('Play clock preset must be 1–99 seconds.')
        c=g['playClock']
        if c['running'] and remaining(c)>0 and c.get('preset')==seconds:
            _update('clock',{'key':'playClock','running':False})
        else:
            c['preset']=seconds
            _update('clock',{'key':'playClock','seconds':seconds,'running':True})
    elif action=='clock':
        key=p.get('key','clock')
        if key not in ['clock','playClock']: raise ValueError('Invalid clock.')
        c=g[key];now=time.time(); value=remaining(c)
        if 'seconds' in p:
            value=float(p['seconds'])
            if not math.isfinite(value) or not 0<=value<=5999: raise ValueError('Clock must be between 0:00 and 99:59.')
        c.update(remaining=value,anchor=now,running=bool(p.get('running',c['running'])) and value>0)
        if key=='playClock':
            if c['running']:
                g['showPlayClock']=True;g.pop('playClockHideAt',None)
                if 'seconds' in p or not g.get('playClockRevealId'): g['playClockRevealId']=g.get('playClockRevealId',0)+1
            elif g['showPlayClock']:
                g['playClockHideAt']=now+2

    elif action=='team':
        t=STATE['teams'][side]
        p=dict(p)
        if p.get('name',t['name'])!=t['name'] and p.get('shortName',t.get('shortName'))==t.get('shortName'):
            p['shortName']=(bounded_text(p['name'],50).split() or [''])[-1]
        for k,v in p.items():
            if k=='team': continue
            if k in ['name','shortName','abbr','record','coach']: t[k]=bounded_text(v,50 if k!='abbr' else 5)
            elif k in ['color','secondary']: t[k]=color(v)
            elif k in ['logo','heroLogo'] and valid_image(v): t[k]=v
            else: raise ValueError('Invalid team field or image. Use PNG, JPEG, or WebP under 2 MB.')
    elif action=='branding':
        for k,v in p.items():
            if k in ['network','competition','venue','city','sponsorName']: STATE['branding'][k]=bounded_text(v,100)
            elif k=='stateAbbr':
                value=str(v).strip().upper()
                if value and (len(value)!=2 or not value.isascii() or not value.isalpha()): raise ValueError('Use a two-letter state abbreviation, such as TX.')
                STATE['branding'][k]=value
            elif k in ['networkLogo','sponsorLogo','secondaryLogo'] and valid_image(v): STATE['branding'][k]=v
            elif k in ['accent','sponsorColor']: STATE['branding'][k]=color(v)
            elif k=='crew':
                if not isinstance(v,list) or len(v)>50: raise ValueError('Use up to 50 crew members.')
                clean=[];ids=set()
                for row in v:
                    if not isinstance(row,dict): raise ValueError('Invalid crew member.')
                    member={key:bounded_text(row.get(key,''),120) for key in ['id','name','role']}
                    if not member['id'] or member['id'] in ids or not member['name'].strip(): raise ValueError('Crew members need unique IDs and names.')
                    ids.add(member['id']);clean.append(member)
                STATE['branding']['crew']=clean
            elif k=='bugScale': STATE['branding'][k]=max(.65,min(1.4,float(v)))
            elif k=='bugBottom': STATE['branding'][k]=max(20,min(240,int(v)))
            else: raise ValueError('Invalid branding setting.')
    elif action=='roster':
        rows=p['players']
        if not isinstance(rows,list) or not 0<=len(rows)<=100: raise ValueError('Roster must have 0–100 players.')
        ids=set();clean=[]
        for row in rows:
            r={k:bounded_text(row.get(k,''),120 if k=='id' else 80 if k=='name' else 30) for k in ['id','name','number','position']}
            if not r['id'] or r['id'] in ids or not r['name']: raise ValueError('Players need unique IDs and names.')
            ids.add(r['id']);r['photo']=row.get('photo','')
            if not valid_image(r['photo']): raise ValueError('Invalid player photo.')
            stats=row.get('stats',{})
            if not isinstance(stats,dict) or len(stats)>4: raise ValueError('Use up to four player stats.')
            r['stats']={bounded_text(k,16):bounded_text(v,24) for k,v in stats.items()}
            previous=next((x for x in STATE['teams'][side]['roster'] if x['id']==r['id']),{})
            for key in ['sourceId','seasonStats','statsStatus','status','sourceUrl','statsSource']:
                if key in previous:r[key]=copy.deepcopy(previous[key])
            r['rookie']=row.get('rookie',previous.get('rookie',False))
            if type(r['rookie']) is not bool: raise ValueError('Rookie must be on or off.')
            clean.append(r)
        lu=STATE['lineups'][side]
        assigned=set(lu['offense']+lu['defense']+[lu['quarterback']])
        for group in ['offense','defense']: lu[group]=[i if i in ids else '' for i in lu[group]]
        if lu['quarterback'] not in ids: lu['quarterback']=''
        lu['specialTeams']={k:v if v in ids else '' for k,v in lu.get('specialTeams',{}).items()}
        STATE['teams'][side]['roster']=clean
    elif action=='staff':
        rows=p.get('members',[])
        if not isinstance(rows,list) or len(rows)>50: raise ValueError('Use up to 50 staff members.')
        clean=[{k:bounded_text(row.get(k,''),120) for k in ['id','name','role','detail']} for row in rows]
        if any(not r['id'] or not r['name'] or not r['role'] for r in clean) or len({r['id'] for r in clean})!=len(clean): raise ValueError('Staff need unique IDs, names and roles.')
        STATE['teams'][side]['staff']=clean
    elif action=='lineup':
        lu=copy.deepcopy(STATE['lineups'][side]);ids={x['id'] for x in STATE['teams'][side]['roster']}
        for k,v in p.items():
            if k=='team': continue
            if k=='rookies':
                if not isinstance(v,dict) or not set(v).issubset(ids) or any(type(flag) is not bool for flag in v.values()): raise ValueError('Choose rookie status for roster players.')
                continue
            if k=='formation':
                if v not in FORMATION_LABELS: raise ValueError('Invalid formation.')
            elif k in ['offense','defense']:
                if not isinstance(v,list) or len(v)!=(10 if k=='offense' else 11) or len(set(x for x in v if x))!=len([x for x in v if x]) or not set(v).issubset(ids|{''}): raise ValueError('Select a different roster player in each slot.')
            elif k=='specialTeams':
                if not isinstance(v,dict) or set(v)-{'kicker','punter','holder','longSnapper','kickReturner','puntReturner'} or any(x not in ids|{''} for x in v.values()): raise ValueError('Choose special teams players from this team.')
                v={**lu.get('specialTeams',{}),**v}
            elif k=='quarterback':
                if v not in ids|{''}: raise ValueError('Select a quarterback.')
            else: raise ValueError('Invalid lineup field.')
            lu[k]=v
        if lu['quarterback'] and lu['quarterback'] in lu['offense']: raise ValueError('Quarterback must be separate from the ten offensive players.')
        STATE['lineups'][side]=lu
        for player in STATE['teams'][side]['roster']:
            if player['id'] in p.get('rookies',{}): player['rookie']=p['rookies'][player['id']]
    elif action=='preview':
        current=STATE['preview'];kind=p.get('type',current['type']);kind={'matchupfull':'matchup','finalboard':'final'}.get(kind,kind)
        if kind not in GRAPHICS: raise ValueError('Invalid graphic.')
        target_team=p.get('team',current.get('team','away'))
        library=STATE['program'].setdefault('cueLibrary',{})
        library[cue_key(current)]=copy.deepcopy(current)
        style=p.get('transitionStyle',current.get('transitionStyle','team') if current['type']=='transition' else STATE['program'].get('lastTransitionStyle','team'))
        key=cue_key({'type':kind,'team':target_team,'transitionStyle':style})
        cue=copy.deepcopy(current) if key==cue_key(current) else copy.deepcopy(library.get(key,initial_cue(kind,target_team)))
        if kind=='transition':
            cue['transitionStyle']=style
            STATE['program']['lastTransitionStyle']=style
        cue.setdefault('outTransition',cue.get('transition','auto'))
        for k,v in p.items():
            if k=='type':
                v={'matchupfull':'matchup','finalboard':'final'}.get(v,v)
                if v not in GRAPHICS: raise ValueError('Invalid graphic.')
            elif k=='team':
                if v not in ['away','home']: raise ValueError('Invalid team.')
            elif k in ['transition','outTransition']:
                v={'cut':'auto','rail':'auto'}.get(v,v)
                if v not in ['auto','fade']: raise ValueError('Invalid transition.')
            elif k=='sideStatsLayout':
                if v not in ['qb','rushing','receiving','rushing-qb','receiving-qb']: raise ValueError('Invalid side stats layout.')
            elif k in ['sideCount','sideYards','sideTD']:
                v=int(v)
                if not (-999 if k=='sideYards' else 0)<=v<=9999: raise ValueError('Invalid player stat value.')
            elif k=='sidePlayerId':
                v=bounded_text(v,120)
                if v and not any(x['id']==v for x in STATE['teams'][target_team]['roster']): raise ValueError('Choose a player from the selected team.')
            elif k=='qbIntroMode':
                if v not in ['feature','season']: raise ValueError('Choose featured text or season stats.')
            elif k in ['qbSeasonComp','qbSeasonAtt','qbSeasonYards','qbSeasonTD','qbSeasonINT']:
                v=int(v)
                if not (-9999 if k=='qbSeasonYards' else 0)<=v<=99999: raise ValueError('Invalid season total.')
            elif k=='timeoutNumber':
                v=int(v)
                if v not in [0,1,2,3]: raise ValueError('Choose automatic or timeout 1, 2 or 3.')
            elif k=='lineupGroup':
                v=int(v)
                if not 0<=v<=2: raise ValueError('Choose lineup group 0, 1, or 2.')
            elif k=='lineupPhase':
                if v not in ['title','players']: raise ValueError('Choose title or players.')
            elif k=='situationKind':
                if v not in ['fieldgoal','kicker','punt','third','fourth']: raise ValueError('Invalid situational graphic.')
            elif k=='breakLayout':
                if v not in ['small','large','stinger']: raise ValueError('Invalid break layout.')
            elif k in ['drivePlays','driveYards','attemptDistance','kickerMade','kickerAttempts','kickerLong','conversions','attempts']:
                v=int(v)
                if not 0<=v<=999: raise ValueError('Use a number between 0 and 999.')
            elif k=='conversionDistances':
                if isinstance(v,str): v=[x.strip() for x in v.split(',') if x.strip()]
                if not isinstance(v,list) or len(v)>999: raise ValueError('Use up to 999 attempt distances.')
                v=[float(x) for x in v]
                if any(not math.isfinite(x) or x<0 or x>100 for x in v): raise ValueError('Attempt distances must be 0–100 yards.')
            elif k in ['qbContextYellow','tier1Yellow','tier2Yellow','tier3Yellow']:
                if isinstance(v,str): v=v=='true'
                if type(v) is not bool: raise ValueError('Invalid highlight toggle.')
            elif k=='standingsRows':
                if isinstance(v,str):
                    v=[dict(zip(['name','wins','losses','ties'],line.split('|'))) for line in v.splitlines() if line.strip()]
                if not isinstance(v,list) or len(v)>8: raise ValueError('Use up to eight standings rows.')
                v=[{'name':bounded_text(row.get('name','').strip(),40),**{key:max(0,min(99,int(row.get(key,0) or 0))) for key in ['wins','losses','ties']}} for row in v]
            elif k in ['tier1Away','tier1Home','tier2Away','tier2Home','tier3Away','tier3Home','refereeName','refereeRole','refereeExperience','tier1','tier2','tier3','tierBottom','divisionTitle','conversionLayout','flagVariant','penaltyType','penaltyPlayer','penaltyDetail','transitionStyle','transitionTitle','transitionPerson','transitionDetail','transitionDuration']:
                v=bounded_text(v,160)
            elif k=='rosterPage':
                v=int(v)
                if not 1<=v<=4: raise ValueError('Roster page must be between 1 and 4.')
            elif k in ['qbComp','qbAtt','qbYards','qbTD','qbINT']:
                v=int(v)
                if not 0<=v<=9999: raise ValueError('QB stats must be between 0 and 9999.')
            elif k=='stats':
                if not isinstance(v,list) or len(v)>6: raise ValueError('Use up to six comparison rows.')
                v=[{f:bounded_text(x.get(f,''),40) for f in ['label','away','home']} for x in v]
            elif k in ['title','subtitle','event','period','nextAway','nextHome','nextTime','playerId','leftName','leftRole','rightName','rightRole','sponsorTitle','sponsorSubtitle','sponsorNext','weatherTemp','weatherWind','weatherForecast','reporterName','qbValue','qbLabel','qbDetail','qbSeasonLabel','staffId','staffName','staffRole','staffDetail','situationDetail','breakHeadline','breakDetail','driveTime','driveResult','driveNote','kickerId','kickerContext']: v=bounded_text(v,120)
            else: raise ValueError('Invalid graphic field.')
            cue[k]=v
        if cue.get('type')=='quarterback' and cue.get('qbIntroMode')=='season':
            if cue.get('qbSeasonComp',0)>cue.get('qbSeasonAtt',0) or cue.get('qbSeasonTD',0)>cue.get('qbSeasonComp',0) or cue.get('qbSeasonINT',0)>cue.get('qbSeasonAtt',0): raise ValueError('Completions and interceptions cannot exceed attempts; touchdowns cannot exceed completions.')
        if cue.get('type')=='situation' and cue.get('conversions',0)>cue.get('attempts',0): raise ValueError('Conversions cannot exceed attempts.')
        if cue.get('type')=='qbstats' and cue.get('qbComp',0)>cue.get('qbAtt',0): raise ValueError('Completions cannot exceed attempts.')
        if cue.get('situationKind')=='kicker' and cue.get('kickerMade',0)>cue.get('kickerAttempts',0): raise ValueError('Made field goals cannot exceed attempts.')
        if cue.get('kickerId') and not any(x['id']==cue['kickerId'] and x['position']=='K' for x in STATE['teams'][target_team]['roster']): raise ValueError('Select a kicker from this team.')
        if kind=='matchup': cue['transition']='fade'
        STATE['preview']=cue
        library[cue_key(cue)]=copy.deepcopy(cue)
    elif action=='update_live':
        if STATE['preview']['type']=='qbstats':
            if not STATE['program'].get('qbStats',{}).get('visible'): raise ValueError('Show QB stats before updating them on air.')
            STATE['program']['qbStats']={**copy.deepcopy(STATE['preview']),'visible':True}
            return
        if STATE['preview']['type'] != STATE['program']['graphic']['type']: raise ValueError('Take this graphic live before updating it on air.')
        if STATE['program'].get('timedGraphic',{}).get('takeId')==STATE['program']['takeId']: raise ValueError('This timed bumper must finish. Take the edited preset to replay it.')
        STATE['program']['graphic']=copy.deepcopy(STATE['preview'])
    elif action=='lineup_step':
        # A running sequence advances Program without changing the operator's editor.
        if p.get('expectedTakeId') != STATE['program']['takeId']:
            raise ValueError('Lineup playback was replaced by another graphic.')
        cue=p.get('cue',{})
        if not isinstance(cue,dict) or cue.get('type') not in ['offense','defense']:
            raise ValueError('Invalid lineup cue.')
        selected=copy.deepcopy(STATE['preview'])
        try:
            _update('preview',cue)
            _update('take',{})
        finally:
            STATE['preview']=selected
    elif action=='take':
        if STATE['preview']['type']=='qbstats':
            STATE['program']['qbStats']={**copy.deepcopy(STATE['preview']),'visible':True}
            return
        if STATE['preview']['type']=='scorebug': STATE['program']['bug']=True
        STATE['program']['graphic']=copy.deepcopy(STATE['preview']);STATE['program']['takeId']+=1
        STATE['program'].pop('timedGraphic',None)
        if STATE['preview']['type']=='transition' and STATE['preview'].get('transitionStyle')=='matchup':
            duration=float(STATE['preview'].get('transitionDuration') or 2.6)
            if not math.isfinite(duration): raise ValueError('Invalid bumper duration.')
            duration=max(1.2,min(15,duration))
            STATE['program']['timedGraphic']={'takeId':STATE['program']['takeId'],'until':time.time()+duration}
            STATE['program']['graphic']['transitionDuration']=str(duration)
    elif action=='hide':
        if STATE['program']['graphic']['type']=='scorebug': STATE['program']['bug']=False
        STATE['program']['graphic']={'type':'none'};STATE['program']['takeId']+=1
    elif action=='qb_stats_visibility':
        if type(p.get('visible')) is not bool: raise ValueError('Invalid QB visibility.')
        STATE['program'].setdefault('qbStats',{'team':'away'})['visible']=p['visible']
    elif action=='watermark': STATE['program']['watermark']=bool(p['visible'])
    elif action=='bug':
        STATE['program']['bug']=bool(p['visible'])
        if not p['visible'] and STATE['program']['graphic']['type']=='scorebug': STATE['program']['graphic']={'type':'none'}
    elif action=='clear':
        STATE['program'].setdefault('qbStats',{})['visible']=False
        STATE['program'].update(bug=False,watermark=False,graphic={'type':'none'},takeId=STATE['program']['takeId']+1)
    elif action=='playlist_save':
        rows=p.get('items',[])
        if not isinstance(rows,list) or len(rows)>100: raise ValueError('Use up to 100 playlist items.')
        selected=copy.deepcopy(STATE['preview']);clean=[];ids=set()
        try:
            for row in rows:
                if not isinstance(row,dict) or not isinstance(row.get('cue'),dict): raise ValueError('Invalid playlist item.')
                key=bounded_text(row.get('id',''),80)
                if not key or key in ids: raise ValueError('Playlist items need unique IDs.')
                ids.add(key)
                seconds=float(row.get('seconds',8))
                if not math.isfinite(seconds) or seconds<1 or seconds>300: raise ValueError('Hold time must be 1–300 seconds.')
                _update('preview',row['cue'])
                clean.append({'id':key,'name':bounded_text(row.get('name','Graphic'),100),'seconds':seconds,'cue':copy.deepcopy(STATE['preview'])})
        finally: STATE['preview']=selected
        STATE['program']['playlist']=clean
    elif action=='playlist_take':
        item=next((x for x in STATE['program'].get('playlist',[]) if x['id']==p.get('id')),None)
        if not item: raise ValueError('Playlist item no longer exists.')
        _update('preview',copy.deepcopy(item['cue']))
        _update('take',{})
    elif action=='transition_preset':
        presets=STATE['program'].setdefault('transitionPresets',{})
        key=bounded_text(p.get('id',''),80)
        if not key: raise ValueError('Preset needs an ID.')
        if p.get('delete'):
            presets.pop(key,None)
        elif p.get('load'):
            if key not in presets: raise ValueError('Preset not found.')
            update('preview',copy.deepcopy(presets[key]['cue']))
        else:
            if STATE['preview']['type']!='transition': raise ValueError('Select a transition first.')
            if key not in presets and len(presets)>=40: raise ValueError('Use up to 40 transition presets.')
            presets[key]={'name':bounded_text(p.get('name','Transition'),60),'cue':copy.deepcopy(STATE['preview'])}
    elif action=='reset_show':
        if p.get('confirm')!='CLEAR SHOW': raise ValueError('Type CLEAR SHOW to reset all show data.')
        fresh=default_state()
        for team in fresh['teams'].values():
            team.update(name='',shortName='',abbr='',record='',logo='',heroLogo='',coach='',color='#163044',secondary='#81929c',roster=[])
        for lu in fresh['lineups'].values(): lu.update(offense=['']*10,defense=['']*11,quarterback='',specialTeams={k:'' for k in lu['specialTeams']})
        for team in fresh['teams'].values(): team['staff']=[]
        fresh['branding'].update(network='',competition='',venue='',networkLogo='',sponsorName='',sponsorLogo='',secondaryLogo='')
        fresh['program'].update(emptyShow=True,bug=False,watermark=False,graphic={'type':'none'},qbStats={'visible':False,'team':'away'},cueLibrary={})
        fresh['preview']=initial_cue('scorebug')
        fresh['preview']={'type':'scorebug','team':'away','transition':'auto','outTransition':'auto','stats':[]}
        revision=STATE['revision'];STATE.clear();STATE.update(fresh);STATE['revision']=revision
    elif action=='restore':
        STATE.pop('teamSelections',None)
        src=p.get('state')
        # Restoring uses the same field validation as live edits; clocks always restore paused.
        if not isinstance(src,dict): raise ValueError('Invalid show file.')
        fresh=default_state(); STATE.clear();STATE.update(fresh)
        for side in ['away','home']:
            t=src['teams'][side]
            update('team',dict(team=side,**{k:v for k,v in t.items() if k not in ['roster','staff']}))
            update('staff',{'team':side,'members':t.get('staff',[])})
            # Validate imported lineups against roster after staging imported IDs.
            STATE['lineups'][side]=copy.deepcopy(src['lineups'][side])
            update('roster',{'team':side,'players':t['roster']})
            update('lineup',dict(team=side,**src['lineups'][side]))
        update('branding',src['branding']);gg=src['game']
        update('game',{k:v for k,v in gg.items() if k not in ['scores','timeouts','clock','playClock']})
        for side in ['away','home']:
            update('score',{'team':side,'value':gg['scores'][side]});update('timeout',{'team':side,'value':gg['timeouts'][side]})
        for key in ['clock','playClock']: update('clock',{'key':key,'seconds':gg[key]['remaining'],'running':False})
        saved_library=src.get('program',{}).get('cueLibrary',{})
        if not isinstance(saved_library,dict) or len(saved_library)>100: raise ValueError('Invalid graphics library.')
        for saved_cue in saved_library.values():
            if not isinstance(saved_cue,dict): raise ValueError('Invalid saved graphic.')
            update('preview',saved_cue)
        saved_qb=src.get('program',{}).get('qbStats',{})
        if saved_qb.get('type')=='qbstats':
            update('preview',{k:v for k,v in saved_qb.items() if k!='visible'})
            STATE['program']['qbStats']={**copy.deepcopy(STATE['preview']),'visible':False}
        update('playlist_save',{'items':src.get('program',{}).get('playlist',[])})
        update('preview',src['preview'])
        STATE['program'].update(bug=False,watermark=False,graphic={'type':'none'})
    else: raise ValueError('Unknown action.')


def pages_snapshot():
    return json.dumps({'state':STATE,'library':LIBRARY.overrides})

def pages_request(raw):
    request=json.loads(raw);endpoint=request.get('endpoint');query=request.get('query',{})
    try:
        expire_timed_graphic();expire_play_clock()
        if endpoint=='teams':
            key=query.get('id','')
            data=LIBRARY.get(key) if key else {'teams':LIBRARY.summaries(),'selected':STATE.get('teamSelections',{})}
        elif endpoint in ['state','export']:
            if endpoint=='state' and str(query.get('since',''))==str(STATE['revision']):return json.dumps({'status':204})
            data=copy.deepcopy(STATE)
            if endpoint=='export':
                for key in ['clock','playClock']:data['game'][key].update(remaining=remaining(STATE['game'][key]),running=False,anchor=time.time())
            data['serverTime']=time.time()
        elif endpoint=='action':
            body=request['body']
            if body.get('revision')!=STATE['revision']:return json.dumps({'status':409,'data':{'error':'Another control changed the show. Try again.'}})
            before=copy.deepcopy(STATE);library_before=copy.deepcopy(LIBRARY.overrides);teams_before=copy.deepcopy(LIBRARY.teams)
            try:
                update(body['action'],body.get('payload',{}));STATE['revision']=before['revision']+1;save()
            except Exception:
                STATE.clear();STATE.update(before);LIBRARY.overrides=library_before;LIBRARY.teams=teams_before
                raise
            data=copy.deepcopy(STATE);data['serverTime']=time.time()
        else:raise ValueError('Unknown browser endpoint')
        return json.dumps({'status':200,'data':data})
    except (ValueError,KeyError,TypeError,OverflowError) as error:return json.dumps({'status':400,'data':{'error':str(error)}})
