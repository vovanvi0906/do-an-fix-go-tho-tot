"""Pinned, offline Grounding DINO proposals; prompt-to-class mapping is explicit."""
import json
import math
import re
import time
from pathlib import Path
from sign_model import contained

REQUIRED={'config.json','model.safetensors','preprocessor_config.json','tokenizer.json','tokenizer_config.json'}


def descriptor(path,catalog,ontology):
    from batch import file_hash
    path=Path(path).resolve();m=json.loads(path.read_text())
    if m.get('schema')!='fixgo.studio.grounding-dino.v1' or m.get('backend')!='grounding-dino' or m.get('task')!='detect':
        raise ValueError('Expected Grounding DINO local manifest')
    root=Path(m['modelDirectory']).expanduser().resolve()
    if not root.is_dir() or not isinstance(m.get('files'),dict) or not REQUIRED<=set(m['files']):
        raise ValueError('Grounding DINO snapshot is incomplete; run grounding_setup.py --download once')
    for name,expected in m['files'].items():
        if Path(name).name!=name or not isinstance(expected,str) or not re.fullmatch('[0-9a-f]{64}',expected) or not (root/name).is_file() or file_hash(root/name)!=expected:
            raise ValueError('Grounding DINO artifact checksum mismatch: '+str(name))
    if json.loads((root/'config.json').read_text()).get('model_type')!='grounding-dino':raise ValueError('Snapshot is not a Grounding DINO model')
    if m.get('device')!='cpu':raise ValueError('This worker uses CPU only')
    for key in ['objectThreshold','signThreshold','textThreshold','nmsIou','maximumSignObjectAreaRatio']:
        value=m.get(key)
        if type(value) not in (int,float) or not math.isfinite(value) or not .05<=value<=1:raise ValueError('Invalid grounding threshold: '+key)
    if type(m.get('shortestEdge')) is not int or not 256<=m['shortestEdge']<=800 or type(m.get('longestEdge')) is not int or not m['shortestEdge']<=m['longestEdge']<=1333:
        raise ValueError('Invalid grounding image size')
    targets={t['id']:t for t in catalog['targets']};classes=m.get('classes',[])
    if not isinstance(classes,list) or not 2<=len(classes)<=128 or {c.get('kind') for c in classes}!={'object','sign'} or len({c['name'] for c in classes})!=len(classes):
        raise ValueError('Grounding requires unique object + sign classes')
    object_ids={c.get('targetId') for c in classes if c['kind']=='object'}
    for c in classes:
        if c['kind']=='object' and c.get('targetId') not in targets:raise ValueError('Grounding target outside catalog')
        if c['kind']=='object' and c['name']!='object:'+targets[c['targetId']]['slug']:raise ValueError('Grounding object name mismatch')
        if c['kind']=='sign':
            allowed=c.get('targetIds') or [c.get('targetId')]
            if c.get('code') not in ontology or c['name']!='sign:'+c['code'] or not isinstance(allowed,list) or not allowed or not set(allowed)<=object_ids:raise ValueError('Grounding sign/parent outside ontology')
        prompts=c.get('prompts')
        if not isinstance(prompts,list) or not 1<=len(prompts)<=8 or any(not isinstance(v,str) or not 2<=len(v)<=100 or not re.fullmatch(r'[a-z0-9 -]+',v) for v in prompts):raise ValueError('Use short lowercase English phrases for grounding prompts')
    detector=m.get('objectDetector')
    if detector:
        weights=Path(detector['path'])
        if not weights.is_file() or file_hash(weights)!=detector['sha256']:raise ValueError('Existing object detector checksum mismatch')
        if detector.get('confidence')!=.25:raise ValueError('Unexpected object detector threshold')
    nested=m.get('nestedObjectContainment',.95)
    if type(nested) not in (int,float) or not .8<=nested<=1:raise ValueError('Invalid nested object suppression')
    return {**m,'nestedObjectContainment':nested,'manifestPath':str(path),'manifestSha256':file_hash(path),'path':str(root/'model.safetensors'),
            'sha256':m['files']['model.safetensors'],'modelDirectory':str(root)}


def area(box):return max(0,box[2]-box[0])*max(0,box[3]-box[1])


def iou(a,b):
    inter=max(0,min(a[2],b[2])-max(a[0],b[0]))*max(0,min(a[3],b[3])-max(a[1],b[1]))
    return inter/max(1e-12,area(a)+area(b)-inter)


def overlap_min(a,b):
    intersection=max(0,min(a[2],b[2])-max(a[0],b[0]))*max(0,min(a[3],b[3])-max(a[1],b[1]))
    return intersection/max(1e-12,min(area(a),area(b)))


