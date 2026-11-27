#!/usr/bin/env python3
"""Source-label + offline CLIP alignment screening; AI_UNVERIFIED development data."""
import os
for key in ['OMP_NUM_THREADS','MKL_NUM_THREADS','OPENBLAS_NUM_THREADS']:os.environ[key]='2'
os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1'
import collections,hashlib,io,json,math,re,shutil,time
from pathlib import Path
import numpy as np
import torch,yaml
from PIL import Image
from transformers import CLIPModel,CLIPProcessor
from huggingface_hub import try_to_load_from_cache
from multiservice_data import BASE,AUDIT,sha
ROOT=BASE/'02-curated/fixgo-multiservice-ai-v1'
SPEC=Path(__file__).with_name('multiservice-taxonomy.json')

def feature(value):return value.pooler_output if hasattr(value,'pooler_output') else value

def main():
    if ROOT.exists():raise ValueError('Output exists; choose new version')
    ROOT.mkdir();torch.set_num_threads(2);start=time.time();spec=json.loads(SPEC.read_text());audit=json.loads((AUDIT/'audit.json').read_text());meta={s['id']:s for s in audit['sources']}
    snapshot=Path(try_to_load_from_cache('openai/clip-vit-base-patch32','config.json')).parent
    model=CLIPModel.from_pretrained(str(snapshot),local_files_only=True,trust_remote_code=False).eval();processor=CLIPProcessor.from_pretrained(str(snapshot),local_files_only=True)
    code_embeddings={}
    with torch.inference_mode():
        for item in spec['classes']:
            sides=[]
            for key in ['positivePrompts','negativePrompts']:
                embeddings=feature(model.get_text_features(**processor(text=item[key],return_tensors='pt',padding=True)));embeddings=embeddings/embeddings.norm(dim=-1,keepdim=True);mean=embeddings.mean(0);sides.append(mean/mean.norm())
            code_embeddings[item['code']]=torch.stack(sides)
    sample_index=json.loads((AUDIT/'sample-index.json').read_text())
    # Visible stock-photo watermarks in representative images; retain as excluded evidence.
    watermark_ids={r['imageId'] for r in sample_index if r['index'] in [3,42,43,44,48,50,52,54]}
    excluded=[];screen=[];jobs=[]
    for original in audit['records']:
        row=dict(original);mapping=spec['sourceMappings'][row['sourceKey']];mapped=[{**a,'code':mapping[a['sourceClass']]} for a in row['annotations'] if a['sourceClass'] in mapping]
        reasons=[]
        normal=row['sourceKey']=='source-2' and {a['sourceClass'] for a in row['annotations']}=={'normal-outlet'}
        if row['imageId'] in watermark_ids:reasons.append('VISIBLE_STOCK_WATERMARK_RIGHTS_UNCLEAR')
        if not mapped and not normal:reasons.append('NO_SUPPORTED_SIGN_LABEL')
        if row['sourceKey'] in ['source-0','source-3'] and any(a['sourceClass'] not in mapping for a in row['annotations']):reasons.append('MIXED_OR_AMBIGUOUS_SOURCE_CLASSES')
        if reasons:excluded.append({'imageId':row['imageId'],'reasons':reasons});continue
        row.update(proposedAnnotations=mapped,negativeCandidate=normal,alignment=[]);screen.append(row)
        annotations=mapped if not normal else [{**a,'code':'scorched_outlet','negativeCheck':True} for a in row['annotations']]
        for ann in annotations:jobs.append((row,ann))
    for offset in range(0,len(jobs),16):
        block=jobs[offset:offset+16];crops=[]
        for row,ann in block:
            with Image.open(row['path']) as im:
                x,y,xx,yy=ann['xyxy'];crop=im.convert('RGB').crop((max(0,int(x*im.width)),max(0,int(y*im.height)),min(im.width,math.ceil(xx*im.width)),min(im.height,math.ceil(yy*im.height))))
                if crop.width<2 or crop.height<2:crop=im.convert('RGB')
                crops.append(crop)
        with torch.inference_mode():
            embeds=feature(model.get_image_features(**processor(images=crops,return_tensors='pt')));embeds=embeds/embeds.norm(dim=-1,keepdim=True)
        for (row,ann),embedding in zip(block,embeds):
            sims=(code_embeddings[ann['code']]@embedding).tolist();positive,negative=sims
            # Relative semantic alignment, explicitly not a defect probability.
            accepted=(negative-positive>=.005 and negative>=.20) if ann.get('negativeCheck') else (positive-negative>=.005 and positive>=.20)
            row['alignment'].append({'code':ann['code'],'sourceBox':ann['xyxy'],'positiveCosine':positive,'negativeCosine':negative,'margin':positive-negative,'accepted':accepted,'negativeCheck':bool(ann.get('negativeCheck'))})
        if offset%160==0:
            (ROOT/'screening-progress.json').write_text(json.dumps({'processedBoxes':min(offset+16,len(jobs)),'totalBoxes':len(jobs),'elapsedSeconds':round(time.time()-start,1)})+'\n');print('Screened',min(offset+16,len(jobs)),'/',len(jobs),flush=True)
    candidates=[]
    for row in screen:
        if not row['alignment'] or not all(s['accepted'] for s in row['alignment']):excluded.append({'imageId':row['imageId'],'reasons':['CLIP_SOURCE_ALIGNMENT_UNCERTAIN'],'alignment':row['alignment']});continue
        row.update(annotationStatus='SOURCE_PLUS_AI_SCREENED_UNVERIFIED',groupFamily=meta[row['sourceKey']]['metadata'].get('project','')+'!'+Path(row['member']).name.split('.rf.')[0]);candidates.append(row)
    visual=BASE/'02-curated/dirty-filter-ai-review-v1/ai-review.json'
    if visual.exists():
        for r in json.loads(visual.read_text())['records']:
            if r['decision']!='PROPOSE_SOILING' or r['visualCertainty']!='HIGH':continue
            payload=Path(r['sourcePath']).read_bytes()
            if sha(payload)!=r['contentHash']:raise ValueError('Reviewed image changed')
            with Image.open(io.BytesIO(payload)) as im:
                rgb=im.convert('RGB');size=rgb.size;v=list(rgb.convert('L').resize((9,8)).get_flattened_data());dhash=sum((v[y*9+x]>v[y*9+x+1])<<(y*8+x) for y in range(8) for x in range(8));ph=sha(str(size).encode()+rgb.tobytes())
            candidates.append({'imageId':r['imageId'],'sourceKey':'prior-filter-ai-review','sourceSplit':'development','path':r['sourcePath'],'sha256':r['contentHash'],'pixelSha256':ph,'dhash':dhash,'groupFamily':'prior-filter!'+Path(r['sourcePath']).name.split('.rf.')[0],'proposedAnnotations':[{'code':b['label'],'xyxy':b['xyxy'],'geometry':'assistant_approximate_bbox'} for b in r['proposedSigns']],'negativeCandidate':False,'annotationStatus':'AI_VISUAL_REVIEW_UNVERIFIED','alignment':[]})
    # Canonicalize identical pixels, with annotation conflicts quarantined rather than merged.
    exact=collections.defaultdict(list)
    for r in candidates:exact[r['pixelSha256']].append(r)
    unique=[];duplicate_count=0
    for entries in exact.values():
        signatures={json.dumps(sorted((a['code'],*[round(v,2) for v in a['xyxy']]) for a in r['proposedAnnotations'])) for r in entries}
        if len(signatures)>1:
            excluded.extend({'imageId':r['imageId'],'reasons':['EXACT_IMAGE_LABEL_CONFLICT']} for r in entries);continue
        unique.append(entries[0]);duplicate_count+=len(entries)-1
    # Group aliases, flipped variants and perceptually close scenes BEFORE splitting.
    parent=list(range(len(unique)))
    def find(n):
        while parent[n]!=n:parent[n]=parent[parent[n]];n=parent[n]
        return n
    thumbs=[];flips=[]
    for r in unique:
        with Image.open(r['path']) as im:
            im=im.convert('RGB');thumbs.append(np.asarray(im.resize((32,32)),dtype=np.int16));flips.append(np.asarray(im.transpose(Image.Transpose.FLIP_LEFT_RIGHT).resize((32,32)),dtype=np.int16))
    for i,r in enumerate(unique):
        for j,o in enumerate(unique[:i]):
            close=(r['dhash']^o['dhash']).bit_count()<=5
            pixels=float(np.abs(thumbs[i]-thumbs[j]).mean()) if close else 999
            flipped=float(np.abs(thumbs[i]-flips[j]).mean())
            if r['groupFamily']==o['groupFamily'] or pixels<=15 or flipped<=8:parent[find(i)]=find(j)
    groups=collections.defaultdict(list)
    for i,r in enumerate(unique):groups[find(i)].append(r)
    for g in groups.values():
        key=min(r['imageId'] for r in g);split='val' if int(sha(('fixgo-multi-v1:'+key).encode())[:8],16)%5==0 else 'train'
        for r in g:r.update(split=split,groupId=key)
    present=sorted({a['code'] for r in unique for a in r['proposedAnnotations']})
    for code in present:
        gs=[g for g in groups.values() if any(a['code']==code for r in g for a in r['proposedAnnotations'])]
        if not any(g[0]['split']=='train' for g in gs):
            for r in gs[0]:r['split']='train'
        if len(gs)>1 and not any(g[0]['split']=='val' for g in gs):
            for g in gs:
                labels={a['code'] for r in g for a in r['proposedAnnotations']}
                if all(any(other is not g and other[0]['split']=='train' and any(a['code']==c for r in other for a in r['proposedAnnotations']) for other in groups.values()) for c in labels):
                    for r in g:r['split']='val'
                    break
    boxes={s:collections.Counter() for s in ['train','val']};images=collections.Counter();by_source=collections.Counter()
    for s in ['train','val']:(ROOT/'images'/s).mkdir(parents=True);(ROOT/'labels'/s).mkdir(parents=True)
    for r in unique:
        payload=Path(r['path']).read_bytes()
        if sha(payload)!=r['sha256']:raise ValueError('Source changed')
        ext=Path(r['path']).suffix;dest=ROOT/'images'/r['split']/(r['imageId']+ext);dest.write_bytes(payload);lines=[]
        for a in r['proposedAnnotations']:
            x,y,xx,yy=a['xyxy'];lines.append(f'{present.index(a["code"])} {(x+xx)/2:.8f} {(y+yy)/2:.8f} {xx-x:.8f} {yy-y:.8f}');boxes[r['split']][a['code']]+=1
        (ROOT/'labels'/r['split']/(r['imageId']+'.txt')).write_text('\n'.join(lines)+ ('\n' if lines else ''));images[r['split']]+=1;by_source[r['sourceKey']]+=1
    summary={'sourceAuditImages':len(audit['records']),'selectedImages':len(unique),'splitImages':dict(images),'imagesBySource':dict(by_source),'boxes':{s:dict(c) for s,c in boxes.items()},'negativeImages':sum(not r['proposedAnnotations'] for r in unique),'excludedRecords':len(excluded),'exactDuplicatesRemoved':duplicate_count,'missingTrainClasses':[c for c in present if not boxes['train'][c]],'missingValClasses':[c for c in present if not boxes['val'][c]]}
    report={'schema':'fixgo.multiservice-ai-dataset.v1','labelStatus':'AI_UNVERIFIED','independentTest':False,'approvedGroundTruth':False,'summary':summary,'taxonomy':spec,'sources':audit['sources'],'records':unique,'excluded':excluded,'teacher':{'model':'openai/clip-vit-base-patch32','revision':snapshot.name,'policy':'positive minus counterexample cosine >= 0.005 and positive >= 0.20; inverse for source normal outlets','scoreType':'cosine similarity, not probability','limitations':'Semantic filter cannot verify geometry, electrical safety, or underlying faults.'},'limitations':['Representative visual inspection plus automated screening, NOT manual inspection of every full-resolution image.','Validation labels are source/AI screened, not independent ground truth.','No device malfunction or service diagnosis inferred.','Underlying third-party image rights may not be cleared by source dataset license; visible sample watermarks quarantined, remaining items not individually rights-verified.','Same-scene grouping is heuristic; undetected related scenes may remain.','No gardening data supplied.']}
    (ROOT/'data.yaml').write_text(yaml.safe_dump({'path':str(ROOT),'train':'images/train','val':'images/val','names':{i:'sign:'+c for i,c in enumerate(present)}},sort_keys=False));(ROOT/'manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');(ROOT/'taxonomy.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n')
    attribution=['SOURCE DATASET ATTRIBUTION — experimental AI labels, not cleared production data.']
    for s in audit['sources']:attribution.extend([s['archive'],str(s['metadata']),*s['readmes'].values()])
    (ROOT/'ATTRIBUTION.txt').write_text('\n\n'.join(attribution));print(json.dumps(summary,indent=2),flush=True)
if __name__=='__main__':main()
