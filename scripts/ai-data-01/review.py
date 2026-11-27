#!/usr/bin/env python3
"""Loopback-only reviewer. Writes append-only PROPOSALS to a separate state directory."""
import argparse,csv,fcntl,hashlib,hmac,io,json,math,os,secrets,threading
from datetime import datetime,timezone
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs,urlparse
from PIL import Image,ImageOps
from common import canonical,digest,read_asset
REPO=Path(__file__).resolve().parents[2]
DECISIONS={'needs_review','reject_proposal','label_proposal'}

class Store:
    def __init__(self,inventory,state):
        self.inventory=inventory.resolve();self.audit=self.inventory.parent
        with self.inventory.open(newline='') as f:self.rows={r['image_id']:r for r in csv.DictReader(f)}
        self.catalog=json.loads((self.audit/'evidence/catalog.json').read_text());self.targets={t['id']:t for t in self.catalog['targets']};self.signs=json.loads((self.audit/'evidence/ontology.json').read_text())['signs']
        self.state=state.resolve()
        protected=[REPO,Path.home()/'Work/datasetai',Path.home()/'Downloads']
        if any(self.state==p or self.state.is_relative_to(p) or p.is_relative_to(self.state) for p in protected):raise ValueError('Review state must be outside repository, dataset tree and source Downloads, e.g. /tmp/fixgo-ai-data-review')
        self.state.mkdir(parents=True,exist_ok=True,mode=0o700);self.lockfile=(self.state/'.writer.lock').open('a');fcntl.flock(self.lockfile,fcntl.LOCK_EX|fcntl.LOCK_NB)
        pin={'inventory_sha256':digest(self.inventory.read_bytes()),'catalog_sha256':digest((self.audit/'evidence/catalog.json').read_bytes()),'ontology_sha256':digest((self.audit/'evidence/ontology.json').read_bytes())}
        pinfile=self.state/'inventory-pin.json'
        if pinfile.exists():
            if pinfile.is_symlink() or json.loads(pinfile.read_text())!=pin:
                self.lockfile.close();raise ValueError('Inventory/catalog/ontology revision changed; choose a NEW review state directory')
        else:
            if (self.state/'proposals.jsonl').exists():
                self.lockfile.close();raise ValueError('Nonempty/uninitialized state cannot be adopted automatically')
            with pinfile.open('x',encoding='utf-8') as f:f.write(canonical(pin)+'\n')
        self.log=self.state/'proposals.jsonl';self.mutex=threading.Lock();self.head='0'*64;self.events=[];self.latest={}
        if self.log.is_symlink():raise ValueError('Symlink state log refused')
        if self.log.exists():
            for line in self.log.read_text().splitlines():
                e=json.loads(line);body={k:v for k,v in e.items() if k!='event_hash'}
                if e['previous_hash']!=self.head or digest(canonical(body).encode())!=e['event_hash']:raise ValueError('Review log integrity failure; no automatic repair')
                self.events.append(e);self.head=e['event_hash']
                for i in e['image_ids']:self.latest[i]=e
        self.log_hash=digest(self.log.read_bytes()) if self.log.exists() else None
    def close(self):self.lockfile.close()
    def check(self):
        if (digest(self.log.read_bytes()) if self.log.exists() else None)!=self.log_hash:raise ValueError('State changed outside writer')
    def propose(self,p):
        with self.mutex:
            self.check()
            allowed={'image_ids','decision','reviewer','note','target_ids','sign_labels','boxes','expected_sha256','sign_observation'}
            if not isinstance(p,dict) or set(p)-allowed:raise ValueError('Only proposal fields accepted; no approved/rights/training flags')
            ids=p.get('image_ids');decision=p.get('decision');reviewer=p.get('reviewer','');note=p.get('note','')
            if not isinstance(ids,list) or not 1<=len(ids)<=100 or any(not isinstance(i,str) or i not in self.rows for i in ids) or len(set(ids))!=len(ids):raise ValueError('Choose 1..100 known unique image IDs')
            if decision not in DECISIONS or not isinstance(reviewer,str) or not 2<=len(reviewer.strip())<=200 or not isinstance(note,str) or not 3<=len(note.strip())<=4000:raise ValueError('Reviewer display name and an actual review note required')
            tids=p.get('target_ids',[]);signs=p.get('sign_labels',[]);boxes=p.get('boxes',[]);expected=p.get('expected_sha256',{})
            if not isinstance(tids,list) or any(t not in self.targets for t in tids) or not isinstance(signs,list) or any(s not in self.signs for s in signs):raise ValueError('Target/sign outside snapshot ontology')
            if not isinstance(boxes,list) or len(boxes)>100 or boxes and len(ids)!=1:raise ValueError('Boxes must be drawn separately for ONE image; no bbox batch cloning')
            if not isinstance(expected,dict) or set(expected)!=set(ids):raise ValueError('Expected image SHA required per selected image')
            observation=p.get('sign_observation','not_reviewed')
            if observation not in ['not_reviewed','none_visible_candidate','positive_candidate','uncertain']:raise ValueError('Invalid sign observation')
            if observation=='none_visible_candidate' and (len(ids)!=1 or signs or any(b.get('kind')=='sign' for b in boxes)):raise ValueError('No bulk negative labels and no contradictory sign boxes')
            for box in boxes:
                if not isinstance(box,dict) or set(box)!={'kind','label','xyxy'} or box['kind'] not in ['object','sign']:raise ValueError('Invalid bbox schema')
                if box['label'] not in (self.targets if box['kind']=='object' else self.signs):raise ValueError('Invalid bbox label')
                v=box['xyxy']
                if not isinstance(v,list) or len(v)!=4 or not all(type(n) in [int,float] and math.isfinite(n) and 0<=n<=1 for n in v) or not v[0]<v[2] or not v[1]<v[3]:raise ValueError('BBox must have finite normalized ordered bounds')
                row=self.rows[ids[0]]
                if (v[2]-v[0])*int(row['width'])<2 or (v[3]-v[1])*int(row['height'])<2:raise ValueError('BBox smaller than 2 pixels')
            for i in ids:
                sha=digest(read_asset(self.rows[i]['path']))
                if sha!=self.rows[i]['sha256'] or expected[i]!=sha:raise ValueError('Source hash changed: '+i)
            event=dict(schema='fixgo.ai-data-01.local-review.v1',timestamp_utc=datetime.now(timezone.utc).isoformat(),image_ids=ids,decision=decision,reviewer_display_name=reviewer.strip(),reviewer_identity_verified=False,note=note.strip(),target_ids=tids,sign_labels=signs,boxes=boxes,sign_observation=observation,source_sha256={i:self.rows[i]['sha256'] for i in ids},review_status='human_proposal_not_fixgo_approval',rights_verified=False,approved_ground_truth=False,independently_reviewed=False,training_eligible=False,previous_hash=self.head)
            event['event_hash']=digest(canonical(event).encode())
            with self.log.open('a',encoding='utf-8') as f:f.write(canonical(event)+'\n');f.flush();os.fsync(f.fileno())
            self.events.append(event);self.head=event['event_hash'];self.log_hash=digest(self.log.read_bytes())
            for i in ids:self.latest[i]=event
            return {'saved':len(ids),'event_hash':self.head,'status':'proposal_only'}

