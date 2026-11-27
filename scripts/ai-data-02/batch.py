#!/usr/bin/env python3
"""Offline, sequential real CLIP/YOLO proposals. Atomic cache; no human approval."""
import os
os.environ.setdefault('HF_HUB_OFFLINE','1');os.environ.setdefault('TRANSFORMERS_OFFLINE','1');os.environ.setdefault('YOLO_CONFIG_DIR','/tmp/fixgo-studio-ultralytics');os.environ.setdefault('MPLCONFIGDIR','/tmp/fixgo-studio-mpl')
import argparse,csv,json,sys,time,resource,fcntl,threading,importlib.metadata
from pathlib import Path
from core import REPO,Studio,atomic,canonical,digest,read_asset,safe_id,now

class ModelLoadError(RuntimeError):
    pass

DEFAULT_DETECTOR=Path.home()/'Work/datasetai/03-experiments/ai01-task04a-strict-v2/training/weights/best.pt'
def file_hash(path):
    import hashlib
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
    return h.hexdigest()

def profile(catalog,threads=2,detector=DEFAULT_DETECTOR,sign_manifest=None):
    if sign_manifest and json.loads(Path(sign_manifest).read_text()).get('backend')=='grounding-dino':
        from grounding import descriptor
        d=descriptor(sign_manifest,json.loads(catalog.read_text()),json.loads((catalog.parent/'ontology.json').read_text())['signs'])
        result={'schema':'fixgo.studio.model-profile.v1','adapterVersion':'grounding-dino-v1','runtimeEngine':'grounding-dino','cpuThreads':threads,
                'catalogSha256':file_hash(catalog),'ontologySha256':file_hash(catalog.parent/'ontology.json'),'signDetector':d,
                'models':{'groundingDino':{'path':d['path'],'sha256':d['sha256']}},
                'packageVersions':{n:importlib.metadata.version(n) for n in (['torch','transformers','ultralytics'] if d.get('objectDetector') else ['torch','transformers'])},
                'adapterSha256':file_hash(Path(__file__)),'groundingCatalogCodeSha256':file_hash(Path(__file__).with_name('grounding_catalog.py')),'groundingAdapterSha256':file_hash(Path(__file__).with_name('grounding.py'))}
        if d.get('scopeMode')=='catalog-adaptive':
            shared={k:v for k,v in d.items() if k not in ['classes','manifestPath','manifestSha256','explicitTarget','categoryId','broadSceneTargetIds','unsupportedTargetIds']}
            result['compatibilityKey']=digest(canonical({'sharedRuntime':shared,'catalog':result['catalogSha256'],'ontology':result['ontologySha256'],
                'batchCode':result['adapterSha256'],'groundingCode':result['groundingAdapterSha256'],'scopeCode':result['groundingCatalogCodeSha256'],
                'packages':result['packageVersions'],'threads':threads}).encode())
        result['profileHash']=digest(canonical(result).encode());return result
    from huggingface_hub import try_to_load_from_cache
    cached=None
    for name in ['model.safetensors','pytorch_model.bin']:
        candidate=try_to_load_from_cache('openai/clip-vit-base-patch32',name)
        if isinstance(candidate,str) and Path(candidate).is_file():cached=Path(candidate);break
    if cached is None:raise ValueError('CLIP cache missing; no download allowed')
    cls=REPO/'ai-service/weights/yolov8n-cls-fixgo.pt'
    if not cls.is_file():raise ValueError('Existing FixGo classifier missing; no download')
    detector=Path(detector) if detector else None
    files={'clip':cached,'classifier':cls}
    if detector and detector.is_file():files['detector']=detector
    result={'schema':'fixgo.studio.model-profile.v1','adapterVersion':'ai-data-02-v1','cpuThreads':threads,'categoryGate':{'minConfidence':.48,'minMargin':.10},'targetMinCosine':.20,'detectorConfidence':.25,'catalogSha256':digest(catalog.read_bytes()),'models':{k:{'path':str(p),'sha256':file_hash(p),'bytes':p.stat().st_size} for k,p in files.items()},'packageVersions':{n:importlib.metadata.version(n) for n in ['torch','ultralytics','transformers']},'adapterSha256':digest(Path(__file__).read_bytes())}
    if sign_manifest:
        from sign_model import descriptor
        result['signDetector']=descriptor(sign_manifest,json.loads(catalog.read_text()),json.loads((catalog.parent/'ontology.json').read_text())['signs'])
        result['signAdapterSha256']=file_hash(Path(__file__).with_name('sign_model.py'))
    result['inferenceCodeHashes']={f:file_hash(REPO/'ai-service'/f) for f in ['clip_classifier.py','recommendation/category_classifier.py','recommendation/target_matcher.py','recommendation/catalog_manager.py','service_catalog.py']}
    result['profileHash']=digest(canonical(result).encode());return result

