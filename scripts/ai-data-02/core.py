"""Dataset Studio domain, reusing AI-DATA-01 source IO, pins and writer lock."""
import sys,json,re,math,os,threading,copy,uuid
from datetime import datetime,timezone
from pathlib import Path
REPO=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(REPO/'scripts/ai-data-01'))
from common import canonical,digest,read_asset,Union
from review import Store as SourceStore

STATES={'UNREVIEWED','SOURCE_ANNOTATED','AI_PROPOSED','NEEDS_REVIEW','HUMAN_VERIFIED','REJECTED'}
def now():return datetime.now(timezone.utc).isoformat()
def atomic(path,data):
    path=Path(path);tmp=path.with_name(path.name+'.'+uuid.uuid4().hex+'.tmp')
    with tmp.open('x',encoding='utf-8') as f:f.write(canonical(data)+'\n');f.flush();os.fsync(f.fileno())
    os.replace(tmp,path)
def safe_id(value):
    if not isinstance(value,str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,100}',value):raise ValueError('Invalid image ID')
    return value
def array(value):return json.loads(value or '[]')

class Taxonomy:
    """Existing observable-sign ontology only. No invented knowledge defect taxonomy."""
    def __init__(self,signs):self.signs=signs;self.knowledge_available=False
    def config(self):return {'knowledgeAvailable':False,'status':'NO_AI_KNOWLEDGE_TAXONOMY_INSTALLED','source':'AI-DATA-01 pinned observable bbox ontology; no target-specific approval implied','observableSigns':self.signs,'targetDefectRules':None}