def nms(boxes,threshold,nested=.95):
    kept=[]
    for box in sorted(boxes,key=lambda b:b['score'],reverse=True):
        if all(box['label']!=old['label'] or (iou(box['xyxy'],old['xyxy'])<=threshold and not (box['kind']=='object' and overlap_min(box['xyxy'],old['xyxy'])>=nested)) for old in kept):kept.append(box)
    return kept


def link_signs(objects,signs,ratio):
    linked=[];issues=[]
    for sign in signs:
        allowed=sign.get('targetIds') or [sign.get('targetId')]
        candidates=[o for o in objects if o['label'] in allowed and contained(sign['xyxy'],o['xyxy'])]
        if len(candidates)!=1:
            issues.append('SIGN_OBJECT_ASSOCIATION_UNCERTAIN');continue
        parent=candidates[0]
        if area(sign['xyxy'])/max(1e-12,area(parent['xyxy']))>ratio:
            issues.append('SIGN_SPANS_WHOLE_OBJECT');continue
        box={k:v for k,v in sign.items() if k not in ['targetId','targetIds']};box['objectId']=parent['id'];linked.append(box)
    return linked,sorted(set(issues))


class GroundingModel:
    def __init__(self,config,by_id):
        import torch
        from transformers import AutoProcessor,AutoModelForZeroShotObjectDetection
        self.config,self.targets=config,by_id
        self.detector=None
        if config.get('objectDetector'):
            from ultralytics import YOLO
            self.detector=YOLO(config['objectDetector']['path'])
            if self.detector.task!='detect':raise ValueError('Existing object model is not a detector')
        self.processor=AutoProcessor.from_pretrained(config['modelDirectory'],local_files_only=True,trust_remote_code=False)
        self.model=AutoModelForZeroShotObjectDetection.from_pretrained(config['modelDirectory'],local_files_only=True,trust_remote_code=False,use_safetensors=True).to('cpu').eval()
        if self.model.config.model_type!='grounding-dino':raise ValueError('Loaded model is not Grounding DINO')
        self.torch=torch

    def detect_class(self,image,meta):
        c=self.config;text='. '.join(meta['prompts'])+'.'
        inputs=self.processor(images=image,text=text,return_tensors='pt',size={'shortest_edge':c['shortestEdge'],'longest_edge':c['longestEdge']})
        threshold=c['objectThreshold'] if meta['kind']=='object' else c['signThreshold']
        with self.torch.inference_mode():outputs=self.model(**inputs)
        # Transformers 5 uses `threshold`; never call online model APIs.
        result=self.processor.post_process_grounded_object_detection(outputs,inputs.input_ids,threshold=threshold,text_threshold=c['textThreshold'],target_sizes=[(image.height,image.width)])[0]
        boxes=[]
        for score,coords in zip(result['scores'].tolist(),result['boxes'].tolist()):
            if not math.isfinite(score) or not threshold<=score<=1 or not all(math.isfinite(v) for v in coords):continue
            x,y,xx,yy=coords;xy=[max(0,min(1,x/image.width)),max(0,min(1,y/image.height)),max(0,min(1,xx/image.width)),max(0,min(1,yy/image.height))]
            if (xy[2]-xy[0])*image.width<2 or (xy[3]-xy[1])*image.height<2:continue
            box={'id':'','kind':meta['kind'],'label':meta['targetId'] if meta['kind']=='object' else meta['code'],'xyxy':xy,'score':float(score),'objectId':None,
                 'annotationSource':'AI','modelVersion':c['sha256'],'prompt':text,'scoreType':'Grounding DINO text score, not calibrated defect probability'}
            if meta['kind']=='sign':box['targetIds']=meta.get('targetIds') or [meta['targetId']]
            boxes.append(box)
        return nms(boxes,c['nmsIou'],c['nestedObjectContainment'])[:100]

    def detect_existing_objects(self,image):
        if getattr(self,'detector',None) is None:return []
        by_slug={t['slug']:t for t in self.targets.values()}
        allowed={m['targetId'] for m in self.config['classes'] if m['kind']=='object'}
        result=self.detector.predict(image,device='cpu',conf=.25,save=False,verbose=False)[0]
        boxes=[]
        for cls,score,xy in zip(result.boxes.cls.tolist(),result.boxes.conf.tolist(),result.boxes.xyxyn.tolist()):
            target=by_slug.get(result.names[int(cls)])
            if target and target['id'] in allowed:
                boxes.append({'id':'','kind':'object','label':target['id'],'xyxy':xy,'score':float(score),'objectId':None,
                              'annotationSource':'AI','modelVersion':self.config['objectDetector']['sha256'],
                              'model':'existing strict-v2 YOLO','scoreType':'YOLO confidence, not calibrated probability'})
        return nms(boxes,self.config['nmsIou'],self.config['nestedObjectContainment'])

    def predict(self,image,row=None):
        from grounding_catalog import image_scope
        c=self.config;objects=[];signs=[];timing={}
        start=time.perf_counter();existing=self.detect_existing_objects(image)
        timing['existingYoloMs']=round((time.perf_counter()-start)*1000,3)
        object_classes,scope_warnings=image_scope(c,row or {})
        if existing and not c.get('explicitTarget'):
            detected_ids={b['label'] for b in existing}
            object_classes=[m for m in c['classes'] if m['kind']=='object' and m['targetId'] in detected_ids]
            scope_warnings=['TARGET_SCOPE_USES_OBJECT_DETECTOR']
        active_existing={m['targetId'] for m in object_classes}
        objects=[b for b in existing if b['label'] in active_existing]
        if any(m['targetId'] in c.get('broadSceneTargetIds',[]) for m in object_classes):scope_warnings.append('BROAD_SCENE_SCOPE_NOT_SYSTEM_DIAGNOSIS')
        if not object_classes:return [],['TARGET_SCOPE_REQUIRED'],{}, {'rawSignCandidates':[],'scopeWarnings':scope_warnings}
        active_ids={m['targetId'] for m in object_classes}
        classes=object_classes+[m for m in c['classes'] if m['kind']=='sign' and active_ids.intersection(m.get('targetIds') or [m.get('targetId')])]
        detected_ids={b['label'] for b in objects}
        for meta in classes:
            if meta['kind']=='object' and meta['targetId'] in detected_ids:continue
            start=time.perf_counter();detected=self.detect_class(image,meta);timing[meta['name']]=round((time.perf_counter()-start)*1000,3)
            (objects if meta['kind']=='object' else signs).extend(detected)
        for n,box in enumerate(objects+signs):box['id']='grounding-'+str(n)
        diagnostics={'rawSignCandidates':signs,'objectCountAfterSuppression':len(objects),'scopeWarnings':scope_warnings,
                     'targetIdsSearched':sorted(active_ids),'signCodesSearched':[m['code'] for m in classes if m['kind']=='sign']}
        linked,issues=link_signs(objects,signs,c['maximumSignObjectAreaRatio'])
        return (objects+linked)[:100],issues,timing,diagnostics

    def prediction(self,row,profile):
        from core import read_asset,digest
        from PIL import Image
        import io
        payload=read_asset(row['path'])
        if digest(payload)!=row['sha256']:raise ValueError('Grounding source hash changed')
        with Image.open(io.BytesIO(payload)) as original:
            if original.width*original.height>25_000_000 or original.getexif().get(274,1)!=1 or getattr(original,'n_frames',1)!=1:raise ValueError('Normalize source before grounding')
            image=original.convert('RGB')
        boxes,issues,timing,diagnostics=self.predict(image,row)
        candidates=[]
        for box in sorted((b for b in boxes if b['kind']=='object'),key=lambda b:b['score'],reverse=True):
            if box['label'] in {t['targetId'] for t in candidates}:continue
            meta=self.targets[box['label']];candidates.append({'targetId':meta['id'],'targetName':meta['name'],'categoryId':meta['categoryId'],'confidence':box['score'],
                'scoreType':box['scoreType'],'model':box.get('model','Grounding DINO Tiny'),'modelVersion':box['modelVersion'],'provenance':'REAL_OFFLINE_YOLO' if box.get('model') else 'REAL_OFFLINE_GROUNDING_DINO'})
        categories={t['categoryId'] for t in candidates}
        category={'id':next(iter(categories)),'source':'Grounding DINO object proposal'} if len(categories)==1 else None
        return {'category':category,'categoryCandidates':[],'targetCandidates':candidates[:3],'boxes':boxes,'uncertain':not bool(candidates),
                'scopeDecision':'PROMPT_SCOPED_PROPOSAL_ONLY','visibleDefects':[b['label'] for b in boxes if b['kind']=='sign'],'signCapability':True,'signIssues':[i for i in issues if i!='SIGN_SPANS_WHOLE_OBJECT'],'groundingWarnings':[i for i in issues if i=='SIGN_SPANS_WHOLE_OBJECT']+diagnostics.get('scopeWarnings',[]),
                'groundingDiagnostics':diagnostics,'defectNote':'Grounding DINO observable-sign proposals, not approved fault/service diagnosis. Absence is UNKNOWN.','stagesMs':timing}
