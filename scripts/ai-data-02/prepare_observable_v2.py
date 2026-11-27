#!/usr/bin/env python3
"""Research candidate v2: preserve v1 splits, add source-mask crack data, reserve new test."""
import collections,hashlib,io,json,shutil,subprocess
from pathlib import Path
from zipfile import ZipFile
import cv2,numpy as np,yaml
from PIL import Image,ImageDraw
from multiservice_data import BASE,sha

OLD=BASE/'02-curated/fixgo-multiservice-ai-v1'
RAW=BASE/'01-raw/deepcrack-v1'
OUT=BASE/'02-curated/fixgo-multiservice-ai-v2-clean'
TEST=BASE/'03-tests/deepcrack-reserved-v2-clean'

def features(payload):
    with Image.open(io.BytesIO(payload)) as im:
        im=im.convert('RGB');pixel=sha(str(im.size).encode()+im.tobytes());gray=np.asarray(im.convert('L').resize((64,64)),dtype=np.float32)
    return pixel,gray

def similarity(a,b):
    # Both structure and luminance must agree; uniform grey road texture alone is insufficient.
    ma=cv2.GaussianBlur(a,(7,7),1.5);mb=cv2.GaussianBlur(b,(7,7),1.5)
    va=cv2.GaussianBlur(a*a,(7,7),1.5)-ma*ma;vb=cv2.GaussianBlur(b*b,(7,7),1.5)-mb*mb
    cov=cv2.GaussianBlur(a*b,(7,7),1.5)-ma*mb
    return float((((2*ma*mb+6.5025)*(2*cov+58.5225))/((ma*ma+mb*mb+6.5025)*(va+vb+58.5225))).mean())

def duplicates(pixel,gray,refs):
    matches=[]
    for ident,other,othergray in refs:
        if pixel==other:matches.append(ident);continue
        for g in [othergray,othergray[:,::-1]]:
            if np.abs(gray-g).mean()<=12 and similarity(gray,g)>=.94:matches.append(ident);break
    return matches

