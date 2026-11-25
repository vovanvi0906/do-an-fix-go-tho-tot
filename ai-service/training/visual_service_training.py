"""Audit/prepare/train an isolated object+sign trial from existing gated SOLO exports.
Never writes raw, journals, production weights, model manifests or approval state.
"""
import argparse
import hashlib
import json
import shutil
from collections import Counter, defaultdict
from pathlib import Path

MINIMUM = {'trainImagesPerClass':20, 'valImagesPerClass':5, 'trainGroupsPerClass':2, 'valGroupsPerClass':1,
           'negativeTrainImages':5, 'negativeValImages':2}


def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()

def read_journal(state):
    path = state/'bbox-quality-v1/events.jsonl'
    latest, exports, head = {}, [], '0'*64
    if not path.exists(): return latest, exports
    for line in path.read_text().splitlines():
        e = json.loads(line)
        entry = {k:v for k,v in e.items() if k!='eventHash'}
        expected = hashlib.sha256(json.dumps(entry,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
        if e.get('previousHash')!=head or e.get('eventHash')!=expected: raise ValueError('Audit bbox không toàn vẹn.')
        head=e['eventHash']
        if e.get('kind')=='bbox_revision': latest[e['imageId']]=e
        if e.get('kind')=='bbox_export': exports.append(e)
    return latest, exports


def pinned(folder, name, pins):
    path=(folder/name).resolve()
    if not path.is_relative_to(folder.resolve()) or digest(path)!=pins.get(name): raise ValueError('Checksum/path không hợp lệ: '+name)
    return path


def audit(state, export=None):
    latest, exports = read_journal(state)
    confirmed=[e for e in latest.values() if e.get('status')=='confirmed']
    report={'status':'blocked','readyForTrialTraining':False,'approvedGroundTruth':False,'productionActivation':False,
        'reviewedImages':len(confirmed),'reviewedSignBoxes':dict(Counter(b['label'] for e in confirmed for b in e.get('boxes',[]) if b['kind']=='sign')),
        'minimumTrialCriteria':MINIMUM,'blockers':[]}
    if not export:
        report['blockers']=['Chưa chỉ định bản xuất bbox qua export gate.']
        if not confirmed: report['blockers'].append('Chưa có ảnh bbox được người gán nhãn xác nhận trong state hiện tại.')
        return report, []
    folder=export.resolve()
    # Only consume an audited export owned by this store; never an arbitrary YOLO folder.
    if folder.parent != (state/'bbox-quality-v1/exports').resolve(): raise ValueError('Chỉ nhận export từ state bbox hiện tại.')
    manifest=folder/'SHA256SUMS.json'
    export_event=next((e for e in reversed(exports) if e['folder']==folder.name and e['sha256']==digest(manifest)),None)
    if not export_event: raise ValueError('Bản xuất chưa có audit export hợp lệ.')
    pins=json.loads(manifest.read_text())
    for name in pins: pinned(folder,name,pins)
    records=[json.loads(l) for l in pinned(folder,'records.jsonl',pins).read_text().splitlines() if l.strip()]
    groups=defaultdict(set)
    for r in records:
        if r.get('eventHash')!=latest.get(r['imageId'],{}).get('eventHash'): raise ValueError('Nhãn đã đổi sau bản xuất; xuất lại qua gate.')
        if r['imageId'] not in export_event['imageIds'] or r['userId']!=export_event['userId'] or r['status']!='confirmed': raise ValueError('Export/owner/status không khớp.')
        if r.get('approvedGroundTruth') is not False or r.get('benchmarkEligible') is not False: raise ValueError('Không nhận test/benchmark độc lập.')
        if r.get('split') not in ['train','val'] or not r.get('rightsVerified') or any(not r.get(k,'').strip() for k in ['rightsEvidence','sourceEvidence','groupEvidence']): raise ValueError('Chưa qua kiểm quyền ảnh/nguồn/nhóm trùng.')
        if r.get('objectReview') not in ['complete','none_visible'] or r.get('signReview') not in ['positive','none_visible']: raise ValueError('Cần xem đầy đủ cả vật thể và dấu hiệu, không dùng nhãn chưa xem làm ảnh âm.')
        if any(b['kind']=='object' for b in r['boxes']) and not r.get('objectExtentReviewed'): raise ValueError('Chưa kiểm đầy đủ box vật thể.')
        groups[r['leakageGroup']].add(r['split'])
        if len(groups[r['leakageGroup']])!=1: raise ValueError('Leakage group giao split.')
    report['blockers']=['Cần chuẩn bị dataset có đủ ảnh vật thể/dấu hiệu và ảnh âm qua --raw/--out trước khi train.']
    return report, records


def read_import_journal(state):
    root=(state/'uploaded-dataset-v1').resolve();log=root/'events.jsonl';rows={};head='0'*64
    if not log.exists():return rows
    for line in log.read_text().splitlines():
        event=json.loads(line);entry={k:v for k,v in event.items() if k!='eventHash'}
        expected=hashlib.sha256(json.dumps(entry,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
        if entry['previousHash']!=head or event['eventHash']!=expected:raise ValueError('Audit nhập ảnh không toàn vẹn.')
        head=event['eventHash'];rows[event['id']]=event
    return rows


def imported_source(state,record,imports):
    e=imports.get(record['imageId']);root=(state/'uploaded-dataset-v1').resolve()
    if not e or record.get('importEventHash')!=e['eventHash'] or record['packetHash']!=e['eventHash']:raise ValueError('Không khớp provenance nhập ảnh.')
    if e['nearCandidates']:
        review=record.get('duplicateReview') or {};expected=sorted(c['imageId'] for c in e['nearCandidates'])
        if review.get('decision')!='independent' or not isinstance(review.get('evidence'),str) or len(review['evidence'].strip())<20 or sorted(review.get('imageIds',[]))!=expected or len(expected)>100:raise ValueError('Ảnh gần trùng chưa được xử lý nhóm/split.')
    if record['split']!=e['developmentSplit'] or record['leakageGroup']!=e['leakageGroup'] or record['sha256']!=e['sha256']:raise ValueError('Nhóm/split/checksum ảnh nhập đã đổi.')
    for field,hashfield in [('imageFile','sha256'),('originalFile','originalSha256'),('labelFile','annotationSha256')]:
        path=(root/e[field]).resolve()
        if not path.is_relative_to(root) or digest(path)!=e[hashfield]:raise ValueError('Checksum ảnh nhập hoặc ảnh gốc đã đổi.')
    return {'id':e['id'],'path':'uploaded/'+e['id']+'.png','developmentSplit':e['developmentSplit'],'leakageGroup':e['leakageGroup'],'sourceKind':'admin_upload'}


def prepare_trial(state, export, raw, target_slug, signs, out):
    report,records=audit(state,export)
    if not records:
        report['blockers'].append('Không có bản ghi đủ điều kiện.');return report,None
    quality=(raw.parent/'02-development/ai01-quality-v1').resolve()
    quality_pins=json.loads((quality/'SHA256SUMS.json').read_text())
    for name in ['catalog-db.json','drafts.jsonl','sign-ontology.json']: pinned(quality,name,quality_pins)
    ontology=json.loads((quality/'sign-ontology.json').read_text())['signs']
    if not signs or len(signs)!=len(set(signs)) or any(s not in ontology for s in signs): raise ValueError('Chỉ nhận dấu hiệu duy nhất từ ontology đã kiểm checksum.')
    catalog=json.loads((quality/'catalog-db.json').read_text())
    target=next(t for t in catalog['targets'] if t['slug']==target_slug and t['isActive'])
    category=next(c for c in catalog['categories'] if c['id']==target['categoryId'] and c['isActive'])
    source={r['id']:r for r in map(json.loads,(quality/'drafts.jsonl').read_text().splitlines())}
    imports=read_import_journal(state)
    classes=[{'name':'object:'+target_slug,'kind':'object','categorySlug':category['slug'],'targetSlug':target_slug,'code':target_slug,'key':target['id']}]
    classes += [{'name':'sign:'+s,'kind':'sign','categorySlug':category['slug'],'targetSlug':target_slug,'code':s,'key':s} for s in signs]
    counts={c['name']:{'train':set(),'val':set(),'trainGroups':set(),'valGroups':set()} for c in classes}
    negatives={'train':set(),'val':set()};chosen=[]
    for r in records:
        if r.get('sourceKind')=='admin_upload':
            row=imported_source(state,r,imports)
        else:
            row=source[r['imageId']]
            if 'test' in Path(row['path']).parts: raise ValueError('Không dùng ảnh thuộc split test gốc để train hoặc validation thử nghiệm.')
            if r['packetHash']!=digest(quality/'SHA256SUMS.json') or row['developmentSplit']!=r['split'] or row['leakageGroup']!=r['leakageGroup']: raise ValueError('Quality packet/split đã đổi.')
            for path,sha in [(raw/row['path'],r['sha256']),(raw/row['annotationPath'],r['sourceAnnotationSha256']),(raw/row['dataset']/'data.yaml',r['sourceYamlSha256'])]:
                if not path.resolve().is_relative_to(raw.resolve()) or digest(path)!=sha: raise ValueError('Nguồn ảnh/YOLO/YAML đã đổi.')
        objects=[b for b in r['boxes'] if b['kind']=='object' and b['label']==target['id']]
        if not objects: continue
        boxes=[(0,b) for b in objects]
        for i,c in enumerate(classes[1:],1):
            for b in r['boxes']:
                if b['kind']=='sign' and b['label']==c['key']:
                    from recommendation.visual_detector import containment, valid_box
                    if not valid_box(b['xyxy']): raise ValueError('Box không hợp lệ.')
                    # Drop the whole image if a sign could belong to another object.
                    matches=[o for o in r['boxes'] if o['kind']=='object' and containment(b['xyxy'],o['xyxy'])>=.8]
                    if len(matches)!=1 or matches[0]['label']!=target['id']: raise ValueError('Dấu hiệu không gắn rõ với một vật thể.')
                    boxes.append((i,b))
        for i in {i for i,b in boxes}:
            count=counts[classes[i]['name']];count[r['split']].add(r['imageId']);count[r['split']+'Groups'].add(r['leakageGroup'])
        if r['signReview']=='none_visible': negatives[r['split']].add(r['imageId'])
        image=pinned(export,'object/images/'+r['split']+'/'+r['imageId']+Path(row['path']).suffix.lower(),json.loads((export/'SHA256SUMS.json').read_text()))
        if digest(image)!=r['sha256']: raise ValueError('Ảnh xuất không khớp nguồn.')
        chosen.append((r,image,boxes))
    support={k:{field:len(v) for field,v in fields.items()} for k,fields in counts.items()}
    blockers=[]
    for name,c in support.items():
        if c['train']<20 or c['val']<5 or c['trainGroups']<2 or c['valGroups']<1: blockers.append('Thiếu ảnh/nhóm độc lập cho '+name)
    for split,minimum in [('train',5),('val',2)]:
        if len(negatives[split])<minimum: blockers.append('Thiếu ảnh vật thể không thấy dấu hiệu lỗi ở split '+split)
    report.update(classSupport=support,negativeImages={s:len(v) for s,v in negatives.items()},blockers=blockers,readyForTrialTraining=not blockers,status='ready_for_trial' if not blockers else 'blocked')
    if blockers:return report,None
    if any(out.resolve().is_relative_to(p.resolve()) or p.resolve().is_relative_to(out.resolve()) for p in [raw,state,export]): raise ValueError('Output phải tách khỏi raw/state/export.')
    out.mkdir(parents=True,exist_ok=False)
    for r,image,boxes in chosen:
        image_out=out/'images'/r['split']/image.name;image_out.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(image,image_out)
        label=out/'labels'/r['split']/(r['imageId']+'.txt');label.parent.mkdir(parents=True,exist_ok=True)
        lines=[]
        for index,b in boxes:
            x1,y1,x2,y2=b['xyxy'];lines.append(f'{index} {(x1+x2)/2:.8f} {(y1+y2)/2:.8f} {x2-x1:.8f} {y2-y1:.8f}')
        label.write_text('\n'.join(lines)+'\n')
    import yaml
    (out/'data.yaml').write_text(yaml.safe_dump({'path':str(out.resolve()),'train':'images/train','val':'images/val','names':{i:c['name'] for i,c in enumerate(classes)}}))
    (out/'class-map.json').write_text(json.dumps(classes,ensure_ascii=False,indent=2))
    (out/'trial-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    return report,out/'data.yaml'


def main():
    p=argparse.ArgumentParser();p.add_argument('--state',type=Path,required=True);p.add_argument('--export',type=Path);p.add_argument('--raw',type=Path);p.add_argument('--out',type=Path);p.add_argument('--target-slug',default='o-cam-dien');p.add_argument('--signs',nargs='+',default=['burn_mark','crack']);p.add_argument('--report',type=Path);p.add_argument('--execute-train',action='store_true');p.add_argument('--weights',type=Path);p.add_argument('--epochs',type=int,default=20)
    a=p.parse_args();report,_=audit(a.state,a.export);data=None
    if a.out:
        if not a.export or not a.raw:p.error('--out cần --export và --raw')
        report,data=prepare_trial(a.state,a.export,a.raw,a.target_slug,a.signs,a.out)
    if a.report:
        if a.report.resolve().is_relative_to(a.state.resolve()) or (a.raw and a.report.resolve().is_relative_to(a.raw.resolve())):p.error('Report phải nằm ngoài state/raw')
        with a.report.open('x') as stream:json.dump(report,stream,ensure_ascii=False,indent=2)
    print(json.dumps(report,ensure_ascii=False))
    if a.execute_train:
        if not data or not a.weights or not a.weights.is_file() or not 1<=a.epochs<=200:p.error('Cần dataset qua gate, weights cục bộ và epochs 1..200; không tự tải weights.')
        from ultralytics import YOLO
        model=YOLO(str(a.weights.resolve()))
        if model.task!='detect':p.error('Weights phải là detector')
        model.train(data=str(data),epochs=a.epochs,imgsz=640,batch=4,device='cpu',workers=0,seed=23,project=str(a.out.resolve()),name='trial',exist_ok=False)
    return 0 if report['readyForTrialTraining'] else 2

if __name__=='__main__':
    import sys
    sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
    raise SystemExit(main())
