import { BadRequestException, ForbiddenException, ConflictException, GatewayTimeoutException, ServiceUnavailableException } from '@nestjs/common';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'crypto';
const hash = v => createHash('sha256').update(v).digest('hex');
export const PAD_VERSION = 'experimental:anti-spoof-mn3:c4c99af04603b62d7e44f6f4daeb33e0daeccc696008c0b1d62f6f5cebbb3262';
const fail = code => { throw new BadRequestException(code); };
const text = (x, max=128) => typeof x === 'string' && x.length > 0 && x.length <= max;
export function validateMeasurement(r, session) {
  if (!r || r.researchOnly !== true || r.verified !== false || r.enrolled !== false || r.proof !== null ||
      r.sessionId !== session.id || r.workerId !== session.worker_id || r.modelVersion !== session.model_version ||
      r.padModelVersion !== session.pad_version || r.padDecision !== 'NOT_EVALUATED' ||
      !['MEASURED','INCONCLUSIVE','REFERENCE_NOT_PROVIDED'].includes(r.identityDecision) ||
      r.cropVersion !== 'yunet-tight-bbox-floor-ceil-clamped-linear-128-v1' ||
      r.preprocessingVersion !== 'bgr-u8-128-to-rgb-nchw-normalized-v1' || r.policyVersion !== 'research-no-decision-v1') fail('RESEARCH_EVIDENCE_REJECTED');
  const score=(v,min,max)=>v===null || (typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max);
  if (!score(r.identityScore,-1,1) || (r.identityDecision==='MEASURED') !== (r.identityScore!==null)) fail('RESEARCH_EVIDENCE_REJECTED');
  for (const prefix of ['', 'reference']) {
    const a=r[prefix ? 'referencePadRealScore':'padRealScore'], b=r[prefix ? 'referencePadSpoofScore':'padSpoofScore'];
    if (!score(a,0,1)||!score(b,0,1)||(a===null)!==(b===null)||(a!==null&&Math.abs(a+b-1)>1e-4)) fail('RESEARCH_EVIDENCE_REJECTED');
  }
  function quality(q, nullable=false) {
    if(nullable&&q===null)return null;
    if(!q||!['PASS','FAIL','NOT_EVALUATED'].includes(q.decision))fail('RESEARCH_EVIDENCE_REJECTED');
    for(const k of ['brightness','sharpness'])if(q[k]!=null&&!(typeof q[k]==='number'&&Number.isFinite(q[k])&&q[k]>=0))fail('RESEARCH_EVIDENCE_REJECTED');
    if(q.faceCount!=null&&(!Number.isInteger(q.faceCount)||q.faceCount<0))fail('RESEARCH_EVIDENCE_REJECTED');
    return {decision:q.decision,faceCount:q.faceCount??null,brightness:q.brightness??null,sharpness:q.sharpness??null};
  }
  if(!r.latencyMs||!Object.keys(r.latencyMs).length||Object.entries(r.latencyMs).some(([k,v])=>!/^((probe|reference)(Detection|CropResize|Sface|Pad)|identityComparison|decode|total)Ms$/.test(k)||typeof v!=='number'||!Number.isFinite(v)||v<0))fail('RESEARCH_EVIDENCE_REJECTED');
  // Whitelist: embeddings/media, unexpected authority fields and exception text never persist.
  return {researchOnly:true,verified:false,enrolled:false,proof:null,sessionId:session.id,purpose:session.purpose,orderId:session.order_id,identityDecision:r.identityDecision,identityScore:r.identityScore,
    padDecision:'NOT_EVALUATED',padRealScore:r.padRealScore,padSpoofScore:r.padSpoofScore,
    referencePadRealScore:r.referencePadRealScore,referencePadSpoofScore:r.referencePadSpoofScore,
    quality:quality(r.quality),referenceQuality:quality(r.referenceQuality,true),
    modelVersion:r.modelVersion,padModelVersion:r.padModelVersion,cropVersion:r.cropVersion,preprocessingVersion:r.preprocessingVersion,
    policyVersion:r.policyVersion,...Object.fromEntries(['identityErrorCode','padErrorCode','referenceIdentityErrorCode','referencePadErrorCode'].map(k=>[k,typeof r[k]==='string'&&/^[A-Z_]{1,64}$/.test(r[k])?r[k]:null])),errorCode:typeof r.errorCode==='string'&&/^[A-Z_]{1,64}$/.test(r.errorCode)?r.errorCode:null,latencyMs:r.latencyMs};
}
export class ResearchService {
  constructor(db, config) { this.db=db; this.config=config; }
  async assertEnvironment() {
    const u=new URL(this.config.databaseUrl);
    if(u.hostname!=='127.0.0.1'||!u.port||!/^\/fixgo_face_research_[a-f0-9]+$/.test(u.pathname)||!text(this.config.environmentId))throw new Error('RESEARCH_DATABASE_NOT_ISOLATED');
    const rows=await this.db.$queryRaw`SELECT id FROM face_research.environment`;
    if(rows.length!==1||rows[0].id!==this.config.environmentId)throw new Error('RESEARCH_DATABASE_MARKER_MISMATCH');
  }
  nonce(s) {return createHmac('sha256',this.config.nonceKey).update(JSON.stringify([s.id,s.user_id,s.worker_id,s.purpose,s.order_id,new Date(s.expires_at).toISOString()])).digest('base64url');}
  meta(s) {return {id:s.id,purpose:s.purpose,orderId:s.order_id,expiresAt:s.expires_at,nonce:this.nonce(s),state:s.state,researchOnly:true};}
  async worker(tx,userId) {
    const u=await tx.user.findUnique({where:{id:userId},include:{workerProfile:true}});
    if(u?.role!=='WORKER'||u.status!=='ACTIVE'||u.workerProfile?.approvalStatus!=='APPROVED')throw new ForbiddenException('RESEARCH_WORKER_DENIED');
    await tx.$queryRaw`SELECT id FROM worker_profiles WHERE id=${u.workerProfile.id} FOR UPDATE`;
    const fresh=await tx.workerProfile.findUnique({where:{id:u.workerProfile.id},include:{user:true}});
    if(fresh.userId!==userId||fresh.approvalStatus!=='APPROVED'||fresh.user.status!=='ACTIVE'||fresh.user.role!=='WORKER')throw new ForbiddenException('RESEARCH_WORKER_DENIED');
    return fresh;
  }
  async order(tx,w,purpose,orderId) {
    if(purpose!=='ORDER') {if(orderId!==null)fail('RESEARCH_ORDER_SCOPE_INVALID');return;}
    await tx.$queryRaw`SELECT id FROM orders WHERE id=${orderId} FOR UPDATE`;
    const o=await tx.order.findUnique({where:{id:orderId}});
    if(o?.workerId!==w.id)throw new ForbiddenException('RESEARCH_ORDER_DENIED');
    if(o.status!=='ARRIVED')fail('RESEARCH_ORDER_STAGE_INVALID');
  }
  async ai(path,body) {
    const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),this.config.timeoutMs??10000);
    try {
      const r=await fetch(this.config.aiUrl+path,{method:body?'POST':'GET',signal:controller.signal,headers:{'content-type':'application/json','x-face-research-token':this.config.aiToken},...(body?{body:JSON.stringify(body)}:{})});
      // Stream a bounded response, keeping the abort timer active through body consumption.
      let raw=''; for await (const chunk of r.body) {raw+=Buffer.from(chunk).toString();if(raw.length>32768)throw new Error();}
      if(!r.ok)throw new Error();return JSON.parse(raw);
    } catch(e) {if(controller.signal.aborted)throw new GatewayTimeoutException('RESEARCH_AI_TIMEOUT');throw new ServiceUnavailableException('RESEARCH_AI_UNAVAILABLE');}
    finally {clearTimeout(timer);}
  }
  async participant(tx,userId,workerId) {
    const p=this.config.participants?.[userId];
    if(!p?.consentReference||!p?.reviewId||!p?.consentVersion||!(new Date(p.expiresAt)>new Date()))throw new ForbiddenException('RESEARCH_CONSENT_REQUIRED');
    const review=await tx.biometricReview.findUnique({where:{id:p.reviewId}}),state=await tx.biometricState.findUnique({where:{workerId}});
    if(!review||review.workerId!==workerId||review.revokedAt||review.expiresAt<=new Date()||review.epoch!==state?.epoch||state.withdrawnAt||!state.consentedAt||state.consentVersion!==p.consentVersion)throw new ForbiddenException('RESEARCH_REVIEW_REQUIRED');
  }
  async capabilities(userId) {
    const w=await this.db.$transaction(tx=>this.worker(tx,userId));
    let consentReady=false;
    if(this.config.captureApproved&&this.config.protocolReference){try{await this.db.$transaction(tx=>this.participant(tx,userId,w.id));consentReady=true;}catch(_){}}
    const caps=await this.ai('/research/capabilities');
    return {researchOnly:true,cameraAllowed:consentReady&&caps.captureAllowed===true,
      protocolReference:this.config.protocolReference??null,proofAllowed:false,padEvaluated:false,syntheticAvailable:true,
      modelVersion:caps.modelVersion,padReady:caps.padReady===true};
  }
  async create(userId,{purpose,orderId=null,requestKey}) {
    if(!['ENROLLMENT','DAILY','ORDER'].includes(purpose)||!text(requestKey)||(purpose==='ORDER'&&!text(orderId)))fail('RESEARCH_SESSION_INPUT_INVALID');
    const caps=await this.ai('/research/capabilities');
    if(!/^yunet-sface:[a-f0-9]{64}:[a-f0-9]{64}$/.test(caps.modelVersion??'')||!caps.padReady)throw new ServiceUnavailableException('RESEARCH_MODEL_NOT_READY');
    return this.db.$transaction(async tx=>{
      const w=await this.worker(tx,userId); await this.order(tx,w,purpose,orderId);
      const now=(await tx.$queryRaw`SELECT clock_timestamp() AS now`)[0].now;
      const [old]=await tx.$queryRaw`SELECT * FROM face_research.sessions WHERE worker_id=${w.id} AND request_key=${requestKey}`;
      if(old){if(old.purpose!==purpose||old.order_id!==orderId)throw new ConflictException('RESEARCH_IDEMPOTENCY_CONFLICT');if(old.expires_at<=now||old.state==='REVOKED')fail('RESEARCH_SESSION_EXPIRED');return this.meta(old);}
      const [count]=await tx.$queryRaw`SELECT count(*)::int AS n FROM face_research.sessions WHERE worker_id=${w.id} AND created_at > ${new Date(+now-900000)}`;
      if(count.n>=5)fail('RESEARCH_RATE_LIMITED');
      const s={id:randomUUID(),user_id:userId,worker_id:w.id,purpose,order_id:orderId,expires_at:new Date(+now+(this.config.sessionMs??120000)),state:'PENDING'};
      await tx.$executeRaw`INSERT INTO face_research.sessions(id,user_id,worker_id,purpose,order_id,request_key,nonce_hash,model_version,pad_version,expires_at) VALUES(${s.id},${userId},${w.id},${purpose},${orderId},${requestKey},${hash(this.nonce(s))},${caps.modelVersion},${PAD_VERSION},${s.expires_at})`;
      return this.meta(s);
    });
  }
  async access(tx,userId,id,nonce) {
    const w=await this.worker(tx,userId);
    const [s]=await tx.$queryRaw`SELECT * FROM face_research.sessions WHERE id=${id} FOR UPDATE`;
    if(!s||s.user_id!==userId||s.worker_id!==w.id)throw new ForbiddenException('RESEARCH_SESSION_DENIED');
    const now=(await tx.$queryRaw`SELECT clock_timestamp() AS now`)[0].now;
    if(s.expires_at<=now||s.state==='REVOKED')fail('RESEARCH_SESSION_EXPIRED');
    if(!text(nonce)||!timingSafeEqual(Buffer.from(hash(nonce)),Buffer.from(s.nonce_hash)))fail('RESEARCH_NONCE_INVALID');
    await this.order(tx,w,s.purpose,s.order_id);return s;
  }
  async authorizeCapture(userId,id,nonce) {
    if(!this.config.captureApproved||!this.config.protocolReference)throw new ForbiddenException('RESEARCH_CAPTURE_NOT_APPROVED');
    return this.db.$transaction(async tx=>{
      const s=await this.access(tx,userId,id,nonce);
      await this.participant(tx,userId,s.worker_id);
      return s;
    });
  }
  async submit(userId,id,{nonce,synthetic=false,photo,referencePhoto}) {
    if(synthetic!==true){await this.authorizeCapture(userId,id,nonce);if(typeof photo!=='string'||photo.length>6990600||!/^data:image\/(jpeg|png);base64,/.test(photo)||(referencePhoto!=null&&(typeof referencePhoto!=='string'||referencePhoto.length>6990600||!/^data:image\/(jpeg|png);base64,/.test(referencePhoto))))fail('RESEARCH_INLINE_CAPTURE_REQUIRED');}
    else if(photo!==undefined||referencePhoto!==undefined)fail('RESEARCH_SYNTHETIC_PAYLOAD_FORBIDDEN');
    const digest=hash(JSON.stringify([synthetic,photo??null,referencePhoto??null])), claim=randomUUID();
    const claimed=await this.db.$transaction(async tx=>{
      const s=await this.access(tx,userId,id,nonce);
      if(s.state==='DONE'){if(s.capture_digest!==digest)throw new ConflictException('RESEARCH_REPLAY_CHANGED');return {done:s.result};}
      if(s.state!=='PENDING')throw new ConflictException('RESEARCH_SESSION_BUSY');
      if(s.attempts>=3)fail('RESEARCH_ATTEMPTS_EXHAUSTED');
      const [budget]=await tx.$queryRaw`SELECT COALESCE(sum(attempts),0)::int AS n FROM face_research.sessions WHERE worker_id=${s.worker_id} AND created_at > clock_timestamp()-interval '15 minutes'`;
      if(budget.n>=5)fail('RESEARCH_RATE_LIMITED');
      if(synthetic!==true&&s.purpose!=='ENROLLMENT'&&!referencePhoto)fail('RESEARCH_REFERENCE_CAPTURE_REQUIRED');
      await tx.$executeRaw`UPDATE face_research.sessions SET state='PROCESSING',attempts=attempts+1,claim_id=${claim},capture_digest=${digest} WHERE id=${id}`;
      return {s};
    });
    if(claimed.done)return claimed.done;
    try {
      const r=await this.ai('/research/infer',{sessionId:id,workerId:claimed.s.worker_id,...(synthetic===true?{synthetic:true}:{photo,...(referencePhoto?{referencePhoto}:{})})});
      const result=validateMeasurement(r,claimed.s);
      return await this.db.$transaction(async tx=>{
        const s=await this.access(tx,userId,id,nonce);
        if(synthetic!==true)await this.participant(tx,userId,s.worker_id);
        if(s.state!=='PROCESSING'||s.claim_id!==claim)throw new ConflictException('RESEARCH_CLAIM_LOST');
        await tx.$executeRaw`UPDATE face_research.sessions SET state='DONE',result=${JSON.stringify(result)}::jsonb,claim_id=NULL WHERE id=${id}`;
        return result;
      });
    } catch(error) {
      await this.db.$executeRaw`UPDATE face_research.sessions SET state='PENDING',claim_id=NULL WHERE id=${id} AND claim_id=${claim} AND state='PROCESSING'`;
      throw error;
    }
  }
  async erase(userId) {
    return this.db.$transaction(async tx=>{const w=await this.worker(tx,userId);const count=await tx.$executeRaw`DELETE FROM face_research.sessions WHERE worker_id=${w.id}`;return {researchOnly:true,sessionsDeleted:count,mediaStored:false,templatesStored:false};});
  }
}