def main():
    if OUT.exists() or TEST.exists():raise ValueError('Version exists; no overwrite')
    old=json.loads((OLD/'manifest.json').read_text());audit=json.loads((BASE/'02-curated/multiservice-source-audit-v1/audit.json').read_text());names=yaml.safe_load((OLD/'data.yaml').read_text())['names'];crack=next(k for k,v in names.items() if v=='sign:crack')
    source=RAW/'dataset/DeepCrack.zip';archive=sha(source.read_bytes());commit=subprocess.check_output(['git','-C',str(RAW),'rev-parse','HEAD'],text=True).strip()
    # Test v1 has been exposed. Exclude ALL CFD image pairs, not merely its 47 retained images.
    paths={r['path'] for r in audit['records']+old['records']};paths.update(str(p) for p in (BASE/'01-raw/crackforest-external-test-ed57c2d/image').glob('*.jpg'))
    refs=[(str(p),*features(Path(p).read_bytes())) for p in sorted(paths)]
    print('Loaded leakage references',len(refs),flush=True)
    examples=[];excluded=[];new=[]
    with ZipFile(source) as z:
        files=set(z.namelist())
        for partition in ['test','train']:
            for member in sorted(n for n in files if n.startswith(partition+'_img/') and Path(n).suffix.lower() in ['.jpg','.png']):
                # Representative inspection found stock watermarks in numbered web-image families.
                # Conservatively restrict this research candidate to camera-name families;
                # filename is a selection policy, never proof of individual rights.
                if not Path(member).stem.startswith(('IMG','7Q')):
                    excluded.append({'member':member,'reason':'NUMBERED_WEB_IMAGE_FAMILY_NOT_CLEARED'});continue
                payload=z.read(member);maskname=partition+'_lab/'+Path(member).stem+'.png';maskbytes=z.read(maskname)
                with Image.open(io.BytesIO(payload)) as im:size=im.size
                with Image.open(io.BytesIO(maskbytes)) as im:mask=np.asarray(im.convert('L'))>127
                if mask.shape!=(size[1],size[0]) or not mask.any():excluded.append({'member':member,'reason':'INVALID_OR_EMPTY_MASK'});continue
                pixel,gray=features(payload);matches=duplicates(pixel,gray,refs)
                if matches:excluded.append({'member':member,'reason':'POSSIBLE_PRIOR_OR_RESERVED_OVERLAP','matches':matches});continue
                family=Path(member).stem.rsplit('-',1)[0];ident='dc-'+sha((archive+'!'+member).encode())[:20]
                split='test' if partition=='test' else ('val' if int(sha(('deepcrack-v2!'+family).encode())[:8],16)%5==0 else 'train')
                # Reserve test first; no related image can enter the training loop later.
                refs.append((ident,pixel,gray))
                ys,xs=np.where(mask);box=[float(xs.min()/size[0]),float(ys.min()/size[1]),float((xs.max()+1)/size[0]),float((ys.max()+1)/size[1])]
                new.append({'imageId':ident,'member':member,'maskMember':maskname,'sha256':sha(payload),'maskSha256':sha(maskbytes),'pixelSha256':pixel,'groupId':'deepcrack!'+family,'split':split,'xyxy':box,'annotationStatus':'SOURCE_MANUAL_SEGMENTATION_ENVELOPE_NOT_NATIVE_DETECTION'})
                examples.append((ident,payload,box))
    # Ensure source filename family never crosses the reserved test boundary.
    testfamilies={r['groupId'] for r in new if r['split']=='test'}
    filtered=[]
    for r in new:
        if r['split']!='test' and r['groupId'] in testfamilies:excluded.append({'member':r['member'],'reason':'RESERVED_TEST_FAMILY'});continue
        filtered.append(r)
    new=filtered
    OUT.mkdir(parents=True);TEST.mkdir(parents=True)
    with ZipFile(source) as z:
        for split in ['train','val']:
            for folder in ['images','labels']:
                shutil.copytree(OLD/folder/split,OUT/folder/split)
        for r in new:
            root=TEST if r['split']=='test' else OUT;split=r['split'];image=root/'images'/split/(r['imageId']+Path(r['member']).suffix);label=root/'labels'/split/(r['imageId']+'.txt');image.parent.mkdir(parents=True,exist_ok=True);label.parent.mkdir(parents=True,exist_ok=True)
            image.write_bytes(z.read(r['member']));x,y,xx,yy=r['xyxy'];label.write_text(f'{crack} {(x+xx)/2:.8f} {(y+yy)/2:.8f} {xx-x:.8f} {yy-y:.8f}\n')
        for root in [OUT,TEST]:
            (root/'SOURCE-DEEPCRACK-README.md').write_bytes(z.read('README.md'));shutil.copy2(RAW/'README.md',root/'SOURCE-REPOSITORY-README.md')
    for p in ['taxonomy.json','ATTRIBUTION.txt']:shutil.copy2(OLD/p,OUT/p)
    (OUT/'data.yaml').write_text(yaml.safe_dump({'path':str(OUT),'train':'images/train','val':'images/val','names':names},sort_keys=False))
    (TEST/'data.yaml').write_text(yaml.safe_dump({'path':str(TEST),'train':str(OUT/'images/train'),'val':str(OUT/'images/val'),'test':'images/test','names':names},sort_keys=False))
    summary={'oldTrainImages':589,'oldValImages':139,'newImages':dict(collections.Counter(r['split'] for r in new)),'excluded':len(excluded),'labelStatus':'AI_AND_SOURCE_UNVERIFIED','commercialProductionEligible':False,'license':'New DeepCrack data restricted to non-commercial research and education.'}
    report={'schema':'fixgo.observable-candidate-data.v2','summary':summary,'parentManifestSha256':sha((OLD/'manifest.json').read_bytes()),'archiveSha256':archive,'repositoryCommit':commit,'newRecords':new,'excluded':excluded,'limitations':['Existing 10-class labels remain AI/source labels.','Additional data supports crack only; does not solve other service coverage.','DeepCrack bounding boxes are derived envelopes of manual masks, not original detection annotations.','Source test pairs quarantined before training; reserve for one final selected candidate, not threshold tuning.','CFD was exposed by prior testing; it cannot be treated as fresh independent test for this improvement cycle.','Conservative SSIM duplicate detection can miss or falsely flag relationships.']}
    (OUT/'manifest.json').write_text(json.dumps(report,indent=2)+'\n');(TEST/'reservation.json').write_text(json.dumps(report,indent=2)+'\n')
    for root in [OUT,TEST]:
        pins={str(p.relative_to(root)):sha(p.read_bytes()) for p in root.rglob('*') if p.is_file()};(root/'SHA256SUMS.json').write_text(json.dumps(pins,indent=2)+'\n')
    # Source annotations only: sample by stable image ID before any v2 inference.
    chosen=[e for e in examples if e[0] in {r['imageId'] for r in new if r['split']=='train'}][:8];sheet=Image.new('RGB',(1000,1440),'#17212b');draw=ImageDraw.Draw(sheet)
    for i,(ident,payload,box) in enumerate(chosen):
        im=Image.open(io.BytesIO(payload)).convert('RGB');d=ImageDraw.Draw(im);d.rectangle([box[0]*im.width,box[1]*im.height,box[2]*im.width-1,box[3]*im.height-1],outline='magenta',width=3);im.thumbnail((490,320));x=(i%2)*500;y=(i//2)*360;sheet.paste(im,(x,y+22));draw.text((x+5,y+4),ident,fill='white')
    sheet.save(OUT/'new-source-samples.jpg');print(json.dumps(summary,indent=2),flush=True)

if __name__=='__main__':main()
