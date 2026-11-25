#!/usr/bin/env python3
"""Local Dataset Studio. No production server, database or model mutation."""
import argparse,hmac,io,json,os,secrets,subprocess,sys,threading
from pathlib import Path
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlparse,parse_qs
from PIL import Image,ImageOps
from core import Studio,REPO,array,canonical,digest,read_asset,atomic,now
from exporter import export
from selection import filtered_ids
from autolabel import request_run, load_request, read_report, run_dir, export_pseudo

def server(store,port=8767):
    token=secrets.token_urlsafe(32);job={'process':None};job_lock=threading.Lock()
    def launch_auto(request):
        folder=run_dir(store.state,request['runId'])
        (folder/'STOP').unlink(missing_ok=True)
        atomic(store.state/'auto-active.json',{'runId':request['runId']})
        atomic(folder/'progress.json',{'runId':request['runId'],'status':'STARTING','requested':len(request['imageIds']),'processed':0})
        log=(folder/'worker.log').open('a')
        try:job['process']=subprocess.Popen([sys.executable,str(Path(__file__).with_name('autolabel.py')),'--inventory',str(store.inventory),'--state',str(store.state),'--run-id',request['runId']],stdout=log,stderr=log,cwd=REPO,start_new_session=True)
        finally:log.close()
        job['autoRunId']=request['runId']
        return {'runId':request['runId'],'requested':len(request['imageIds']),'skippedHumanImages':len(request['skippedHumanImages']),'status':'STARTING'}
    class Handler(BaseHTTPRequestHandler):
        def log_message(self,*args):pass
        def send(self,status,body,kind='application/json; charset=utf-8'):
            if not isinstance(body,bytes):body=json.dumps(body,ensure_ascii=False).encode()
            self.send_response(status);self.send_header('Content-Type',kind);self.send_header('Content-Length',str(len(body)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('Cross-Origin-Resource-Policy','same-origin');self.send_header('Referrer-Policy','no-referrer');self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'");self.end_headers();self.wfile.write(body)
        def valid_host(self):return self.headers.get('Host') in [f'127.0.0.1:{self.server.server_port}',f'localhost:{self.server.server_port}']
        def do_GET(self):
            if not self.valid_host():return self.send(403,{'error':'Loopback Host required'})
            u=urlparse(self.path);q={k:v[0] for k,v in parse_qs(u.query).items()}
            try:
                if u.path=='/':return self.send(200,Path(__file__).with_name('studio.html').read_bytes(),'text/html; charset=utf-8')
                if u.path=='/api/config':return self.send(200,{'token':token,'singleReviewAction':True,'autoLabeling':True,'categories':store.catalog['categories'],'targets':list(store.targets.values()),'signs':store.signs,'taxonomy':store.taxonomy.config(),'session':store.session,'pilot':store.pilot,'sources':sorted({r['corpus'] for r in store.rows.values()})})
                if u.path=='/api/auto-job':
                    pointer=store.state/'auto-active.json'
                    if not pointer.exists():return self.send(200,{'status':'IDLE'})
                    run_id=json.loads(pointer.read_text())['runId'];folder=run_dir(store.state,run_id)
                    progress=json.loads((folder/'progress.json').read_text())
                    if job.get('autoRunId')==run_id and job['process'] and job['process'].poll() is None:
                        batch_path=store.state/'batch-progress.json'
                        if batch_path.exists() and progress['status'] in ['STARTING','RUNNING']:
                            batch=json.loads(batch_path.read_text())
                            if batch.get('startedAt','')>=load_request(store.state,run_id)['createdAt']:progress={**batch,'runId':run_id,'status':'RUNNING'}
                    elif progress['status'] in ['STARTING','RUNNING','BUILDING_REPORT']:
                        batch_path=store.state/'batch-progress.json'
                        failed=json.loads(batch_path.read_text()) if batch_path.exists() else {}
                        if failed.get('startedAt','')>=load_request(store.state,run_id)['createdAt'] and failed.get('status')=='FAILED':progress={**failed,'runId':run_id}
                        else:progress={**progress,'status':'INTERRUPTED'}
                    return self.send(200,progress)
                if u.path=='/api/auto-report':
                    report=read_report(store.state,q['runId']);records=report['records']
                    if q.get('bucket'):records=[r for r in records if r['bucket']==q['bucket']]
                    page=max(0,int(q.get('page',0)))
                    return self.send(200,{'runId':report['runId'],'summary':report['summary'],'limitations':report['limitations'],'total':len(records),'page':page,'items':records[page*24:page*24+24]})
                if u.path=='/api/source-profiles':return self.send(200,store.source_profiles.list())
                if u.path=='/api/summary':return self.send(200,store.summary())
                if u.path=='/api/session':return self.send(200,store.session)
                if u.path=='/api/job':
                    f=store.state/'batch-progress.json';return self.send(200,json.loads(f.read_text()) if f.exists() else {'status':'IDLE'})
                if u.path=='/api/detail':return self.send(200,store.detail(q['id']))
                if u.path=='/api/image':
                    r=store.rows[q['id']];payload=read_asset(r['path'])
                    if digest(payload)!=r['sha256']:raise ValueError('Source changed')
                    with Image.open(io.BytesIO(payload)) as im:
                        if im.width*im.height>25_000_000:raise ValueError('Oversize image')
                        im.load()
                        # Preserve annotation coordinate frame; no EXIF transpose.
                        im=im.convert('RGB');limit=280 if q.get('thumb') else 1600;im.thumbnail((limit,limit));buf=io.BytesIO();im.save(buf,'PNG')
                    return self.send(200,buf.getvalue(),'image/png')
                if u.path=='/api/items':
                    page=max(0,int(q.get('page',0)));items=[]
                    for i,r in store.rows.items():
                        if q.get('pilot')=='1' and i not in store.pilot:continue
                        if q.get('source') and r['corpus']!=q['source']:continue
                        if q.get('group') and q['group'] not in r['proposed_source_component']:continue
                        if q.get('q') and q['q'].casefold() not in (i+' '+r['path']).casefold():continue
                        if q.get('duplicate')=='1' and not (r.get('sha_group_id') or r.get('phash_component_id')):continue
                        status=store.status(i)
                        if q.get('status') and status!=q['status']:continue
                        h=store.studio_latest.get(i);ai=store.ai(i)
                        tids=set((h or {}).get('targetIds',[]))|set(array(r.get('candidate_target_ids_json')))|{t['targetId'] for t in (ai or {}).get('prediction',{}).get('targetCandidates',[])}
                        if q.get('target') and q['target'] not in tids:continue
                        if q.get('category') and not any(store.targets.get(t,{}).get('categoryId')==q['category'] for t in tids):continue
                        signs=set((h or {}).get('defectLabels',[]))|set(array(r.get('sign_candidates_json')))
                        if q.get('label') and q['label'] not in signs:continue
                        items.append({'imageId':i,'status':status,'source':r['corpus'],'group':r['proposed_source_component'],'targetIds':sorted(tids),'revision':(h or {}).get('eventHash'),'width':r['width'],'height':r['height'],'uncertain':(ai or {}).get('prediction',{}).get('uncertain',False)})
                    return self.send(200,{'total':len(items),'page':page,'pageSize':24,'items':items[page*24:page*24+24]})
                return self.send(404,{'error':'Not found'})
            except (ValueError,KeyError,TypeError) as e:return self.send(400,{'error':str(e)})
            except Exception as e:return self.send(500,{'error':str(e)})
        def do_POST(self):
            origin=self.headers.get('Origin');host=self.headers.get('Host')
            if not self.valid_host() or origin not in [None,'http://'+host] or not hmac.compare_digest(self.headers.get('X-CSRF-Token',''),token):return self.send(403,{'error':'Local session token/origin required'})
            try:
                length=int(self.headers.get('Content-Length',0))
                if not 0<length<=1_000_000:raise ValueError('Invalid request size')
                p=json.loads(self.rfile.read(length));route=urlparse(self.path).path
                if route=='/api/auto-start':
                    with job_lock:
                        if job['process'] and job['process'].poll() is None:raise ValueError('A batch is running')
                        if p.get('scope') not in ['selected','filtered']:raise ValueError('Choose selected or filtered scope')
                        ids=p.get('imageIds') if p.get('scope')=='selected' else filtered_ids(store,p.get('filters',{}))
                        result=launch_auto(request_run(store,ids,p.get('signManifest') or None))
                elif route=='/api/auto-resume':
                    with job_lock:
                        if job['process'] and job['process'].poll() is None:raise ValueError('A batch is running')
                        result=launch_auto(load_request(store.state,p['runId']))
                elif route=='/api/auto-stop':
                    request=load_request(store.state,p['runId']);atomic(run_dir(store.state,request['runId'])/'STOP',{'requestedAt':now()});result={'status':'STOP_REQUESTED','runId':request['runId']}
                elif route=='/api/auto-export':result=export_pseudo(store,p['runId'],p['version'],p.get('task','objects'),p.get('acknowledged'))
                elif route=='/api/source-profile' :result=store.source_profiles.save(p)
                elif route=='/api/review':result=store.save(p)
                elif route=='/api/bulk':result=store.bulk(p)
                elif route=='/api/restore':result=store.restore(p)
                elif route=='/api/session':result=store.save_session(p)
                elif route=='/api/export':result=export(store,p['imageIds'],p['format'],p['version'],p.get('seed',42))
                elif route=='/api/infer':
                    ids=p.get('imageIds',store.pilot)
                    if not isinstance(ids,list) or not 1<=len(ids)<=500 or len(ids)!=len(set(ids)) or any(i not in store.rows for i in ids):raise ValueError('Select 1..500 known unique images')
                    with job_lock:
                        if job['process'] and job['process'].poll() is None:raise ValueError('A batch is running')
                        idsfile=store.state/'batch-request.json';atomic(idsfile,ids)
                        log=(store.state/'batch-worker.log').open('a')
                        try:job['process']=subprocess.Popen([sys.executable,str(Path(__file__).with_name('batch.py')),'--inventory',str(store.inventory),'--state',str(store.state),'--ids',str(idsfile),'--threads','2','--ram-mb','3072'],stdout=log,stderr=log,cwd=REPO,start_new_session=True)
                        finally:log.close()
                        result={'status':'STARTING','images':len(ids),'pid':job['process'].pid}
                else:return self.send(404,{'error':'Not found'})
                return self.send(200,result)
            except (ValueError,KeyError,TypeError,BlockingIOError) as e:return self.send(400,{'error':str(e)})
            except Exception as e:return self.send(500,{'error':str(e)})
    http=ThreadingHTTPServer(('127.0.0.1',port),Handler);http.daemon_threads=True;http.studio_job=job
    return http

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--inventory',type=Path,default=REPO/'docs/ai-data-audit/image-inventory.csv');p.add_argument('--state',type=Path,default=Path.home()/'.local/share/fixgo-dataset-studio');p.add_argument('--port',type=int,default=8767);a=p.parse_args();s=Studio(a.inventory,a.state);http=server(s,a.port)
    print(f'FixGo Dataset Studio: http://127.0.0.1:{http.server_port}',flush=True)
    try:http.serve_forever()
    except KeyboardInterrupt:pass
    finally:
        child=http.studio_job['process']
        if child and child.poll() is None:
            child.terminate()
            try:child.wait(timeout=5)
            except subprocess.TimeoutExpired:child.kill();child.wait()
        http.server_close();s.close()
