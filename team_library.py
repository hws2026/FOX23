"""Persistent reusable teams. Seed catalog remains separate from operator edits."""
import copy,json,uuid
from pathlib import Path
class TeamLibrary:
 def __init__(self,root,data):
  self.path=Path(data)/'team-library.json';self.teams={}
  seed=Path(root)/'catalog'/'nfl-2026.json'
  if seed.exists():self.teams={t['id']:t for t in json.loads(seed.read_text())['teams']}
  self.seed=copy.deepcopy(self.teams)
  self.overrides=json.loads(self.path.read_text()) if self.path.exists() else {}
  for team in self.overrides.values():self.fill_photos(team)
  self.teams.update(self.overrides)
 def fill_photos(self,team):
  """Fill missing catalog portraits once; never replace uploads or edited identities."""
  if team.get('photoCatalogVersion',0)>=164:return
  for group in ['roster','staff']:
   source={p['id']:p for t in self.seed.values() for p in t.get(group,[]) if p.get('photo')}
   for person in team.get(group,[]):
    match=source.get(person.get('id'))
    if match and not person.get('photo') and person.get('name','').strip().casefold()==match['name'].strip().casefold():
     person['photo']=match['photo'];person['photoSource']=match.get('photoSource','')
  team['photoCatalogVersion']=164
 def summaries(self):
  return [dict(id=t['id'],name=t['name'],abbr=t['abbr'],color=t['color'],secondary=t['secondary'],players=len(t['roster']),coaches=len(t.get('staff',[])),source=t.get('source',{})) for t in sorted(self.teams.values(),key=lambda t:t['name'])]
 def get(self,key):
  if key not in self.teams:raise ValueError('Select a saved team.')
  return copy.deepcopy(self.teams[key])
 def put(self,t):
  t=copy.deepcopy(t);key=t.setdefault('id','custom-'+str(uuid.uuid4()));updated={**self.overrides,key:t}
  tmp=self.path.with_suffix('.tmp');tmp.write_text(json.dumps(updated,ensure_ascii=False));tmp.replace(self.path)
  self.overrides=updated;self.teams[key]=t;return key

def empty_lineup(t):
 def first(pos):
  matches=[p['id'] for p in t['roster'] if p['position']==pos]
  return matches[0] if len(matches)==1 else ''
 return {'formation':'4-3-4','offense':['']*10,'defense':['']*11,'quarterback':first('QB'),'specialTeams':{'kicker':first('K'),'punter':first('P'),'longSnapper':first('LS'),'holder':'','kickReturner':'','puntReturner':''}}