class RealModels:
    def __init__(self,p,catalog):
        import cv2,torch
        cv2.setNumThreads(1);torch.set_num_threads(p['cpuThreads'])
        try:torch.set_num_interop_threads(1)
        except RuntimeError:pass
        if p.get('runtimeEngine')=='grounding-dino':
            from grounding import GroundingModel
            self.profile=p;self.grounding=GroundingModel(p['signDetector'],{t['id']:t for t in catalog['targets']});return
        sys.path.insert(0,str(REPO/'ai-service'))
        import clip_classifier as clip
        from ultralytics import YOLO
        self.clip=clip;self.catalog=catalog;cats={c['id']:c for c in catalog['categories']};self.targets={t['id']:t for t in catalog['targets']};self.by_slug={t['slug']:t for t in self.targets.values()}
        targets={t['slug']:{'id':t['id'],'slug':t['slug'],'name':t['name'],'category':cats[t['categoryId']]['slug'],'prompts':t.get('aiPrompts') or [f'a photo of {t["name"]}']} for t in self.targets.values() if t.get('isActive',True)}
        # Process-local catalog provider, not mocked inference and not a production code edit.
        clip.fetch_targets_from_backend=lambda:targets
        if not clip.load_clip():raise ValueError('CLIP offline load failed')
        self.classifier=YOLO(p['models']['classifier']['path']);self.detector=YOLO(p['models']['detector']['path']) if 'detector' in p['models'] else None
        if self.classifier.task!='classify' or self.detector and self.detector.task!='detect':raise ValueError('Unexpected existing model task')
        from sign_model import SignModel
        self.sign_model=SignModel(p['signDetector'],self.targets) if p.get('signDetector') else None
        self.profile=p
    def predict(self,row):
        if hasattr(self,'grounding'):return self.grounding.prediction(row,self.profile)
        import numpy as np,cv2
        from recommendation.category_classifier import evaluate_categories
        from recommendation.target_matcher import match_targets
        payload=read_asset(row['path'])
        if digest(payload)!=row['sha256']:raise ValueError('Source content hash changed')
        im=cv2.imdecode(np.frombuffer(payload,np.uint8),1)
        if im is None or im.shape[0]*im.shape[1]>25_000_000:raise ValueError('Unreadable/oversize input')
        stages={};t=time.perf_counter();clip=self.clip.predict_clip_full(im)
        if clip is None:raise ValueError('CLIP image inference failed')
        stages['clipMs']=(time.perf_counter()-t)*1000;t=time.perf_counter()
        pred=self.classifier.predict(im,device='cpu',save=False,verbose=False)[0];probs={pred.names[i].replace('-','_'):float(v) for i,v in enumerate(pred.probs.data.tolist())}
        stages['classifierMs']=(time.perf_counter()-t)*1000
        cat,score,candidates,source=evaluate_categories(clip['category_probs'],probs,'')
        from recommendation.catalog_manager import get_catalog_state
        state=get_catalog_state();targets=match_targets(clip['img_feat'],cat,state['targets'],state['target_embeddings'],top_k=3) if cat else []
        for c in targets:
            tmeta=self.targets[c['targetId']];c.update(categoryId=tmeta['categoryId'],scoreType='cosine and affine similarity, NOT calibrated probability',model='CLIP ViT-B/32',modelVersion=self.profile['models']['clip']['sha256'],provenance='REAL_OFFLINE_CLIP_CURRENT_IMAGE')
        boxes=[];start=time.perf_counter()
        if self.detector:
            detection=self.detector.predict(im,device='cpu',conf=.25,save=False,verbose=False)[0]
            for n,(cls,conf,xy) in enumerate(zip(detection.boxes.cls.tolist(),detection.boxes.conf.tolist(),detection.boxes.xyxyn.tolist())):
                slug=detection.names[int(cls)];tmeta=self.by_slug.get(slug)
                if tmeta:boxes.append({'id':f'ai-object-{n}','kind':'object','label':tmeta['id'],'xyxy':xy,'objectId':None,'annotationSource':'AI','score':float(conf),'targetSlug':slug,'categoryId':tmeta['categoryId'],'modelVersion':self.profile['models']['detector']['sha256']})
        sign_issues=[]
        if self.sign_model:boxes,sign_issues=self.sign_model.predict(im,boxes)
        stages['detectorMs']=(time.perf_counter()-start)*1000
        if not targets and boxes:
            for b in sorted((b for b in boxes if b['kind']=='object'),key=lambda b:b['score'],reverse=True):
                if b['label'] not in {t['targetId'] for t in targets}:
                    tm=self.targets[b['label']];targets.append({'targetId':tm['id'],'targetName':tm['name'],'categoryId':tm['categoryId'],'confidence':b['score'],'scoreType':'YOLO confidence, NOT calibrated probability','model':'existing strict-v2 object detector','modelVersion':b['modelVersion'],'provenance':'REAL_OFFLINE_OBJECT_DETECTION'})
                if len(targets)==3:break
        for candidate in candidates:
            meta=next((c for c in self.catalog['categories'] if c['slug']==candidate['slug']),None)
            candidate['categoryId']=meta['id'] if meta else None
            candidate['id']=meta['id'] if meta else None
        catmeta=next((c for c in self.catalog['categories'] if c['slug']==cat),None)
        return {'category':{'id':catmeta['id'],'slug':cat,'score':score,'source':source} if catmeta else None,'targetCandidates':targets[:3],'categoryCandidates':candidates,'boxes':boxes,'uncertain':not bool(cat and targets),'scopeDecision':'UNKNOWN_OR_OUT_OF_SCOPE_CANDIDATE' if not cat else 'SUPPORTED_CATEGORY_CANDIDATE','visibleDefects':[b['label'] for b in boxes if b['kind']=='sign'] if self.sign_model else None,'signCapability':bool(self.sign_model),'signIssues':sign_issues,'defectNote':'Optional local model proposals, unverified; no absence/normal guarantee' if self.sign_model else 'Existing classifier/detector does not predict defect classes; source/user annotation only','stagesMs':stages}

