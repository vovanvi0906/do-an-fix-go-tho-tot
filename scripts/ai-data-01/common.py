"""Read-only image utilities and graph grouping; no production imports."""
import hashlib,io,json,math,zipfile
from pathlib import Path,PurePosixPath
import cv2
import numpy as np
from PIL import Image,ImageOps

IMAGE_EXT={'.jpg','.jpeg','.png','.webp','.bmp','.tif','.tiff','.gif'}

def digest(data):return hashlib.sha256(data).hexdigest()
def canonical(obj):return json.dumps(obj,ensure_ascii=False,sort_keys=True,separators=(',',':'))

def read_asset(location,max_bytes=40*1024**2):
    if '!/' in location:
        archive,entry=location.split('!/',1);p=PurePosixPath(entry)
        if p.is_absolute() or '..' in p.parts or '\\' in entry:raise ValueError('Unsafe ZIP entry')
        with zipfile.ZipFile(archive) as z:
            info=z.getinfo(entry)
            if info.file_size>max_bytes:raise ValueError('Oversize image')
            with z.open(info) as f:data=f.read(max_bytes+1)
    else:
        p=Path(location)
        if p.stat().st_size>max_bytes:raise ValueError('Oversize image')
        data=p.read_bytes()
    if len(data)>max_bytes:raise ValueError('Oversize image')
    return data

def image_facts(location):
    data=read_asset(location);result={'sha256':digest(data),'bytes':len(data)}
    with Image.open(io.BytesIO(data)) as im:
        if im.width*im.height>40_000_000:raise ValueError('Pixel limit')
        result.update(width=im.width,height=im.height,format=im.format,frames=getattr(im,'n_frames',1),exif_orientation=im.getexif().get(274,1))
        im.load();rgb=np.asarray(ImageOps.exif_transpose(im).convert('RGB'))
    bgr=cv2.cvtColor(rgb,cv2.COLOR_RGB2BGR);gray=cv2.cvtColor(bgr,cv2.COLOR_BGR2GRAY)
    low=cv2.dct(cv2.resize(gray,(32,32)).astype(np.float32))[:8,:8].flatten();bits=low[1:]>np.median(low[1:])
    small=cv2.resize(gray,(9,8));dh=small[:,1:]>small[:,:-1]
    result.update(pixel_sha256=digest(bgr.tobytes()+str(bgr.shape).encode()),phash=f'{sum(int(b)<<i for i,b in enumerate(bits)):016x}',dhash=f'{sum(int(b)<<i for i,b in enumerate(dh.flatten())):016x}',brightness=round(float(gray.mean()),3),sharpness=round(float(cv2.Laplacian(gray,cv2.CV_64F).var()),3),_thumb=cv2.resize(gray,(32,32)).astype(np.float32)/255)
    return result

class Union:
    def __init__(self,n):self.parent=list(range(n));self.size=[1]*n
    def find(self,x):
        while self.parent[x]!=x:self.parent[x]=self.parent[self.parent[x]];x=self.parent[x]
        return x
    def join(self,a,b):
        a,b=self.find(a),self.find(b)
        if a==b:return
        if self.size[a]<self.size[b]:a,b=b,a
        self.parent[b]=a;self.size[a]+=self.size[b]

class BKTree:
    """Exact Hamming radius search over unique pHash values, not ANN."""
    def __init__(self):self.root=None
    def add(self,value):
        if self.root is None:self.root=(value,{});return
        node=self.root
        while True:
            d=(value^node[0]).bit_count()
            if not d:return
            if d not in node[1]:node[1][d]=(value,{});return
            node=node[1][d]
    def search(self,value,radius):
        pending=[self.root] if self.root else []
        while pending:
            n=pending.pop();d=(value^n[0]).bit_count()
            if d<=radius:yield n[0],d
            pending.extend(child for k,child in n[1].items() if d-radius<=k<=d+radius)

def parse_yolo(content,names,width,height):
    annotations=[];errors=[]
    for line_no,line in enumerate(content.splitlines(),1):
        if not line.strip():continue
        fields=line.split()
        try:
            if not fields[0].isdigit():raise ValueError('class ID must be nonnegative integer')
            cls=int(fields[0]);xy=list(map(float,fields[1:]))
            if cls>=len(names):raise ValueError('class outside YAML names')
            if not all(math.isfinite(v) and 0<=v<=1 for v in xy):raise ValueError('coordinates non-finite or outside [0,1]')
            if len(xy)==4:
                x,y,w,h=xy
                if w<=0 or h<=0 or x-w/2<0 or x+w/2>1 or y-h/2<0 or y+h/2>1:raise ValueError('bbox outside image or empty')
                fmt='bbox'
                if w*width<2 or h*height<2:errors.append(f'line {line_no}: bbox smaller than 2px, needs geometry review')
            elif len(xy)>=6 and len(xy)%2==0:
                fmt='polygon';points=list(zip(xy[::2],xy[1::2]))
                area=abs(sum(points[i][0]*points[(i+1)%len(points)][1]-points[(i+1)%len(points)][0]*points[i][1] for i in range(len(points))))/2
                if area==0:raise ValueError('degenerate polygon')
            else:raise ValueError('expected YOLO bbox5 or polygon pairs')
            annotations.append({'class_id':cls,'source_label':names[cls],'format':fmt,'coordinates':xy})
        except (ValueError,IndexError) as e:errors.append(f'line {line_no}: {e}')
    return annotations,errors

def choose_pilot(rows,targets,per_target=10):
    """Development review queue, globally distinct conservative source components."""
    selected=[];used=set()
    for slug in ['o-cam-dien','may-lanh-dieu-hoa','voi-nuoc-voi-sen','tu-lanh-tu-lanh-side-by-side','may-giat-may-giat-say']:
        tid=next(t['id'] for t in targets.values() if t['slug']==slug);count=0
        candidates=sorted([r for r in rows if r['corpus']=='raw_source' and tid in json.loads(r['direct_object_candidate_ids_json']) and r['decode_status']=='OK' and r['annotation_status']=='PARSED_SOURCE_UNVERIFIED'],key=lambda r:(r['prepared_development_split']!='val',digest(('ai-data-01:'+r['image_id']).encode())))
        for r in candidates:
            if r['proposed_source_component'] in used:continue
            used.add(r['proposed_source_component']);count+=1
            selected.append(dict(image_id=r['image_id'],path=r['path'],target_id=tid,target_slug=slug,proposed_source_component=r['proposed_source_component'],purpose='DEVELOPMENT_REGRESSION_REVIEW_ONLY',independent_test_eligible=False,ground_truth='NOT_REVIEWED',rights='UNVERIFIED',exposure=r['component_exposure_json']))
            if count>=per_target:break
    return selected
