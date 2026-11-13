// Offline target construction + comparison; NEVER connects to snapshot source database.
const {spawnSync}=require('child_process');const {readFileSync,writeFileSync,mkdtempSync,rmSync}=require('fs');const {resolve,join}=require('path');const {tmpdir}=require('os');const {randomUUID}=require('crypto');
const root=resolve(__dirname,'../..'),[snapshotPath,outPath]=process.argv.slice(2);
if(!snapshotPath||!outPath)throw Error('Explicit private snapshot and output paths required');
const live=JSON.parse(readFileSync(snapshotPath,'utf8'));if(live.identity.read_only!=='on')throw Error('Read-only snapshot required');
const name='fixgo-face-catalog-'+randomUUID(),temp=mkdtempSync(join(tmpdir(),'face-catalog-'));let created=false;
function run(cmd,args,opts={}){const r=spawnSync(cmd,args,{cwd:root,encoding:'utf8',...opts});if(r.status!==0)throw Error((r.stderr||r.stdout||'command failed').slice(-2000));return r.stdout;}
const sql=q=>run('docker',['exec','-i',name,'psql','-X','-q','-t','-A','-U','face_catalog','-d','face_catalog','-v','ON_ERROR_STOP=1'],{input:q});
try{
 run('docker',['run','-d','--rm','--network','none','--name',name,'-e','POSTGRES_DB=face_catalog','-e','POSTGRES_USER=face_catalog','-e','POSTGRES_PASSWORD=synthetic-catalog-only','postgis/postgis:16-3.4']);created=true;
 let ready=false;for(let i=0;i<100;i++){if(spawnSync('docker',['exec',name,'pg_isready','-h','127.0.0.1','-U','face_catalog','-d','face_catalog']).status===0){ready=true;break;}Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);}if(!ready)throw Error('Disposable catalog DB unavailable');
 const env={...process.env,DATABASE_URL:'postgresql://offline:offline@127.0.0.1:1/offline'};
 writeFileSync(join(temp,'baseline.prisma'),run('git',['show','f6737fd:server/prisma/schema.prisma']));
 let baseline=run(process.execPath,['node_modules/prisma/build/index.js','migrate','diff','--from-empty','--to-schema-datamodel',join(temp,'baseline.prisma'),'--script'],{env});
 baseline=baseline.replace(/CREATE TABLE "spatial_ref_sys" \([\s\S]*?\);/g,'');sql(baseline);
 const preface=JSON.parse(sql(readFileSync(join(__dirname,'catalog-readonly.sql'),'utf8')));
 for(const folder of ['20261113190000_face_core_v2','20261113200000_face_binding_hardening'])sql(readFileSync(join(root,'prisma/migrations',folder,'migration.sql'),'utf8'));
 const target=JSON.parse(sql(readFileSync(join(__dirname,'catalog-readonly.sql'),'utf8')));
 function compare(a,b){const rows={};for(const category of ['columns','enums','constraints','indexes','triggers','functions']){
 const key=r=>category==='columns'?r.table_name+'.'+r.column_name:category==='enums'?r.name+'.'+r.value:category==='functions'?r.name+'('+r.arguments+')':(r.table_name||'')+'.'+r.name;
 const left=new Map(a[category].map(r=>[key(r),r])),right=new Map(b[category].map(r=>[key(r),r]));
 rows[category]={missing:[...right.keys()].filter(k=>!left.has(k)),extra:[...left.keys()].filter(k=>!right.has(k)),changed:[...right.keys()].filter(k=>left.has(k)&&JSON.stringify(left.get(k))!==JSON.stringify(right.get(k))).map(k=>({key:k,actual:left.get(k),target:right.get(k)}))};}return rows;}
 const report={sourceIdentity:live.identity,sourceExtensions:live.extensions,targetExtensions:target.extensions,migrationMetadataPresent:live.migration_metadata!==null,preface:compare(live,preface),target:compare(live,target)};
 writeFileSync(outPath,JSON.stringify(report,null,2)+'\n',{mode:0o600,flag:'wx'});
 console.log(JSON.stringify({migrationMetadataPresent:report.migrationMetadataPresent,preface:Object.fromEntries(Object.entries(report.preface).map(([k,v])=>[k,{missing:v.missing.length,extra:v.extra.length,changed:v.changed.length}])),target:Object.fromEntries(Object.entries(report.target).map(([k,v])=>[k,{missing:v.missing.length,extra:v.extra.length,changed:v.changed.length}]))},null,2));
}finally{if(created)run('docker',['rm','-f',name]);rmSync(temp,{recursive:true,force:true});}
