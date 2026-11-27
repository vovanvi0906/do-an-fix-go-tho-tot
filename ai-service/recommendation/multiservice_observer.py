"""Main observable-sign pilot: multi-class expert plus a dedicated crack expert.

Image evidence stays separate from confirmed symptoms, category and service decisions.
"""
import json
import logging
import math
import os
import threading
from pathlib import Path
from recommendation.observable_candidate import digest,empty,load_candidate

DEFAULT_MANIFEST=Path(__file__).resolve().parents[1]/'weights/multiservice-observer-v2-gated/release.json'
SERVICE_GROUPS={'sua-dien','sua-nuoc','dien-lanh','thiet-bi','giup-viec','lam-vuon'}

def enabled():return os.environ.get('MULTISERVICE_OBSERVER_ENABLED','true')=='true'

def no_result(status):
    return {**empty(status),'modelVersion':None,'releaseSha256':None,'models':[],
            'coverage':[],'degradedModels':[],'unavailableSigns':[],'qualityStatus':'PILOT_AI_UNVERIFIED',
            'evaluationStatus':'development_only','evaluationSampleCount':0}

class MultiServiceObserver:
    def __init__(self,release,experts,release_sha):
        self.release,self.experts,self.release_sha=release,experts,release_sha
        self.lock=threading.Lock()

    def predict(self,image):
        proposals=[];failed=[];models=[];successful=0
        with self.lock:
            for spec,expert in self.experts:
                models.append({'id':spec['id'],'weightsSha256':expert.manifest['weightsSha256']})
                try:result=expert.predict(image)
                except Exception:
                    failed.append(spec['id']);continue
                successful+=1
                for p in result['proposals']:
                    code=p['code']
                    if code not in spec['includeCodes'] or p['confidence']<spec['thresholds'][code]:continue
                    meta=self.release['classes'][code]
                    if not meta.get('enabled',True):continue
                    proposals.append({**p,'objectId':None,'modelId':spec['id'],
                        'geometryType':meta['geometryType'],'relatedServiceGroups':meta['relatedServiceGroups']})
        evaluation=self.release.get('quality',{}).get('evaluation',{})
        return {**no_result('unavailable' if not successful else ('proposed' if proposals else 'no_detection')),
                'modelVersion':self.release['modelVersion'],'releaseSha256':self.release_sha,
                'models':models,'coverage':self.release['coverage'],'degradedModels':failed,
                'evaluationStatus':evaluation.get('status','development_only'),
                'evaluationSampleCount':evaluation.get('cases',0),
                'unavailableSigns':[{'code':code,'name':meta['name'],'reason':'insufficient_development_quality'} for code,meta in self.release['classes'].items() if not meta.get('enabled',True)],
                'proposals':sorted(proposals,key=lambda p:p['confidence'],reverse=True)[:50],
                'scoreType':'UNCALIBRATED_DETECTOR_SCORE'}

