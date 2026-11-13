"""Approved catalog/migration-metadata only. Never loads app/Prisma or queries app rows."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
from urllib.parse import urlsplit, unquote

SQL=Path(__file__).with_name('catalog-readonly.sql').read_text()

def collect(env):
    result=subprocess.run(['psql','-X','-q','-t','-A','-v','ON_ERROR_STOP=1'],input=SQL,text=True,capture_output=True,env=env,timeout=25)
    if result.returncode: raise RuntimeError('Read-only catalog collection failed; no database writes attempted')
    data=json.loads(result.stdout.strip())
    if data['identity']['read_only']!='on': raise RuntimeError('Read-only not established')
    if any(c['table_name']=='_prisma_migrations' for c in data['columns']):
        query="BEGIN READ ONLY; SET LOCAL statement_timeout='15000'; SELECT coalesce(json_agg(x),'[]'::json) FROM (SELECT migration_name,checksum,finished_at,rolled_back_at,applied_steps_count FROM public._prisma_migrations ORDER BY started_at,migration_name) x; COMMIT;"
        r=subprocess.run(['psql','-X','-q','-t','-A','-v','ON_ERROR_STOP=1'],input=query,text=True,capture_output=True,env=env,timeout=25)
        if r.returncode: raise RuntimeError('Migration metadata collection denied')
        data['migration_metadata']=json.loads(r.stdout.strip())
    else:data['migration_metadata']=None
    return data

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--source-env',required=True);p.add_argument('--expect-host',required=True);p.add_argument('--expect-port',required=True,type=int);p.add_argument('--expect-database',required=True);p.add_argument('--out',required=True)
    args=p.parse_args();s=Path(args.source_env).read_text()
    m=re.search(r'^DATABASE_URL\s*=\s*["\x27]?([^\n"\x27]+)',s,re.M)
    if not m:raise SystemExit('No explicit DATABASE_URL; no fallback')
    u=urlsplit(m.group(1));database=unquote(u.path.lstrip('/'))
    if u.scheme not in ('postgres','postgresql') or u.hostname!=args.expect_host or u.port!=args.expect_port or database!=args.expect_database:raise SystemExit('Connection identity mismatch; refusing connection')
    env={**os.environ,'PGHOST':u.hostname,'PGPORT':str(u.port),'PGDATABASE':database,'PGUSER':unquote(u.username or ''),'PGPASSWORD':unquote(u.password or ''),'PGOPTIONS':'-c default_transaction_read_only=on -c statement_timeout=15000','PGCONNECT_TIMEOUT':'5'}
    for key in ['PGSERVICE','PGSERVICEFILE','PGHOSTADDR','PGPASSFILE']:env.pop(key,None)
    # Verify the actual target before the catalog snapshot. Identity/system settings only.
    q="BEGIN READ ONLY; SELECT json_build_object('database',current_database(),'role',current_user,'port',inet_server_port(),'read_only',current_setting('transaction_read_only')); COMMIT;"
    r=subprocess.run(['psql','-X','-q','-t','-A','-v','ON_ERROR_STOP=1'],input=q,text=True,capture_output=True,env=env,timeout=10)
    if r.returncode:raise SystemExit('Read-only connection verification failed')
    identity=json.loads(r.stdout.strip())
    if identity!={'database':database,'role':unquote(u.username or ''),'port':args.expect_port,'read_only':'on'}:raise SystemExit('Server identity mismatch')
    out=Path(args.out).resolve()
    if out.is_relative_to(Path(__file__).resolve().parents[3]):raise SystemExit('Raw catalog must stay outside the repository')
    data=collect(env);out.parent.mkdir(parents=True,exist_ok=True)
    fd=os.open(out,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,'w') as f:json.dump(data,f,indent=2,default=str);f.write('\n')
    print(json.dumps({'database':database,'read_only':True,'application_rows_read':False,'catalog_columns':len(data['columns']),'migration_records':None if data['migration_metadata'] is None else len(data['migration_metadata']),'snapshot_sha256':hashlib.sha256(out.read_bytes()).hexdigest()}))
