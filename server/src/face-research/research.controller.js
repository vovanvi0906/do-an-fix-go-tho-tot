import { Controller,Get,Post,Delete,Body,Req,Param,Bind,UseGuards,UseInterceptors,UploadedFiles,BadRequestException,UnauthorizedException,Dependencies } from '@nestjs/common';
import { ApiTags,ApiBearerAuth,ApiOperation,ApiBody,ApiConsumes,ApiResponse,ApiHeader } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { JwtService } from '@nestjs/jwt';
import { ResearchService } from './research.service';
import { ResearchSessionDto, ResearchSyntheticDto } from './research.dto';
const bodyAs=(type,body)=>{if(!body||typeof body!=='object'||validateSync(plainToInstance(type,body),{whitelist:true,forbidNonWhitelisted:true}).length)throw new BadRequestException('RESEARCH_INPUT_INVALID');return body;};
@Dependencies(ResearchService)
export class ResearchAuthGuard {
  constructor(service){this.service=service;}
  canActivate(context){
    const req=context.switchToHttp().getRequest();
    try {
      const header=req.headers.authorization;
      if(!header?.startsWith('Bearer '))throw new Error();
      const p=new JwtService().verify(header.slice(7),{secret:this.service.config.jwtKey,algorithms:['HS256'],audience:'fixgo-face-research',issuer:this.service.config.environmentId});
      if(typeof p.sub!=='string'||p.role!=='WORKER'||!Number.isInteger(p.exp))throw new Error();
      req.researchUserId=p.sub;return true;
    }catch(_){throw new UnauthorizedException('RESEARCH_AUTH_REQUIRED');}
  }
}
@Dependencies(ResearchService)
export class ResearchCaptureGuard {
  constructor(service){this.service=service;}
  async canActivate(context){const r=context.switchToHttp().getRequest();await this.service.authorizeCapture(r.researchUserId,r.params.id,r.headers['x-research-nonce']);return true;}
}
@ApiTags('isolated-face-research') @ApiBearerAuth()
@Controller('face-research') @UseGuards(ResearchAuthGuard) @Dependencies(ResearchService)
export class ResearchController {
  constructor(service){this.service=service;}
  @Get('capabilities') @ApiOperation({summary:'Trạng thái nghiên cứu, không cấp quyền Face ID'}) @ApiResponse({status:200})
  @Bind(Req()) async caps(req){return {success:true,data:await this.service.capabilities(req.researchUserId)};}
  @Post('sessions') @ApiBody({type:ResearchSessionDto}) @ApiOperation({summary:'Tạo phiên nghiên cứu có nonce và TTL'}) @ApiResponse({status:201})
  @Bind(Req(),Body()) async create(req,body){return {success:true,data:await this.service.create(req.researchUserId,bodyAs(ResearchSessionDto,body))};}
  @Post('sessions/:id/synthetic') @ApiBody({type:ResearchSyntheticDto}) @ApiOperation({summary:'Đo ảnh tổng hợp do AI Service tự tạo'}) @ApiResponse({status:201})
  @Bind(Req(),Param('id'),Body()) async synthetic(req,id,body){const dto=bodyAs(ResearchSyntheticDto,body);return {success:true,data:await this.service.submit(req.researchUserId,id,{nonce:dto.nonce,synthetic:true})};}
  @Post('sessions/:id/capture') @UseGuards(ResearchCaptureGuard)
  @UseInterceptors(FileFieldsInterceptor([{name:'image',maxCount:1},{name:'reference',maxCount:1}],{storage:memoryStorage(),limits:{fileSize:5*1024*1024,files:2,fields:0}}))
  @ApiConsumes('multipart/form-data') @ApiHeader({name:'x-research-nonce',required:true}) @ApiBody({schema:{type:'object',properties:{image:{type:'string',format:'binary'},reference:{type:'string',format:'binary'}},required:['image']}}) @ApiOperation({summary:'Camera research: bị chặn trước upload khi chưa duyệt consent/protocol'}) @ApiResponse({status:201})
  @Bind(Req(),Param('id'),UploadedFiles()) async capture(req,id,files){
    const encode=file=>{if(!file?.buffer||!['image/jpeg','image/png'].includes(file.mimetype))throw new BadRequestException('RESEARCH_JPEG_PNG_REQUIRED');return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;};
    return {success:true,data:await this.service.submit(req.researchUserId,id,{nonce:req.headers['x-research-nonce'],photo:encode(files?.image?.[0]),...(files?.reference?.[0]?{referencePhoto:encode(files.reference[0])}:{})})};
  }
  @Delete('sessions') @ApiOperation({summary:'Xóa mọi phiên và số đo nghiên cứu của người đang đăng nhập'}) @ApiResponse({status:200})
  @Bind(Req()) async erase(req){return {success:true,data:await this.service.erase(req.researchUserId)};}
}
