// Real TCP -> Nest -> FastAPI -> actual pinned models, synthetic pixels ONLY.
const {spawnSync}=require('child_process');const {randomBytes,randomUUID}=require('crypto');
const {resolve}=require('path');const assert=require('assert/strict');const {writeFileSync}=require('fs');
const {prepare}=require('./prepare.cjs');const {start}=require('./start.cjs');
const run=(args)=>{const r=spawnSync('docker',args,{encoding:'utf8'});if(r.status!==0)throw new Error((r.stderr||'docker failed').slice(-2000));return r.stdout.trim();};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const modelDir=process.env.FACE_RESEARCH_SOURCE_MODEL_DIR,cache=process.env.FACE_RESEARCH_RUNTIME_DIR;
  if(!modelDir||!cache)throw new Error('Explicit existing pinned model directory and isolated runtime directory required');
  const suffix=randomBytes(8).toString('hex'),network='fixgo-face-research-'+suffix,aiName=network+'-ai',aiToken=randomBytes(32).toString('hex');
  let prepared,instance,networkCreated=false,aiCreated=false,checks=0,proxy;const proxySockets=new Set();
  const check=(condition,label)=>{assert.ok(condition,label);checks++;console.log('PASS '+label);};
  try{
    run(['network','create','--internal',network]);networkCreated=true;
    run(['run','-d','--rm','--name',aiName,'--network',network,'--cpus','2','--memory','1g','--read-only','--tmpfs','/tmp','-e','PYTHONDONTWRITEBYTECODE=1','-e','FACE_RESEARCH_ISOLATED=true','-e','FACE_RESEARCH_CAPTURE_APPROVED=false','-e','FACE_RESEARCH_AI_TOKEN='+aiToken,'-e','FACE_RESEARCH_MODEL_DIR=/models','-e','FACE_RESEARCH_PAD_MODEL=/experiment/anti-spoof-mn3.onnx','-v',resolve(cache)+':/experiment:ro','-v',resolve(modelDir)+':/models:ro','-v',resolve(__dirname,'../../../ai-service')+':/app:ro','-w','/app','python:3.11-slim','/experiment/venv/bin/python','-m','uvicorn','face_research_app:app','--host','0.0.0.0','--port','8099','--no-access-log','--log-level','error']);aiCreated=true;
    const ip=run(['inspect','-f','{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}',aiName]);
    const net=require('net');proxy=net.createServer(socket=>{const upstream=net.connect(8099,ip);proxySockets.add(socket);proxySockets.add(upstream);socket.pipe(upstream).pipe(socket);socket.on('error',()=>upstream.destroy());upstream.on('error',()=>socket.destroy());socket.on('close',()=>{proxySockets.delete(socket);upstream.destroy();});upstream.on('close',()=>proxySockets.delete(upstream));});
    await new Promise(r=>proxy.listen(0,'127.0.0.1',r));const aiUrl='http://127.0.0.1:'+proxy.address().port;
    let ready=false;for(let i=0;i<100;i++){try{const r=await fetch(aiUrl+'/research/capabilities',{headers:{'x-face-research-token':aiToken},signal:AbortSignal.timeout(500)});if(r.ok){ready=true;break;}}catch(_){}await delay(100);}
    if(!ready)throw new Error('AI_START_FAILED '+run(['logs',aiName]));
    prepared=await prepare({aiUrl,aiToken});if(process.argv.includes('--serve'))prepared.config.port=3107;instance=await start(prepared.config);
    const f=prepared.fixtures;
    const {createResearchClient}=require('../../../worker-app/src/features/face-research/client');
    const mobileClient=createResearchClient(instance.url,f.token);
    check((await mobileClient.get('/capabilities')).researchOnly===true,'actual Android research client reaches Nest and FastAPI');
    async function request(path,body,{token=f.token,method=body?'POST':'GET'}={}){
      const r=await fetch(instance.url+'/face-research'+path,{method,headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:await r.json()};
    }
    const create=(purpose='ENROLLMENT',requestKey=randomUUID(),token=f.token,orderId)=>request('/sessions',{purpose,requestKey,...(orderId?{orderId}:{})},{token});
    const submit=(s,token=f.token,nonce=s.nonce)=>request(`/sessions/${s.id}/synthetic`,{nonce},{token});
    const erase=()=>request('/sessions',undefined,{method:'DELETE'});
    check((await request('/capabilities',undefined,{token:null})).status===401,'authentication required');
    const caps=(await request('/capabilities')).body.data;
    check(caps.padReady&&caps.modelVersion.startsWith('yunet-sface:')&&!caps.cameraAllowed&&!caps.proofAllowed,'actual models ready, camera and proof locked');
    const key=randomUUID(),created=await Promise.all([create('ENROLLMENT',key),create('ENROLLMENT',key)]);
    check(created.every(x=>x.status===201)&&created[0].body.data.id===created[1].body.data.id,'concurrent create idempotent in PostgreSQL');
    const s=created[0].body.data;
    check((await create('DAILY',key)).status===409,'purpose mismatch idempotency rejected');
    check((await submit(s,f.otherToken)).status===403,'wrong worker rejected');
    check((await submit(s,f.token,'wrong-nonce')).status===400,'wrong nonce rejected');
    const capture=await fetch(instance.url+`/face-research/sessions/${s.id}/capture`,{method:'POST',headers:{authorization:'Bearer '+f.token,'x-research-nonce':s.nonce,'content-type':'multipart/form-data; boundary=test'},body:'not an image'});
    check(capture.status===403,'camera blocked before multipart parsing');
    const racing=await Promise.all([submit(s),submit(s)]);
    check(racing.some(r=>r.status===201)&&racing.every(r=>[201,409].includes(r.status)),'concurrent submit serialized without duplicate inference');
    const [attempt]=await instance.db.$queryRaw`SELECT attempts FROM face_research.sessions WHERE id=${s.id}`;
    check(attempt.attempts===1,'duplicate concurrent capture consumes one inference attempt');
    const first=racing.find(r=>r.status===201),duplicate=await submit(s);
    assert.equal(first.status,201,JSON.stringify(first.body));assert.equal(duplicate.status,201,JSON.stringify(duplicate.body));assert.deepEqual(first.body.data,duplicate.body.data);check(true,'lost response retry returns persisted identical measurement');
    const measured=first.body.data;
    check(measured.errorCode==='NO_FACE'&&measured.identityScore===null&&measured.padRealScore===null&&measured.verified===false&&measured.enrolled===false&&measured.proof===null,'real YuNet blank produces NO_FACE, never fabricated score or success');
    check(await instance.db.biometricProof.count()===0&&await instance.db.biometricTemplate.count()===0,'no production template or proof created');
    await assert.rejects(()=>instance.service.submit(f.userId,s.id,{nonce:s.nonce,synthetic:true,photo:'fake'}));checks++;console.log('PASS synthetic endpoint rejects supplied media');
    for(const purpose of ['DAILY','ORDER']){
      if(purpose==='DAILY'){
        const s=await mobileClient.post('/sessions',{purpose,requestKey:randomUUID()});
        const r=await mobileClient.post(`/sessions/${s.id}/synthetic`,{nonce:s.nonce});
        check(r.researchOnly===true&&r.verified===false&&r.purpose==='DAILY','Android client POST session and nonce through real inference');
      }else{
        const r=await create(purpose,randomUUID(),f.token,f.orderId);
        check(r.status===201&&(await submit(r.body.data)).body.data.verified===false,purpose+' session through real FastAPI');
      }
    }
    check((await create('ORDER',randomUUID(),f.otherToken,f.orderId)).status===403,'wrong order ownership rejected');
    const expiry=(await create()).body.data;
    await instance.db.$executeRaw`UPDATE face_research.sessions SET expires_at=clock_timestamp()-interval '1 second' WHERE id=${expiry.id}`;
    check((await submit(expiry)).status===400,'expired session rejected');
    await erase();
    const timeoutSession=(await create()).body.data;
    const http=require('http'),hung=http.createServer((req,res)=>{req.resume();});await new Promise(r=>hung.listen(0,'127.0.0.1',r));
    const actualUrl=instance.service.config.aiUrl;instance.service.config.aiUrl='http://127.0.0.1:'+hung.address().port;instance.service.config.timeoutMs=30;
    try{check((await submit(timeoutSession)).status===504,'real HTTP timeout fails closed');}finally{hung.closeAllConnections();await new Promise(r=>hung.close(r));instance.service.config.aiUrl=actualUrl;instance.service.config.timeoutMs=10000;}
    check((await submit(timeoutSession)).status===201,'retry after timeout succeeds only as measurement');
    await erase();
    const offlineSession=(await create()).body.data;
    instance.service.config.aiUrl='http://127.0.0.1:1';try{check((await submit(offlineSession)).status===503,'network disconnect fails closed');}finally{instance.service.config.aiUrl=actualUrl;}
    check((await submit(offlineSession)).status===201,'same nonce retry after network restored');
    await erase();
    check((await instance.db.$queryRaw`SELECT count(*)::int AS n FROM face_research.sessions WHERE user_id=${f.userId}`)[0].n===0,'research measurement deletion');
    check(await instance.db.biometricProof.count()===0&&await instance.db.biometricTemplate.count()===0,'all error and retry paths leave authority tables empty');
    const report={checks,syntheticOnly:true,realModelsLoaded:true,realPositiveFaceTest:false,androidClientModuleTest:true,androidDeviceTest:false,projectDatabaseUsed:false,measurement:measured};
    if(process.env.FACE_RESEARCH_REPORT)writeFileSync(process.env.FACE_RESEARCH_REPORT,JSON.stringify(report,null,2)+'\n');
    console.log('TOTAL '+checks+' checks PASS; no real biometric data or proof');
    if(process.argv.includes('--serve')){
      console.log(JSON.stringify({url:instance.url,configPath:prepared.path,privateFixturePath:prepared.fixturePath,androidRoute:'/face-research',captureAllowed:false,stop:'Ctrl+C removes owned containers and private config'}));
      await new Promise(resolve=>{process.once('SIGINT',resolve);process.once('SIGTERM',resolve);});
    }
  }finally{if(instance)await instance.close();if(prepared)prepared.destroy();if(proxy){for(const s of proxySockets)s.destroy();await new Promise(r=>proxy.close(r));}if(aiCreated)run(['rm','-f',aiName]);if(networkCreated)run(['network','rm',network]);}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
