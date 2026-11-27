#!/usr/bin/env python3
"""Read-only YOLO ZIP audit; records source labels, never declares reviewed GT."""
import argparse,collections,hashlib,io,json,math
from pathlib import Path,PurePosixPath
import zipfile
import yaml
from PIL import Image

def audit(source):
    rows=[];issues=[];class_images=collections.Counter();class_boxes=collections.Counter();hashes=collections.defaultdict(list)
    with zipfile.ZipFile(source) as z:
        members=z.namelist()
        if len(set(members))!=len(members):raise ValueError('Duplicate ZIP member names')
        if any(PurePosixPath(n).is_absolute() or '..' in PurePosixPath(n).parts for n in members):raise ValueError('Unsafe ZIP paths')
        if sum(i.file_size for i in z.infolist())>2*1024**3:raise ValueError('ZIP exceeds audit size limit')
        cfg=yaml.safe_load(z.read('data.yaml'));names=cfg['names']
        if isinstance(names,dict):names=[names[i] for i in range(len(names))]
        if cfg['nc']!=len(names):raise ValueError('Class count mismatch')
        images=sorted(n for n in members if '/images/' in n and Path(n).suffix.lower() in {'.jpg','.jpeg','.png','.webp'})
        for n in images:
            row={'image':n,'sourceSplit':n.split('/')[0],'labels':[],'issues':[],'annotationStatus':'SOURCE_UNVERIFIED'}
            try:
                payload=z.read(n)
                with Image.open(io.BytesIO(payload)) as im:
                    if im.width*im.height>25_000_000:raise ValueError('Image too large')
                    im.load();rgb=im.convert('RGB');row.update(width=im.width,height=im.height)
                    pixelhash=hashlib.sha256(str(rgb.size).encode()+rgb.tobytes()).hexdigest();hashes[pixelhash].append(n)
                label=str(PurePosixPath(n.replace('/images/','/labels/')).with_suffix('.txt'))
                row['labelFile']=label
                if label not in members:row['issues'].append('MISSING_LABEL_FILE')
                else:
                    for line_no,line in enumerate(z.read(label).decode().splitlines(),1):
                        if not line.strip():continue
                        fields=line.split()
                        if len(fields)!=5:row['issues'].append(f'INVALID_BOX_FIELDS:{line_no}');continue
                        try:
                            cls=int(fields[0]);x,y,w,h=map(float,fields[1:])
                            if not 0<=cls<len(names) or not all(math.isfinite(v) for v in [x,y,w,h]) or not 0<w<=1 or not 0<h<=1 or min(x-w/2,y-h/2)<-1e-5 or max(x+w/2,y+h/2)>1+1e-5:raise ValueError()
                        except ValueError:row['issues'].append(f'INVALID_CLASS_OR_GEOMETRY:{line_no}');continue
                        row['labels'].append({'classId':cls,'className':names[cls],'xywh':[x,y,w,h]});class_boxes[cls]+=1
                    class_images.update({b['classId'] for b in row['labels']})
            except Exception as exc:row['issues'].append('READ_ERROR:'+str(exc))
            issues.extend({'image':n,'issue':i} for i in row['issues']);rows.append(row)
        image_label_paths={r.get('labelFile') for r in rows}
        orphan_labels=[n for n in members if '/labels/' in n and n.endswith('.txt') and n not in image_label_paths]
    duplicate_groups=[v for v in hashes.values() if len(v)>1]
    crossing=[v for v in duplicate_groups if len({n.split('/')[0] for n in v})>1]
    return {'schema':'fixgo.source-yolo-audit.v1','sourceArchive':str(source.resolve()),'archiveSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
            'source':cfg.get('roboflow',{}),'imageCount':len(rows),'splitImages':dict(collections.Counter(r['sourceSplit'] for r in rows)),
            'classes':[{'id':i,'name':name,'images':class_images[i],'boxes':class_boxes[i]} for i,name in enumerate(names)],
            'emptyLabels':sum(not r['labels'] and not r['issues'] for r in rows),'issues':issues,'orphanLabels':orphan_labels,
            'exactPixelDuplicateGroups':duplicate_groups,'crossSplitExactPixelDuplicates':crossing,
            'limitations':['Source annotation is not human-verified FixGo ground truth.','Empty labels do not establish NORMAL.','Existing source splits are not an independent FixGo test.','Pixel duplicate check does not find all near-duplicates.'],
            'images':rows}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('archive',type=Path);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
    result=audit(args.archive);args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k not in ['images','exactPixelDuplicateGroups','crossSplitExactPixelDuplicates']},ensure_ascii=False,indent=2))