def scope_hash(row,p):
    if p.get('runtimeEngine')=='grounding-dino' and p.get('signDetector',{}).get('scopeMode')=='catalog-adaptive':
        from grounding_catalog import image_scope
        classes,warnings=image_scope(p['signDetector'],row)
        return digest(canonical({'targetIds':sorted(c['targetId'] for c in classes),'warnings':warnings}).encode())
    return None

def valid_cache(path,row,p):
    if not path.exists():return False
    try:
        c=json.loads(path.read_text());return c['profileHash']==p['profileHash'] and c.get('scopeHash')==scope_hash(row,p) and c['contentHash']==row['sha256'] and digest(canonical({k:v for k,v in c.items() if k!='cacheHash'}).encode())==c['cacheHash'] and c.get('technicalStatus')=='SUCCESS'
    except (ValueError,KeyError):return False

def run(inventory,state,ids,threads=2,ram_mb=3072,detector=DEFAULT_DETECTOR,*,max_images=500,sign_manifest=None,stop_path=None):
    state=state.resolve()
    for name in ['OMP_NUM_THREADS','MKL_NUM_THREADS','OPENBLAS_NUM_THREADS','NUMEXPR_NUM_THREADS']:os.environ[name]=str(threads)
    if not (state/'inventory-pin.json').exists():s=Studio(inventory,state);s.close()
    pin=json.loads((state/'inventory-pin.json').read_text());audit=inventory.parent
    if pin['inventory_sha256']!=digest(inventory.read_bytes()) or pin['catalog_sha256']!=digest((audit/'evidence/catalog.json').read_bytes()) or pin['ontology_sha256']!=digest((audit/'evidence/ontology.json').read_bytes()):raise ValueError('State snapshot pin mismatch')
    with (state/'batch.lock').open('a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        with inventory.open(newline='') as f:rows={r['image_id']:r for r in csv.DictReader(f)}
        if not 1<=len(ids)<=max_images or len(set(ids))!=len(ids) or any(i not in rows for i in ids):raise ValueError(f'1..{max_images} unique known IDs required')
        p=profile(audit/'evidence/catalog.json',threads,detector,sign_manifest);atomic(state/'active-model-profile.json',p);cache=state/'ai-cache';cache.mkdir(exist_ok=True);progress=state/'batch-progress.json'
        job={'startedAt':now(),'status':'RUNNING','requested':len(ids),'processed':0,'cacheHits':0,'succeeded':0,'failed':0,'errors':[],'profileHash':p['profileHash'],'cpuThreads':threads,'rssLimitMiB':ram_mb,'groundTruthCreated':0}
        atomic(progress,job);stop=threading.Event()
        def monitor():
            while not stop.wait(.25):
                rss=int(next(l.split()[1] for l in Path('/proc/self/status').read_text().splitlines() if l.startswith('VmRSS:')))/1024
                if rss>ram_mb:atomic(progress,{**job,'status':'FAILED','error':'RSS_LIMIT_EXCEEDED','observedRssMiB':rss});os._exit(70)
        threading.Thread(target=monitor,daemon=True).start();model=None;seen_hashes={};job['exactDuplicateReuse']=0;started=time.perf_counter()
        try:
            for i in ids:
                if stop_path and Path(stop_path).exists():
                    job.update(status='CANCELLED',finishedAt=now());atomic(progress,job);return job
                row=rows[i];cache_key=(row['sha256'],scope_hash(row,p));path=cache/(safe_id(i)+'.json');t=time.perf_counter()
                try:
                    # Per-image errors must not abort the remaining automated queue.
                    if digest(read_asset(row['path']))!=row['sha256']:raise ValueError('Source changed: '+i)
                    if valid_cache(path,row,p):job['cacheHits']+=1;job['succeeded']+=1
                    elif cache_key in seen_hashes and valid_cache(cache/(seen_hashes[cache_key]+'.json'),row,p):
                        source_id=seen_hashes[cache_key];c=json.loads((cache/(source_id+'.json')).read_text())
                        c.update(imageId=i,sourcePath=row['path'],duplicateGroupId=row['proposed_source_component'],reusedFromImageId=source_id,createdAt=now())
                        c.pop('cacheHash',None);c['cacheHash']=digest(canonical(c).encode());atomic(path,c)
                        job['cacheHits']+=1;job['succeeded']+=1;job['exactDuplicateReuse']+=1
                    else:
                        if model is None:
                            try:model=RealModels(p,json.loads((audit/'evidence/catalog.json').read_text()))
                            except Exception as exc:raise ModelLoadError('Cannot load local models: '+str(exc)) from exc
                        result=model.predict(row)
                        c={'schema':'fixgo.studio.ai-proposal.v1','imageId':i,'sourcePath':row['path'],'contentHash':row['sha256'],'duplicateGroupId':row['proposed_source_component'],'annotationSource':'AI','reviewStatus':'AI_PROPOSED','reviewedAt':None,'reviewer':None,'licenseStatus':'UNVERIFIED','modelVersion':p['profileHash'],'modelProfile':p,'profileHash':p['profileHash'],'scopeHash':scope_hash(row,p),'technicalStatus':'SUCCESS','createdAt':now(),'elapsedMs':round((time.perf_counter()-t)*1000,3),'prediction':result,'approvedGroundTruth':False,'independentlyReviewed':False}
                        c['cacheHash']=digest(canonical(c).encode());atomic(path,c);job['succeeded']+=1
                    seen_hashes[cache_key]=i
                except Exception as exc:
                    if isinstance(exc,ModelLoadError):raise
                    job['failed']+=1
                    err={'imageId':i,'type':type(exc).__name__,'message':str(exc)[:250]}
                    if len(job['errors'])<200:job['errors'].append(err)
                    atomic(cache/(safe_id(i)+'.error.json'),{**err,'profileHash':p['profileHash'],'createdAt':now()})
                job['processed']+=1;job['lastImageId']=i;job['elapsedSeconds']=round(time.perf_counter()-started,3);job['peakRssMiB']=round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss/1024,2);atomic(progress,job)
            job.update(status='COMPLETED',finishedAt=now(),elapsedSeconds=round(time.perf_counter()-started,3),peakRssMiB=round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss/1024,2));atomic(progress,job)
            return job
        except BaseException as exc:
            atomic(progress,{**job,'status':'FAILED','error':type(exc).__name__+': '+str(exc)[:250]});raise
        finally:stop.set()

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--inventory',type=Path,required=True);ap.add_argument('--state',type=Path,required=True);ap.add_argument('--ids',type=Path,required=True,help='JSON array of IDs');ap.add_argument('--threads',type=int,choices=range(1,5),default=2);ap.add_argument('--ram-mb',type=int,default=3072);ap.add_argument('--detector',type=Path,default=DEFAULT_DETECTOR);a=ap.parse_args()
    if a.ram_mb<512:ap.error('RSS limit must be >=512MiB')
    print(json.dumps(run(a.inventory,a.state,json.loads(a.ids.read_text()),a.threads,a.ram_mb,a.detector),ensure_ascii=False))
if __name__=='__main__':main()