def load_observer():
    if not enabled():return None
    try:
        path=Path(os.environ.get('MULTISERVICE_OBSERVER_MANIFEST',str(DEFAULT_MANIFEST))).resolve()
        release=json.loads(path.read_text())
        if release.get('schema')!='fixgo.multiservice-observer.v1' or release.get('status')!='PILOT_AI_UNVERIFIED':raise ValueError('Release schema/status')
        if not isinstance(release.get('modelVersion'),str) or not release['modelVersion']:raise ValueError('Version')
        specs=release['models']
        if not isinstance(specs,list) or not 1<=len(specs)<=6 or len({s['id'] for s in specs})!=len(specs):raise ValueError('Experts')
        seen=set();experts=[]
        for spec in specs:
            manifest=(path.parent/spec['manifest']).resolve()
            if not manifest.is_relative_to(path.parent) or digest(manifest)!=spec['manifestSha256']:raise ValueError('Bundle path/checksum')
            expert=load_candidate(manifest)
            if expert is None:raise ValueError('Expert unavailable')
            include=spec['includeCodes'];available={c['code'] for c in expert.manifest['classes']}
            if not isinstance(include,list) or not include or len(set(include))!=len(include) or set(include)-available or seen.intersection(include):raise ValueError('Class ownership')
            seen.update(include)
            for code in include:
                threshold=spec['thresholds'][code];meta=release['classes'][code]
                if type(threshold) not in (int,float) or not math.isfinite(threshold) or not expert.manifest['threshold']<=threshold<=1:raise ValueError('Threshold')
                if meta['geometryType'] not in ['device_context','visible_region'] or not isinstance(meta['relatedServiceGroups'],list) or set(meta['relatedServiceGroups'])-SERVICE_GROUPS:raise ValueError('Class metadata')
                if 'enabled' in meta and type(meta['enabled']) is not bool:raise ValueError('Class availability')
                if 'unavailableReason' in meta and (meta.get('enabled',True) or not isinstance(meta['unavailableReason'],str)):raise ValueError('Unavailable reason')
                if meta.get('contextMode','generic') not in ['generic','category']:raise ValueError('Context mode')
                unscoped=meta.get('unscopedThreshold',.6)
                if type(unscoped) not in (int,float) or not math.isfinite(unscoped) or not .05<=unscoped<=1:raise ValueError('Unscoped threshold')
            experts.append((spec,expert))
        if set(release['classes'])!=seen:raise ValueError('Unexpected release classes')
        evaluation=release.get('quality',{}).get('evaluation')
        if evaluation is not None:
            if evaluation.get('status')!='limited_scope_evaluated':raise ValueError('Evaluation status')
            loaded={}
            for kind in ['report','protocol']:
                artifact=(path.parent/evaluation[kind]).resolve()
                if not artifact.is_relative_to(path.parent) or digest(artifact)!=evaluation[kind+'Sha256']:raise ValueError('Evaluation checksum')
                loaded[kind]=json.loads(artifact.read_text())
            if type(evaluation.get('cases')) is not int or evaluation['cases']<1 or loaded['report'].get('cases')!=evaluation['cases'] or loaded['protocol'].get('cases')!=evaluation['cases']:raise ValueError('Evaluation support')
            if loaded['report'].get('productionValidated') is not False or evaluation.get('productionValidated') is not False:raise ValueError('Pilot-only evaluation')
        coverage=release['coverage']
        if not isinstance(coverage,list) or len(coverage)!=6 or {c['categorySlug'] for c in coverage}!=SERVICE_GROUPS:raise ValueError('Coverage')
        for group in coverage:
            if group['status'] not in ['experimental_sign_proposals','no_domain_dataset'] or not isinstance(group['signCodes'],list) or set(group['signCodes'])-seen:raise ValueError('Coverage classes')
            if group['status']=='no_domain_dataset' and group['signCodes']:raise ValueError('Unsupported group')
        return MultiServiceObserver(release,experts,digest(path))
    except Exception:
        logging.getLogger(__name__).warning('Multiservice observer unavailable: invalid or missing release. Category/device recognition remains available.')
        return None

def analyze_observer(image,observer):
    if not enabled():return no_result('disabled')
    if observer is None:return no_result('unavailable')
    try:return observer.predict(image)
    except Exception:return no_result('unavailable')

def scope_observations(analysis,observer,category_slug):
    """Restrict uncertain cross-domain proposals; category is never inferred from signs."""
    if analysis['status'] not in ['proposed','no_detection'] or observer is None:return analysis
    kept=[]
    for proposal in analysis['proposals']:
        meta=observer.release['classes'][proposal['code']]
        if category_slug=='lam-vuon':continue
        if category_slug:
            if meta.get('contextMode','generic')=='category' and category_slug not in proposal['relatedServiceGroups']:continue
        elif proposal['confidence']<meta.get('unscopedThreshold',.6):continue
        kept.append(proposal)
    return {**analysis,'proposals':kept,'status':'proposed' if kept else 'no_detection',
            'suppressedCount':len(analysis['proposals'])-len(kept),
            'contextStatus':'unsupported_category' if category_slug=='lam-vuon' else ('category_scoped' if category_slug else 'unscoped')}