def server(store,port=0):
    token=secrets.token_urlsafe(32)
    class Handler(BaseHTTPRequestHandler):
        def log_message(self,*args):pass
        def send(self,status,body,kind='application/json'):
            if not isinstance(body,bytes):body=json.dumps(body,ensure_ascii=False).encode()
            self.send_response(status);self.send_header('Content-Type',kind);self.send_header('Content-Length',str(len(body)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('Cross-Origin-Resource-Policy','same-origin');self.send_header('Referrer-Policy','no-referrer');self.end_headers();self.wfile.write(body)
        def do_GET(self):
            u=urlparse(self.path);query=parse_qs(u.query)
            try:
                if u.path=='/':return self.send(200,Path(__file__).with_name('review.html').read_bytes(),'text/html; charset=utf-8')
                if u.path=='/api/config':return self.send(200,{'token':token,'targets':list(store.targets.values()),'signs':store.signs,'rows':len(store.rows),'mode':'LOCAL_PROPOSALS_ONLY'})
                if u.path=='/api/items':
                    search=query.get('q',[''])[0].casefold();corpus=query.get('corpus',[''])[0];dup=query.get('duplicate',[''])[0];page=max(0,int(query.get('page',['0'])[0]));items=[r for r in store.rows.values() if (not search or search in canonical(r).casefold()) and (not corpus or r['corpus']==corpus) and (not dup or r.get('phash_component_id'))]
                    response=[]
                    for row in items[page*24:(page+1)*24]:response.append({**row,'local_proposal':store.latest.get(row['image_id'])})
                    return self.send(200,{'total':len(items),'items':response,'page':page})
                if u.path=='/api/image':
                    row=store.rows[query.get('id',[''])[0]];data=read_asset(row['path'])
                    if digest(data)!=row['sha256']:raise ValueError('Source image changed')
                    with Image.open(io.BytesIO(data)) as im:
                        im.load();im=ImageOps.exif_transpose(im).convert('RGB');im.thumbnail((1000,1000));buffer=io.BytesIO();im.save(buffer,'PNG')
                    return self.send(200,buffer.getvalue(),'image/png')
                if u.path=='/api/export':
                    with store.mutex:store.check();events=list(store.events)
                    return self.send(200,{'schema':'fixgo.ai-data-01.local-review-export.v1','approved_ground_truth':False,'independent_test_approved':False,'events':events})
                return self.send(404,{'error':'Not found'})
            except (ValueError,KeyError,OSError) as e:return self.send(400,{'error':str(e)})
        def do_POST(self):
            try:
                expected_origin=f'http://127.0.0.1:{self.server.server_address[1]}'
                if self.headers.get('Origin') not in [None,expected_origin] or not hmac.compare_digest(self.headers.get('X-Audit-Token',''),token):return self.send(403,{'error':'Local session token required'})
                if self.path!='/api/propose':return self.send(404,{'error':'Not found'})
                length=int(self.headers.get('Content-Length','0'))
                if not 1<=length<=200_000:raise ValueError('Invalid body size')
                return self.send(200,store.propose(json.loads(self.rfile.read(length))))
            except (ValueError,KeyError,OSError) as e:return self.send(400,{'error':str(e)})
    return ThreadingHTTPServer(('127.0.0.1',port),Handler)

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--inventory',type=Path,required=True);p.add_argument('--state',type=Path,required=True);p.add_argument('--port',type=int,default=8766);a=p.parse_args()
    store=Store(a.inventory,a.state);http=server(store,a.port);print(f'Local reviewer: http://127.0.0.1:{http.server_address[1]} ; proposal log: {store.log}',flush=True)
    try:http.serve_forever()
    except KeyboardInterrupt:pass
    finally:http.server_close();store.close()
if __name__=='__main__':main()
