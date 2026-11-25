"""Versioned development export; all training formats require explicit human and rights review."""
import argparse,csv,json,random,shutil,tempfile,io
from PIL import Image
from pathlib import Path
from collections import defaultdict
from core import Studio,REPO,canonical,digest,read_asset,safe_id,now,array

FORMATS={'yolo','classification','metadata','review-manifest'}
def partition(store,ids,seed):
    # Use full-inventory components: duplicates outside this selection can bridge members.
    parent={}
    def root(k):
        parent.setdefault(k,k);node=k
        while parent[node]!=node:node=parent[node]
        while parent[k]!=k:previous=parent[k];parent[k]=node;k=previous
        return node
    def join(a,b):parent[root(a)]=root(b)
    for i,r in store.rows.items():
        a='id:'+i
        for field in ['proposed_source_component','sha256','pixel_sha256','phash_component_id','sha_group_id','pixel_group_id']:
            if r.get(field):join(a,field+':'+r[field])
    groups=defaultdict(list);exposure=defaultdict(set);synthetic=set()
    selected_roots={root('id:'+i) for i in ids}
    for i,r in store.rows.items():
        k=root('id:'+i)
        if k not in selected_roots:continue
        exposure[k].update(array(r.get('component_exposure_json'))+array(r.get('direct_experiment_exposure_json')))
        if 'synthetic' in r.get('real_or_synthetic','').lower():synthetic.add(k)
    for i in ids:groups[root('id:'+i)].append(i)
    keys=sorted(groups);random.Random(seed).shuffle(keys);splits={};reasons={}
    for n,k in enumerate(keys):
        seen=' '.join(exposure[k]).lower()
        # Any historically train-exposed component stays train. No independent test export.
        if 'train' in seen or k in synthetic:s='train';why='prior_train_exposure_or_synthetic'
        elif 'val' in seen or 'test' in seen:s='val';why='prior_evaluation_exposure_development_only'
        else:s='val' if n%5==0 and len(keys)>1 else 'train';why='seeded_group_split'
        for i in groups[k]:splits[i]=s;reasons[i]={'component':min(groups[k]),'splitReason':why}
    return splits,reasons

