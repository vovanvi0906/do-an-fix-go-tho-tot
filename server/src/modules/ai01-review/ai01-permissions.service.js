import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Injectable, Dependencies, ForbiddenException, BadRequestException, ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { readPolicy } from './ai01-policy';
import { GrantAi01PermissionDto, RevokeAi01PermissionDto } from './dto/ai01-permission.dto';
const sha = text => crypto.createHash('sha256').update(text).digest('hex');
const ROLE_MAP = {coordinator:'coordinator',reviewer_a:'annotator_a',reviewer_b:'annotator_b',adjudicator:'adjudicator',viewer:'viewer'};
@Injectable()
@Dependencies(PrismaService)
export class Ai01PermissionsService {
  constructor(prisma) { this.prisma=prisma; this.file=process.env.AI01_REVIEW_POLICY_FILE || path.resolve(__dirname,'../../../config/ai01-review.example.json'); this.state=process.env.AI01_REVIEW_STATE_DIR; }
  manager(user) {
    const id=String(user?.userId||user?.id||'').toLowerCase(),policy=readPolicy(this.file);
    if (user?.role!=='ADMIN') throw new ForbiddenException('AI01_ADMIN_REQUIRED: Cần tài khoản ADMIN active được xác thực tại backend.');
    return {id,policy};
  }
  bindings() {
    const file=this.state&&path.join(this.state,'events.jsonl'),result={};
    if(file&&fs.existsSync(file)) for(const line of fs.readFileSync(file,'utf8').split('\n').filter(Boolean)){const e=JSON.parse(line);if(e.kind==='principal_binding')result[e.data.reviewerId]={role:e.data.role,expert:e.data.expert};}
    return result;
  }
  async list(user, query={}) {
    const {policy}=this.manager(user);const search=String(query.search||'').trim().slice(0,100),page=Math.floor(Math.max(0,Math.min(10000,Number(query.page)||0)));
    const accounts=await this.prisma.user.findMany({where:{status:'ACTIVE',...(search?{OR:[{name:{contains:search,mode:'insensitive'}},{email:{contains:search,mode:'insensitive'}},{id:{contains:search}}]}:{})},select:{id:true,name:true,email:true,role:true,status:true},take:50,skip:page*50,orderBy:{id:'asc'}});
    return {revision:policy.revision,accounts,assignments:[...policy.users].map(([userId,row])=>({userId,...row})),managementMode:'active_admin',bindings:this.bindings(),hasMore:accounts.length===50,notice:'ADMIN active tự có quyền quản lý. Phân công reviewer cho tài khoản active không phải ADMIN; không đổi role DB.'};
  }
  auditRows(file) {
    if(!fs.existsSync(file))return [];
    const rows=fs.readFileSync(file,'utf8').split('\n').filter(Boolean).map(JSON.parse);let previous='0'.repeat(64);
    for(const row of rows){const {eventHash,...entry}=row;if(entry.previousHash!==previous||sha(JSON.stringify(entry))!==eventHash)throw new ServiceUnavailableException('Audit phân quyền không toàn vẹn; dừng để đối chiếu thủ công.');previous=eventHash;}
    return rows;
  }
  async change(user, action, body) {
    const {id}=this.manager(user);const dto=plainToInstance(action==='grant'?GrantAi01PermissionDto:RevokeAi01PermissionDto,body);
    if(validateSync(dto,{whitelist:true,forbidNonWhitelisted:true}).length)throw new BadRequestException('Quyết định phân quyền không hợp lệ; không gửi actor/reviewerId/permissionManagers.');
    dto.targetUserId=dto.targetUserId.toLowerCase();
    if(dto.targetUserId===id)throw new ForbiddenException('Không tự cấp, đổi hoặc thu hồi quyền của chính mình qua API.');
    const target=await this.prisma.user.findUnique({where:{id:dto.targetUserId},select:{id:true,role:true,status:true}});
    if(!target||(action==='grant'&&target.status!=='ACTIVE'))throw new BadRequestException('Cần tài khoản FixGo thật và active để phân công AI.');
    if(action==='grant' && target.role==='ADMIN' && dto.role!=='coordinator') throw new BadRequestException('ADMIN tự có quyền Coordinator; không được gắn Reviewer A/B hoặc hạ quyền qua assignment.');
    if(!this.state)throw new ServiceUnavailableException('Chưa cấu hình vùng audit phân quyền riêng.');
    const location=path.resolve(this.state),pilot=process.env.AI01_PILOT_DIR&&path.resolve(process.env.AI01_PILOT_DIR),raw=pilot&&path.resolve(pilot,'../../01-raw');
    if ([pilot,raw].filter(Boolean).some(root=>location===root||location.startsWith(root+path.sep))) throw new ServiceUnavailableException('Vùng audit quyền phải tách khỏi dữ liệu gốc và review lịch sử.');
    fs.mkdirSync(this.state,{recursive:true,mode:0o700});let lock;
    try { lock=fs.openSync(this.file+'.lock','wx',0o600); }
    catch { throw new ConflictException('Policy đang được thay đổi hoặc cần đối chiếu lock; không ghi đè.'); }
    try {
      const {policy}=this.manager(user);if(dto.expectedRevision!==policy.revision)throw new ConflictException('Policy đã đổi; tải lại trước khi quyết định.');
      const bindings=this.bindings(),binding=bindings[dto.targetUserId];
      if(action==='grant') {
        if(binding&&(binding.role!==ROLE_MAP[dto.role]||binding.expert!==dto.expert))throw new ConflictException('User đã gắn vai trò/chuyên môn với lịch sử pilot; chuyển vai trò cần quy trình được duyệt, không tự đổi.');
        if(['reviewer_a','reviewer_b'].includes(dto.role)&&Object.entries(bindings).some(([uid,b])=>uid!==dto.targetUserId&&b.role===ROLE_MAP[dto.role]))throw new ConflictException('Slot reviewer đã gắn user khác trong lịch sử pilot.');
        if(['reviewer_a','reviewer_b'].includes(dto.role)&&[...policy.users].some(([uid,b])=>uid!==dto.targetUserId&&b.role===dto.role))throw new ConflictException('Reviewer A/B mỗi slot chỉ một user trong pilot.');
      }
      const users=[...policy.users].filter(([uid])=>uid!==dto.targetUserId).map(([userId,row])=>({userId,...row}));if(action==='grant')users.push({userId:dto.targetUserId,role:dto.role,expert:dto.expert});
      const timestamp=new Date().toISOString(),next={...policy.document,users,approval:{approvedBy:id,approvedAt:timestamp,evidence:dto.reason}},text=JSON.stringify(next,null,2)+'\n';
      const auditFile=path.join(this.state,'permission-events.jsonl'),rows=this.auditRows(auditFile);
      if(rows.length&&rows.at(-1).newRevision!==policy.revision)throw new ServiceUnavailableException('Policy và audit lệch revision; cần đối chiếu thủ công trước đổi quyền tiếp.');
      const entry={sequence:rows.length,previousHash:rows.at(-1)?.eventHash||'0'.repeat(64),actorUserId:id,targetUserId:dto.targetUserId,action,role:action==='grant'?dto.role:null,expert:action==='grant'?dto.expert:null,reason:dto.reason,timestamp,oldRevision:policy.revision,newRevision:sha(text)},event={...entry,eventHash:sha(JSON.stringify(entry))};
      const fd=fs.openSync(auditFile,'a',0o600);try{fs.writeSync(fd,JSON.stringify(event)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
      const tmp=this.file+'.tmp-'+crypto.randomUUID();const file=fs.openSync(tmp,'wx',0o600);try{fs.writeSync(file,text);fs.fsyncSync(file);}finally{fs.closeSync(file);}fs.renameSync(tmp,this.file);
      return {revision:event.newRevision,eventHash:event.eventHash,message:action==='grant'?'Đã cấp vai trò AI có audit.':'Đã thu hồi vai trò AI; token Admin cũ không còn truy cập chức năng AI.'};
    } finally {fs.closeSync(lock);fs.unlinkSync(this.file+'.lock');}
  }
}
