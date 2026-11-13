// Own container only. Never reads .env or DATABASE_URL. No project migration history writes.
const {spawnSync}=require('child_process');
const {mkdtempSync,writeFileSync,readFileSync,rmSync,chmodSync}=require('fs');
const {tmpdir}=require('os');const {join,resolve}=require('path');const {randomBytes}=require('crypto');
const root=resolve(__dirname,'../..');
const exec=(cmd,args,options={})=>{const r=spawnSync(cmd,args,{cwd:root,encoding:'utf8',...options});if(r.status!==0)throw new Error((r.stderr||r.stdout||'').slice(-3000));return r.stdout;};
async function prepare({aiUrl,aiToken,output,sessionMs=120000}={}) {
  const id=randomBytes(10).toString('hex'),name='fixgo-face-research-'+id,dbName='fixgo_face_research_'+id;
  const temp=mkdtempSync(join(tmpdir(),'fixgo-face-research-'));chmodSync(temp,0o700);let created=false;
  const destroy=()=>{if(created)exec('docker',['rm','-f',name]);rmSync(temp,{recursive:true,force:true});};
  try{
    exec('docker',['run','-d','--rm','--name',name,'-e','POSTGRES_DB='+dbName,'-e','POSTGRES_USER=face_research','-e','POSTGRES_PASSWORD='+id,'-p','127.0.0.1::5432','postgis/postgis:16-3.4']);created=true;
    let ready=false;for(let i=0;i<100;i++){const r=spawnSync('docker',['exec',name,'pg_isready','-h','127.0.0.1','-U','face_research','-d',dbName]);if(r.status===0){ready=true;break;}Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);}if(!ready)throw new Error('RESEARCH_DATABASE_START_FAILED');
    const port=exec('docker',['port',name,'5432']).trim().split(':').pop();if(!/^\d+$/.test(port))throw new Error();
    const databaseUrl=`postgresql://face_research:${id}@127.0.0.1:${port}/${dbName}?schema=public`;
    const env={...process.env,DATABASE_URL:databaseUrl};
    const baselinePath=join(temp,'baseline.prisma');writeFileSync(baselinePath,exec('git',['show','f6737fd:server/prisma/schema.prisma']));
    const baseline=exec(process.execPath,['node_modules/prisma/build/index.js','migrate','diff','--from-empty','--to-schema-datamodel',baselinePath,'--script'],{env}).replace(/CREATE TABLE "spatial_ref_sys" \([\s\S]*?\);/g,'');
    const sql=input=>exec('docker',['exec','-i',name,'psql','-U','face_research','-d',dbName,'-v','ON_ERROR_STOP=1'],{input});
    sql(baseline);
    for(const migration of ['20261113190000_face_core_v2','20261113200000_face_binding_hardening'])sql(readFileSync(join(root,'prisma/migrations',migration,'migration.sql'),'utf8'));
    exec(process.execPath,['node_modules/prisma/build/index.js','migrate','diff','--from-url',databaseUrl,'--to-schema-datamodel','prisma/schema.prisma','--script','--exit-code'],{env});
    sql(readFileSync(join(__dirname,'schema.sql'),'utf8'));sql(`INSERT INTO face_research.environment(id) VALUES('${id}');`);
    const {PrismaClient}=require('@prisma/client');const {JwtService}=require('@nestjs/jwt');const db=new PrismaClient({datasources:{db:{url:databaseUrl}}});
    const config={environmentId:id,databaseUrl,aiUrl,aiToken,jwtKey:randomBytes(32).toString('hex'),nonceKey:randomBytes(32).toString('hex'),captureApproved:false,sessionMs,port:0};
    let fixtures;
    try{
      const user=await db.user.create({data:{role:'WORKER',workerProfile:{create:{approvalStatus:'APPROVED'}}},include:{workerProfile:true}});
      const other=await db.user.create({data:{role:'WORKER',workerProfile:{create:{approvalStatus:'APPROVED'}}},include:{workerProfile:true}});
      const customer=await db.user.create({data:{role:'CUSTOMER'}}),admin=await db.user.create({data:{role:'ADMIN'}});
      const category=await db.serviceCategory.create({data:{name:'Research synthetic fixture'}});
      const order=await db.order.create({data:{workerId:user.workerProfile.id,customerId:customer.id,categoryId:category.id,status:'ARRIVED',addressText:'Synthetic research only',lat:10,lng:106,estimatedPrice:100000}});
      await db.biometricState.create({data:{workerId:user.workerProfile.id}});
      await db.biometricReview.create({data:{workerId:user.workerProfile.id,reviewerId:admin.id,kind:'ENROLLMENT',evidenceReference:'synthetic:research-review',evidenceDigest:'a'.repeat(64),reason:'Synthetic protocol test; no person reviewed',approvedAt:new Date(),expiresAt:new Date(Date.now()+86400000),epoch:0}});
      const token=id=>new JwtService().sign({sub:id,role:'WORKER'},{secret:config.jwtKey,algorithm:'HS256',audience:'fixgo-face-research',issuer:config.environmentId,expiresIn:'2h'});
      fixtures={userId:user.id,workerId:user.workerProfile.id,otherUserId:other.id,orderId:order.id,token:token(user.id),otherToken:token(other.id)};
    }finally{await db.$disconnect();}
    const path=output||join(temp,'config.json');writeFileSync(path,JSON.stringify(config,null,2),{mode:0o600});chmodSync(path,0o600);
    const fixturePath=join(temp,'fixtures.json');writeFileSync(fixturePath,JSON.stringify(fixtures,null,2),{mode:0o600});
    return {config,fixtures,path,fixturePath,container:name,destroy};
  }catch(error){destroy();throw error;}
}
module.exports={prepare};
if(require.main===module){(async()=>{if(!process.argv[2]||!process.env.FACE_RESEARCH_AI_URL||!process.env.FACE_RESEARCH_AI_TOKEN)throw new Error('Explicit private output path and research AI configuration required');const p=await prepare({output:process.argv[2],aiUrl:process.env.FACE_RESEARCH_AI_URL,aiToken:process.env.FACE_RESEARCH_AI_TOKEN});console.log(JSON.stringify({configPath:p.path,fixturePath:p.fixturePath,container:p.container,cleanup:'docker rm -f '+p.container,researchOnly:true}));})().catch(e=>{console.error('PREPARE_FAILED',e.message);process.exitCode=1;});}
