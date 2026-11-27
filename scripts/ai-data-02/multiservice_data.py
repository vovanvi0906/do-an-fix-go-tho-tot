#!/usr/bin/env python3
"""Archive inspection and reproducible source records. No raw mutation or GT approval."""
import collections,hashlib,io,json,math,zipfile
from pathlib import Path,PurePosixPath
import yaml
from PIL import Image,ImageDraw,ImageFont
BASE=Path('/home/vanvi/Work/datasetai')
AUDIT=BASE/'02-curated/multiservice-source-audit-v1'

def sha(data):return hashlib.sha256(data).hexdigest()
def parse_annotation(line,names):
    parts=line.split();cls=int(parts[0]);values=list(map(float,parts[1:]))
    if not 0<=cls<len(names) or not all(math.isfinite(v) for v in values):raise ValueError('Invalid class/nonfinite coordinates')
    if len(values)==4:
        x,y,w,h=values
        if w<=0 or h<=0:raise ValueError('Invalid box extent')
        xy=[x-w/2,y-h/2,x+w/2,y+h/2];kind='bbox'
    elif len(values)>=6 and len(values)%2==0:
        xs,ys=values[::2],values[1::2];xy=[min(xs),min(ys),max(xs),max(ys)];kind='polygon_enclosing_bbox'
        if min(values)<-1e-5 or max(values)>1.00001:raise ValueError('Polygon outside image')
    else:raise ValueError('Invalid annotation dimensions')
    if min(xy)<-1e-5 or max(xy)>1.00001 or xy[2]<=xy[0] or xy[3]<=xy[1]:raise ValueError('Box outside image')
    return {'sourceClass':names[cls],'sourceClassId':cls,'xyxy':[max(0,min(1,v)) for v in xy],'geometry':kind}

def main():
    if AUDIT.exists():raise ValueError('Audit already exists; choose new immutable output')
    (AUDIT/'images').mkdir(parents=True);records=[];sources=[];issues=[];samples=[]
    font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
    for source_index,archive in enumerate(sorted(BASE.glob('*.zip'))):
        archive_hash=sha(archive.read_bytes());counts=collections.Counter();class_rows=collections.defaultdict(list)
        with zipfile.ZipFile(archive) as z:
            members=z.namelist()
            if any(PurePosixPath(n).is_absolute() or '..' in PurePosixPath(n).parts for n in members):raise ValueError('Unsafe archive members')
            if sum(i.file_size for i in z.infolist())>3*1024**3:raise ValueError('Archive too large')
            duplicates=collections.defaultdict(list)
            for entry in z.infolist():duplicates[entry.filename].append(entry)
            for name,entries in duplicates.items():
                if len(entries)>1 and len({sha(z.read(entry)) for entry in entries})>1:raise ValueError('Conflicting duplicate ZIP member: '+name)
            members=list(dict.fromkeys(members))
            cfg=yaml.safe_load(z.read('data.yaml'));names=cfg['names'];names=[names[i] for i in range(len(names))] if isinstance(names,dict) else names
            metadata=cfg.get('roboflow',{});source_key='source-'+str(source_index)
            for name in sorted(members):
                if '/images/' not in name or Path(name).suffix.lower() not in ['.jpg','.jpeg','.png','.webp']:continue
                image_id='multi-'+sha((archive_hash+'!'+name).encode())[:22];label=str(PurePosixPath(name.replace('/images/','/labels/')).with_suffix('.txt'))
                try:
                    if label not in members:raise ValueError('Missing label')
                    annotations=[parse_annotation(line,names) for line in z.read(label).decode().splitlines() if line.strip()]
                    payload=z.read(name)
                    with Image.open(io.BytesIO(payload)) as im:
                        if im.width*im.height>25_000_000 or getattr(im,'n_frames',1)!=1 or im.getexif().get(274,1)!=1:raise ValueError('Unsupported image frame')
                        im.load();rgb=im.convert('RGB');size=rgb.size;pixel_hash=sha(str(size).encode()+rgb.tobytes());small=list(rgb.convert('L').resize((9,8)).get_flattened_data());dhash=sum((small[y*9+x]>small[y*9+x+1])<<(y*8+x) for y in range(8) for x in range(8))
                        thumb=rgb.resize((32,32));thumb_hash=sha(thumb.tobytes())
                    dest=AUDIT/'images'/(image_id+Path(name).suffix.lower());dest.write_bytes(payload)
                    row={'imageId':image_id,'sourceKey':source_key,'archive':str(archive),'archiveSha256':archive_hash,'member':name,'sourceSplit':name.split('/')[0],'path':str(dest),'sha256':sha(payload),'pixelSha256':pixel_hash,'thumbnailSha256':thumb_hash,'dhash':dhash,'width':size[0],'height':size[1],'annotations':annotations,'annotationStatus':'SOURCE_UNVERIFIED','independentTest':False}
                    records.append(row)
                    for a in annotations:counts[a['sourceClass']]+=1
                    for cls in set(a['sourceClass'] for a in annotations):class_rows[cls].append(row)
                except Exception as exc:issues.append({'archive':str(archive),'member':name,'error':str(exc)})
            readmes={n:z.read(n).decode(errors='replace') for n in members if n.startswith('README') and n.endswith('.txt')}
            sources.append({'id':source_key,'archive':str(archive),'sha256':archive_hash,'metadata':metadata,'names':names,'classInstances':dict(counts),'images':sum(r['sourceKey']==source_key for r in records),'readmes':readmes})
            for cls,rows in class_rows.items():
                for row in [rows[0],rows[len(rows)//2]] if len(rows)>1 else rows:samples.append((source_key,cls,row))
    report={'schema':'fixgo.multi-source-audit.v1','sources':sources,'records':records,'issues':issues}
    (AUDIT/'audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    sample_meta=[]
    for page in range((len(samples)+7)//8):
        sheet=Image.new('RGB',(960,1840),'#17212b');draw=ImageDraw.Draw(sheet)
        for slot,(source_key,cls,row) in enumerate(samples[page*8:page*8+8]):
            index=page*8+slot+1;x=(slot%2)*480;y=(slot//2)*460
            im=Image.open(row['path']).convert('RGB');d=ImageDraw.Draw(im)
            for a in row['annotations']:
                if a['sourceClass']==cls:
                    a1,b1,a2,b2=a['xyxy'];d.rectangle([a1*im.width,b1*im.height,a2*im.width,b2*im.height],outline='magenta',width=3)
            im.thumbnail((470,390));sheet.paste(im,(x,y));draw.text((x+3,y+393),f'{index:02d} {source_key} | {cls}',font=font,fill='white');draw.text((x+3,y+414),row['imageId'],font=font,fill='white')
            sample_meta.append({'index':index,'sourceKey':source_key,'class':cls,'imageId':row['imageId']})
        sheet.save(AUDIT/f'sample-sheet-{page+1}.jpg',quality=92)
    (AUDIT/'sample-index.json').write_text(json.dumps(sample_meta,indent=2)+'\n')
    print(json.dumps({'images':len(records),'sources':[{k:s[k] for k in ['id','images','classInstances']} for s in sources],'issues':issues,'sampleImages':len(samples),'sheets':(len(samples)+7)//8},indent=2))
if __name__=='__main__':main()