def export(store,ids,fmt,version,seed=42):
    if fmt not in FORMATS:raise ValueError('Unknown export format')
    safe_id(version)
    if type(seed) is not int:raise ValueError('Seed must be integer')
    if not isinstance(ids,list) or not 1<=len(ids)<=5000 or len(ids)!=len(set(ids)) or any(i not in store.rows for i in ids):raise ValueError('Select 1..5000 known unique images')
    with store.mutex:
        store.check_studio();records=[];errors=[]
        for i in ids:
            r=store.rows[i];h=store.studio_latest.get(i)
            if fmt=='review-manifest':
                records.append({'imageId':i,'sourcePath':r['path'],'contentHash':r['sha256'],'duplicateGroupId':r['proposed_source_component'],'reviewStatus':store.status(i),'sourceAnnotation':array(r.get('annotations_json')),'sourceBoxes':store.detail(i)['sourceBoxes'],'aiProposal':store.ai(i),'human':h,'groundTruth':False});continue
            bad=[]
            if not h or h['reviewStatus']!='HUMAN_VERIFIED':bad.append('HUMAN_VERIFIED required')
            else:
                if h['licenseStatus']!='VERIFIED' or not h['licenseConfirmed'] or h['licenseType'] not in ['owned','licensed','permission'] or len(h['licenseEvidence'].strip())<20:bad.append('verified usage rights with actual evidence required')
                if len(h['sourceEvidence'].strip())<10:bad.append('actual provenance evidence required')
                if h['contentHash']!=r['sha256']:bad.append('stale review')
                store.validate_boxes(h['boundingBoxes'],r)
                store.source_profiles.validate_record(r,h)
                if fmt=='yolo' and h['outcome']!='OUT_OF_SCOPE' and not any(b['kind']=='object' for b in h['boundingBoxes']):bad.append('reviewed object bbox required for YOLO')
                if fmt=='classification' and h['outcome']!='OUT_OF_SCOPE' and not (h.get('classificationTargetId') or len(h['targetIds'])==1):bad.append('choose one reviewed classification target')
            try:
                payload=read_asset(r['path'])
                if digest(payload)!=r['sha256']:bad.append('source hash changed')
                with Image.open(io.BytesIO(payload)) as im:
                    if im.width*im.height>25_000_000 or (im.width,im.height)!=(int(r['width']),int(r['height'])):raise ValueError('Invalid/oversize image dimensions')
                    if im.getexif().get(274,1)!=1 or getattr(im,'n_frames',1)!=1:raise ValueError('EXIF/multiframe normalization required')
                    im.load()
            except Exception as e:bad.append('source unreadable: '+str(e))
            if bad:errors.append({'imageId':i,'missing':bad})
            else:records.append(dict(h))
        if errors:raise ValueError(canonical({'exportBlocked':True,'images':errors}))
        audit_head=store.studio_head
    base=store.state/'exports';base.mkdir(exist_ok=True)
    if base.is_symlink():raise ValueError('Symlink export root refused')
    destination=base/version
    if destination.exists():raise ValueError('Dataset version exists; choose a new version')
    tmp=Path(tempfile.mkdtemp(prefix='.building-',dir=base))
    try:
        manifest={'schema':'fixgo.studio.development.v1','version':version,'format':fmt,'createdAt':now(),'seed':seed,'auditHead':audit_head,'inventoryPins':json.loads((store.state/'inventory-pin.json').read_text()),'groundTruthApprovedByFixGo':False,'independentTest':False,'trainingExecuted':False,'records':records}
        if fmt!='review-manifest':
            splits,grouping=partition(store,ids,seed)
            manifest['trainingEligibility']={'automaticallyApproved':False,'hasTrainAndValidation':set(splits.values())=={'train','val'},'requires':'Independent label/rights approval, task coverage and current training gates; this tool never trains'}
            if fmt=='yolo':
                for split in ['train','val']:
                    (tmp/'images'/split).mkdir(parents=True,exist_ok=True);(tmp/'labels'/split).mkdir(parents=True,exist_ok=True)
            names=['object:'+t['slug'] for t in sorted(store.targets.values(),key=lambda x:x['slug'])]+['sign:'+s for s in sorted(store.signs)]
            for e in records:
                i=e['imageId'];r=store.rows[i];e['split']=splits[i];e['splitGrouping']=grouping[i]
                if fmt in ['yolo','classification']:
                    # Preserve bytes and extension; no lossy JPEG re-encoding.
                    ext=r.get('format','').lower();ext={'jpeg':'jpg','tiff':'tif'}.get(ext,ext)
                    if ext not in ['jpg','png','bmp','webp','tif']:raise ValueError('Unsupported export image format: '+ext)
                    if fmt=='yolo':image=tmp/'images'/splits[i]/(i+'.'+ext)
                    else:
                        target=e.get('classificationTargetId') or (e['targetIds'][0] if e['targetIds'] else None)
                        label=store.targets[target]['slug'] if target else 'other_unclear'
                        image=tmp/splits[i]/label/(i+'.'+ext)
                    image.parent.mkdir(parents=True,exist_ok=True);payload=read_asset(r['path'])
                    if digest(payload)!=r['sha256']:raise ValueError('Source changed during export: '+i)
                    image.write_bytes(payload);e['exportImage']=str(image.relative_to(tmp))
                    if fmt=='yolo':
                        label=tmp/'labels'/splits[i]/(i+'.txt');label.parent.mkdir(parents=True,exist_ok=True);lines=[]
                        for b in e['boundingBoxes']:
                            key='object:'+store.targets[b['label']]['slug'] if b['kind']=='object' else 'sign:'+b['label'];x,y,xx,yy=b['xyxy']
                            lines.append(f'{names.index(key)} {(x+xx)/2:.9f} {(y+yy)/2:.9f} {xx-x:.9f} {yy-y:.9f}')
                        label.write_text('\n'.join(lines)+ ('\n' if lines else ''))
            if fmt=='yolo':
                import yaml
                (tmp/'data.yaml').write_text(yaml.safe_dump({'path':'.','train':'images/train','val':'images/val','names':dict(enumerate(names))},allow_unicode=True,sort_keys=False))
                manifest['classMapping']=dict(enumerate(names))
            with (tmp/'metadata.csv').open('w',newline='') as f:
                fields=['imageId','sourcePath','contentHash','duplicateGroupId','targetIds','defectLabels','boundingBoxes','reviewStatus','reviewer','reviewedAt','licenseStatus','licenseType','licenseEvidence','sourceEvidence','sourceProfileHash','split']
                w=csv.DictWriter(f,fieldnames=fields);w.writeheader()
                for e in records:w.writerow({k:canonical(e[k]) if isinstance(e.get(k),(list,dict)) else e.get(k,'') for k in fields})
        hashes={r.get('sourceProfileHash') for r in records if r.get('sourceProfileHash')}
        manifest['sourceProfiles']=[e for e in store.source_profiles.latest.values() if e['eventHash'] in hashes]
        if manifest['sourceProfiles']:
            from source_profiles import attribution
            (tmp/'ATTRIBUTION.txt').write_text(attribution(manifest['sourceProfiles']))
        (tmp/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
        (tmp/'README.txt').write_text('LOCAL DEVELOPMENT EXPORT. Not independent test, not FixGo production import approval. Human self-review and rights declarations require organizational checks. No training performed.\n')
        tmp.rename(destination)
        return {'path':str(destination),'images':len(ids),'format':fmt,'independentTest':False,'version':version}
    except BaseException:shutil.rmtree(tmp);raise

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--inventory',type=Path,default=REPO/'docs/ai-data-audit/image-inventory.csv');p.add_argument('--state',type=Path,default=Path.home()/'.local/share/fixgo-dataset-studio');p.add_argument('--ids',type=Path,required=True);p.add_argument('--format',choices=sorted(FORMATS),required=True);p.add_argument('--version',required=True);p.add_argument('--seed',type=int,default=42);a=p.parse_args();s=Studio(a.inventory,a.state)
    try:print(json.dumps(export(s,json.loads(a.ids.read_text()),a.format,a.version,a.seed),ensure_ascii=False))
    finally:s.close()