class Studio(SourceStore):
    def __init__(self,inventory,state):
        super().__init__(inventory,state)
        self.taxonomy=Taxonomy(self.signs);self.studio_log=self.state/'studio-events.jsonl';self.studio_head='0'*64;self.revisions={};self.studio_latest={};self.session_file=self.state/'session.json'
        if self.studio_log.is_symlink():raise ValueError('Symlink studio log refused')
        if self.studio_log.exists():
            for line in self.studio_log.read_text().splitlines():
                e=json.loads(line);body={k:v for k,v in e.items() if k!='eventHash'}
                if e['previousHash']!=self.studio_head or digest(canonical(body).encode())!=e['eventHash']:raise ValueError('Studio audit chain corrupted')
                self.studio_head=e['eventHash'];self.revisions.setdefault(e['imageId'],[]).append(e);self.studio_latest[e['imageId']]=e
        self.studio_log_sha=digest(self.studio_log.read_bytes()) if self.studio_log.exists() else None
        self.cache_dir=self.state/'ai-cache';self.cache_dir.mkdir(exist_ok=True)
        pilot=self.audit/'evidence/pilot-review-queue.csv'
        if pilot.exists():
            import csv
            with pilot.open() as f:self.pilot=[r['image_id'] for r in csv.DictReader(f)]
        else:self.pilot=[]
        self.group_exposure={}
        for r in self.rows.values():self.group_exposure.setdefault(r['proposed_source_component'],set()).update(array(r.get('component_exposure_json')))
        self.session=json.loads(self.session_file.read_text()) if self.session_file.exists() else {}
        from source_profiles import Profiles
        self.source_profiles=Profiles(self)
    def check_studio(self):
        self.check()
        if (digest(self.studio_log.read_bytes()) if self.studio_log.exists() else None)!=self.studio_log_sha:raise ValueError('Studio log changed outside writer')
    def ai(self,i):
        p=self.cache_dir/(safe_id(i)+'.json')
        if not p.exists():return None
        d=json.loads(p.read_text());payload={k:v for k,v in d.items() if k!='cacheHash'}
        if digest(canonical(payload).encode())!=d.get('cacheHash') or d.get('contentHash')!=self.rows[i]['sha256']:raise ValueError('AI cache hash/source mismatch')
        active=self.state/'active-model-profile.json'
        if active.exists() and d.get('profileHash')!=json.loads(active.read_text()).get('profileHash'):return None
        return d
    def status(self,i):
        if i in self.studio_latest:return self.studio_latest[i]['reviewStatus']
        if self.ai(i):return 'AI_PROPOSED'
        return 'SOURCE_ANNOTATED' if array(self.rows[i].get('annotations_json')) or array(self.rows[i].get('existing_admin_boxes_json')) else 'UNREVIEWED'
    def detail(self,i):
        r=self.rows[i];source=[]
        for index,b in enumerate(array(r.get('object_box_reuse_candidates_json'))):
            source.append({'id':f'source-{index}','kind':'object','label':b['target_id'],'xyxy':b['candidate_enclosing_xyxy'],'objectId':None,'annotationSource':'SOURCE','geometryTransform':b.get('geometry_transform')})
        return {'row':r,'reviewStatus':self.status(i),'sourceAnnotation':array(r.get('annotations_json')),'sourceBoxes':source,'existingSavedBoxes':array(r.get('existing_admin_boxes_json')),'aiProposal':self.ai(i),'human':self.studio_latest.get(i),'history':self.revisions.get(i,[]),'legacyLocalProposal':self.latest.get(i),'datasetSource':self.source_profiles.for_row(r)}
    def summary(self):
        from collections import Counter
        states=Counter(self.status(i) for i in self.rows)
        return {'images':len(self.rows),'sourceAnnotations':sum(len(array(r.get('annotations_json'))) for r in self.rows.values()),'states':dict(states),'pilotImages':len(self.pilot),'pilotReviewed':sum(self.status(i)=='HUMAN_VERIFIED' for i in self.pilot),'humanVerified':states['HUMAN_VERIFIED'],'independentTestImages':0,'taxonomy':self.taxonomy.config()}
    def validate_boxes(self,boxes,row):
        if not isinstance(boxes,list) or len(boxes)>100:raise ValueError('At most 100 boxes/image')
        ids=set();objects={}
        for b in boxes:
            if not isinstance(b,dict) or set(b)-{'id','kind','label','xyxy','objectId','annotationSource'} or not {'id','kind','label','xyxy'}.issubset(b):raise ValueError('Invalid box schema')
            if not isinstance(b['id'],str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,100}',b['id']) or b['id'] in ids:raise ValueError('Box IDs must be unique')
            ids.add(b['id']);v=b['xyxy']
            if not isinstance(v,list) or len(v)!=4 or not all(type(x) in [int,float] and math.isfinite(x) and 0<=x<=1 for x in v) or not v[0]<v[2] or not v[1]<v[3]:raise ValueError('Invalid finite normalized box')
            if (v[2]-v[0])*int(row['width'])<2 or (v[3]-v[1])*int(row['height'])<2:raise ValueError('Box smaller than 2 pixels')
            if b['kind']=='object':
                if b['label'] not in self.targets:raise ValueError('Unknown target')
                objects[b['id']]=b
            elif b['kind']=='sign':
                if b['label'] not in self.signs:raise ValueError('Not an existing observable sign; invisible faults cannot get boxes')
            else:raise ValueError('Box kind must be object/sign')
        for b in boxes:
            if b['kind']=='sign' and b.get('objectId') not in objects:raise ValueError('Every sign must link to an object instance in this image')
        if boxes and row.get('exif_orientation','1') not in ['', '1']:raise ValueError('EXIF orientation requires explicit coordinate normalization before bbox review')
        return boxes
    def save(self,p):
        with self.mutex:
            self.check_studio();allowed={'imageId','contentHash','expectedRevision','reviewer','note','reviewStatus','outcome','boxes','targetIds','reviewChecks','sourceEvidence','licenseStatus','licenseType','licenseEvidence','licenseConfirmed','classificationTargetId','restoredFrom','sourceProfileHash','reviewAction'}
            if not isinstance(p,dict) or set(p)-allowed:raise ValueError('Unknown review fields')
            i=safe_id(p.get('imageId'));r=self.rows[i];old=self.studio_latest.get(i);expected=(old or {}).get('eventHash')
            if p.get('expectedRevision')!=expected:raise ValueError('Review changed: reload before saving')
            payload=read_asset(r['path'])
            if digest(payload)!=r['sha256'] or p.get('contentHash')!=r['sha256']:raise ValueError('Source changed; review invalidated')
            reviewer=p.get('reviewer','');note=p.get('note','');status=p.get('reviewStatus')
            if not isinstance(reviewer,str) or not 2<=len(reviewer.strip())<=200 or not isinstance(note,str) or not 3<=len(note.strip())<=4000:raise ValueError('Actual reviewer and review note required')
            if status not in ['NEEDS_REVIEW','HUMAN_VERIFIED','REJECTED']:raise ValueError('AI/source statuses cannot be submitted as human verification')
            boxes=copy.deepcopy(self.validate_boxes(p.get('boxes',[]),r))
            for b in boxes:b['annotationSource']='HUMAN_LOCAL_REVIEW'
            tids=p.get('targetIds',[])
            if not isinstance(tids,list) or any(t not in self.targets for t in tids):raise ValueError('Unknown target IDs')
            tids=sorted(set(tids)|{b['label'] for b in boxes if b['kind']=='object'});outcome=p.get('outcome','UNKNOWN')
            if outcome not in ['NORMAL','ABNORMAL','UNKNOWN','OUT_OF_SCOPE','NEEDS_REVIEW']:raise ValueError('Invalid outcome')
            action=p.get('reviewAction')
            if action is not None and (action!='confirm_visible_labels' or status!='HUMAN_VERIFIED'):
                raise ValueError('Invalid explicit review action')
            checks=p.get('reviewChecks',{})
            if action=='confirm_visible_labels':
                checks={k:True for k in ['imageSeen','objectExtent','allSigns','objectAssociation','signTargetCompatibility']}
            if not isinstance(checks,dict) or any(type(v) is not bool for v in checks.values()):raise ValueError('Review checks must be real booleans')
            if status=='HUMAN_VERIFIED':
                if outcome not in ['NORMAL','ABNORMAL','OUT_OF_SCOPE'] or not all(checks.get(k) is True for k in ['imageSeen','objectExtent','allSigns','objectAssociation']):raise ValueError('Explicit per-image review checks and resolved outcome required')
                if outcome=='NORMAL' and (not tids or any(b['kind']=='sign' for b in boxes)):raise ValueError('Normal requires target and no sign assertions')
                if outcome=='ABNORMAL' and (not any(b['kind']=='sign' for b in boxes) or checks.get('signTargetCompatibility') is not True):raise ValueError('Abnormal needs visible sign bbox, object link and explicit target compatibility review')
                if outcome=='OUT_OF_SCOPE' and (tids or boxes):raise ValueError('Out-of-scope cannot contain a supported target or invented target ID')
            profile_hash=p.get('sourceProfileHash')
            if profile_hash:
                p={**p,**self.source_profiles.inherit(r,profile_hash)}
            lic=p.get('licenseStatus','UNVERIFIED');lt=p.get('licenseType','');le=p.get('licenseEvidence','')
            if lic not in ['UNVERIFIED','VERIFIED','RESTRICTED']:raise ValueError('Invalid license status')
            if lic=='VERIFIED' and (p.get('licenseConfirmed') is not True or lt not in ['owned','licensed','permission'] or not isinstance(le,str) or not 20<=len(le.strip())<=5000):raise ValueError('Explicit rights verification, type and actual evidence required')
            source=p.get('sourceEvidence','')
            if not isinstance(source,str) or len(source)>5000:raise ValueError('Invalid source evidence')
            classification=p.get('classificationTargetId')
            if classification and classification not in tids:raise ValueError('Classification target must be reviewed in this image')
            e={'schema':'fixgo.studio.annotation.v1','imageId':i,'sourcePath':r['path'],'contentHash':r['sha256'],'duplicateGroupId':r['proposed_source_component'],'targetId':tids[0] if len(tids)==1 else None,'targetIds':tids,'objectLabel':[self.targets[t]['slug'] for t in tids],'defectLabels':sorted({b['label'] for b in boxes if b['kind']=='sign'}),'boundingBoxes':boxes,'annotationSource':'HUMAN_LOCAL_REVIEW','modelVersion':(self.ai(i) or {}).get('modelVersion'),'reviewStatus':status,'outcome':outcome,'reviewedAt':now(),'reviewer':reviewer.strip(),'reviewerIdentityVerified':False,'note':note.strip(),'reviewChecks':checks,'reviewAction':action,'sourceEvidence':source.strip(),'licenseStatus':lic,'licenseType':lt,'licenseEvidence':le.strip(),'licenseConfirmed':p.get('licenseConfirmed') is True,'classificationTargetId':classification,'approvedGroundTruth':False,'independentlyReviewed':False,'independentTestEligible':False,'sourceProfileHash':profile_hash or None,'restoredFrom':p.get('restoredFrom'),'parentRevision':expected,'previousHash':self.studio_head}
            e['eventHash']=digest(canonical(e).encode())
            with self.studio_log.open('a',encoding='utf-8') as f:f.write(canonical(e)+'\n');f.flush();os.fsync(f.fileno())
            self.studio_head=e['eventHash'];self.studio_log_sha=digest(self.studio_log.read_bytes());self.studio_latest[i]=e;self.revisions.setdefault(i,[]).append(e)
            return e
    def bulk(self,p):
        ids=p.get('imageIds',[])
        if not isinstance(ids,list) or not 1<=len(ids)<=100 or len(set(ids))!=len(ids):raise ValueError('Choose 1..100 images')
        if p.get('reviewStatus') not in ['NEEDS_REVIEW','REJECTED'] or p.get('boxes') or p.get('licenseStatus')=='VERIFIED':raise ValueError('Bulk cannot verify, clone boxes or grant rights')
        results=[]
        for i in ids:
            r=self.rows[i];old=self.studio_latest.get(i,{})
            results.append(self.save({'imageId':i,'contentHash':r['sha256'],'expectedRevision':p.get('expectedRevisions',{}).get(i),'reviewer':p.get('reviewer'),'note':p.get('note'),'reviewStatus':p['reviewStatus'],'outcome':old.get('outcome','UNKNOWN'),'targetIds':p.get('targetIds',old.get('targetIds',[])),'boxes':old.get('boundingBoxes',[]),'licenseStatus':'UNVERIFIED','sourceEvidence':old.get('sourceEvidence','')}))
        return {'saved':len(results)}
    def restore(self,p):
        i=p['imageId'];revision=next((e for e in self.revisions.get(i,[]) if e['eventHash']==p['revision']),None)
        if not revision:raise ValueError('Unknown historical revision')
        return self.save({'imageId':i,'contentHash':self.rows[i]['sha256'],'expectedRevision':p.get('expectedRevision'),'reviewer':p['reviewer'],'note':p['note'],'reviewStatus':'NEEDS_REVIEW','outcome':revision['outcome'],'boxes':revision['boundingBoxes'],'targetIds':revision['targetIds'],'restoredFrom':revision['eventHash'],'sourceEvidence':revision['sourceEvidence'],'licenseStatus':'UNVERIFIED'})
    def save_session(self,p):
        if not isinstance(p,dict) or len(canonical(p))>20000:raise ValueError('Session too large')
        with self.mutex:self.session=p;atomic(self.session_file,p)
        return p
