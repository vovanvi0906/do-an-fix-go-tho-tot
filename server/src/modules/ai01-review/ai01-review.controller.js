import { datasetStorage, datasetLimits, datasetFileFilter } from './dataset-upload';
import { DatasetOptionsDto } from './dto/dataset-options.dto';
import { Ai01AuthConfigurationGuard } from './ai01-auth-configuration.guard';
import { Controller, Get, Post, Req, Res, Param, Query, Body, Bind, UseGuards, Dependencies, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Ai01ReviewService } from './ai01-review.service';
import { ImportImageDto } from './dto/import-image.dto';
import { ReviewActionDto } from './dto/review-action.dto';
@ApiTags('admin-ai01-review')
@ApiBearerAuth()
@Controller('admin/ai01')
@UseGuards(JwtAuthGuard, Ai01AuthConfigurationGuard)
@Dependencies(Ai01ReviewService)
export class Ai01ReviewController {
  constructor(service) { this.service = service; }
  @Get('access') @ApiOperation({ summary: 'Vai trò AI của authenticated FixGo principal; không tự cấp quyền' })
  @Bind(Req()) access(req) { return { success: true, data: this.service.access(req.user) }; }
  @Get('data/:operation') @ApiOperation({ summary: 'Đọc dữ liệu AI-01 theo quyền; reviewer chỉ thấy bản của mình' })
  @Bind(Req(), Param('operation'), Query()) async read(req, op, query) { return { success: true, data: await this.service.read(req.user, op, query) }; }
  @Post('actions/:operation') @ApiOperation({ summary: 'Quyết định của user FixGo; gọi approval gate TASK 03C' }) @ApiBody({ type: ReviewActionDto })
  @Bind(Req(), Param('operation'), Body()) async mutate(req, op, body) { return { success: true, data: await this.service.mutate(req.user, op, body) }; }
  @Get('dataset/limits') @UseGuards(RolesGuard) @Roles('ADMIN')
  @ApiOperation({summary:'Giới hạn nhập dataset hiện hành'})
  @Bind(Req()) datasetLimits(req) { this.service.principal(req.user,'fast_dataset_limits'); return {success:true,data:datasetLimits()}; }
  @Post('dataset/preview') @UseGuards(RolesGuard) @Roles('ADMIN')
  @ApiOperation({summary:'Kiểm tra ZIP/ảnh và metadata; chỉ staging, chưa nhập vào thư viện'})
  @ApiConsumes('multipart/form-data')
  @ApiBody({schema:{type:'object',properties:{files:{type:'array',items:{type:'string',format:'binary'}},categoryId:{type:'string'},targetId:{type:'string'},sourceType:{type:'string'},sourceReference:{type:'string'},rightsType:{type:'string'},rightsEvidence:{type:'string'},groupKey:{type:'string'},generatorTool:{type:'string'},generatedAt:{type:'string'},prompt:{type:'string'},datasetName:{type:'string'},developmentOnly:{type:'boolean'},classMapping:{type:'string',description:'JSON map class ID → {kind,label}'}}}})
  @ApiResponse({status:201,description:'Bản xem trước theo từng ảnh; chưa xác nhận nhãn'})
  @ApiResponse({status:413,description:'Vượt giới hạn upload, ZIP hoặc số ảnh'})
  @UseInterceptors(FilesInterceptor('files',500,{storage:datasetStorage,limits:{fileSize:datasetLimits().maxUploadBytes,files:500,fields:16,fieldSize:64000,parts:516},fileFilter:datasetFileFilter}))
  @Bind(Req(),UploadedFiles(),Body()) async datasetPreview(req,files,body) { return {success:true,data:await this.service.previewDataset(req.user,files,body)}; }
  @Get('dataset/batches/:batchId') @UseGuards(RolesGuard) @Roles('ADMIN')
  @ApiOperation({summary:'Khôi phục tiến trình nhập dataset của chính Admin'})
  @Bind(Req(),Param('batchId')) async datasetStatus(req,id) { return {success:true,data:await this.service.datasetOperation(req.user,'status',id)}; }
  @Post('dataset/batches/:batchId/validate') @UseGuards(RolesGuard) @Roles('ADMIN')
  @ApiOperation({summary:'Kiểm tra lại class mapping/danh mục trước khi xác nhận nhập'}) @ApiBody({type:DatasetOptionsDto})
  @Bind(Req(),Param('batchId'),Body()) async datasetValidate(req,id,body) { return {success:true,data:await this.service.datasetOperation(req.user,'validate',id,null,body)}; }
  @Post('dataset/batches/:batchId/items/:itemId') @UseGuards(RolesGuard) @Roles('ADMIN')
  @ApiOperation({summary:'Nhập một ảnh đã kiểm tra; gọi tuần tự, idempotent và có thể tiếp tục sau gián đoạn'})
  @Bind(Req(),Param('batchId'),Param('itemId')) async datasetCommit(req,id,item) { return {success:true,data:await this.service.datasetOperation(req.user,'commit',id,item)}; }
  @Post('dataset/images')
  @UseGuards(RolesGuard) @Roles('ADMIN')
  @ApiOperation({summary:'Thêm ảnh phát triển vào vùng dataset riêng; chưa xác nhận nhãn hoặc quyền xuất'})
  @ApiConsumes('multipart/form-data')
  @ApiBody({schema:{type:'object',required:['image','uploadId','categoryId','sourceType','sourceReference','rightsType','rightsEvidence','groupKey','developmentOnly'],properties:{image:{type:'string',format:'binary'},uploadId:{type:'string',format:'uuid'},categoryId:{type:'string',format:'uuid'},targetId:{type:'string'},sourceType:{type:'string',enum:['own_photo','licensed','permission']},sourceReference:{type:'string'},rightsType:{type:'string',enum:['owned','licensed','permission']},rightsEvidence:{type:'string'},groupKey:{type:'string'},developmentOnly:{type:'boolean'}}}})
  @ApiResponse({status:201,description:'Đã nhập hoặc tìm thấy ảnh trùng; ảnh mới còn quarantine'})
  @ApiResponse({status:413,description:'Ảnh tối đa 10 MB'})
  @UseInterceptors(FileInterceptor('image',{storage:memoryStorage(),limits:{fileSize:10*1024*1024,files:1,fields:12,fieldSize:10000,parts:14},fileFilter:(_req,file,cb)=>cb(['image/jpeg','image/png','image/webp'].includes(file.mimetype)?null:new BadRequestException('Chỉ nhận JPG, PNG hoặc WebP.'),true)}))
  @Bind(Req(), UploadedFile(), Body()) async importImage(req,file,body) {
    return {success:true,data:await this.service.importImage(req.user,file,body)};
  }
  @Get('images/:imageId') @ApiOperation({ summary: 'Ảnh pilot có JWT và quyền AI; không trả filesystem path' })
  @Bind(Req(), Param('imageId'), Res()) async image(req, imageId, res) { return this.send(res, await this.service.binary(req.user, 'image', { imageId })); }
  @Get('images/:imageId/related/:memberId') @ApiOperation({ summary: 'Ảnh family chỉ cho điều phối/phân xử' })
  @Bind(Req(), Param('imageId'), Param('memberId'), Res()) async relatedImage(req, imageId, memberId, res) { return this.send(res, await this.service.binary(req.user, 'related_image', { imageId, memberId })); }
  @Get('exports/:file') @ApiOperation({ summary: 'Tải approved artifact đã kiểm hash, chỉ Coordinator' })
  @Bind(Req(), Param('file'), Res()) async download(req, file, res) { return this.send(res, await this.service.binary(req.user, 'download', { file })); }
  @Get('solo/images/:imageId') @ApiOperation({ summary: 'Ảnh chế độ một người; chỉ Admin active' })
  @Bind(Req(), Param('imageId'), Res()) async soloImage(req, imageId, res) { return this.send(res, await this.service.binary(req.user, 'solo_image', { imageId })); }
  @Get('solo/images/:imageId/related/:memberId')
  @Bind(Req(), Param('imageId'), Param('memberId'), Res()) async soloRelated(req, imageId, memberId, res) { return this.send(res, await this.service.binary(req.user, 'solo_related_image', { imageId, memberId })); }
  @Get('solo/exports/:file') @ApiOperation({ summary: 'Bản xuất solo-development; không phải GT độc lập' })
  @Bind(Req(), Param('file'), Res()) async soloDownload(req, file, res) { return this.send(res, await this.service.binary(req.user, 'solo_download', { file })); }
  @Get('fast/images/:imageId') @ApiOperation({ summary: 'Ảnh gán nhãn nhanh phát triển; chỉ Admin active' })
  @Bind(Req(), Param('imageId'), Res()) async fastImage(req, imageId, res) { return this.send(res, await this.service.binary(req.user, 'fast_image', { imageId })); }
  @Get('fast/exports/:file') @ApiOperation({ summary: 'Tải solo-development đã kiểm hash và audit; chỉ Admin chủ bản xuất' })
  @Bind(Req(), Param('file'), Res()) async fastDownload(req, file, res) { return this.send(res, await this.service.binary(req.user, 'fast_download', { file })); }
  @Get('fast/quality/images/:imageId') @ApiOperation({ summary: 'Ảnh bản sao quality cho Admin sửa bbox; không sửa raw' })
  @Bind(Req(), Param('imageId'), Res()) async qualityImage(req, imageId, res) { return this.send(res, await this.service.binary(req.user, 'fast_quality_image', { imageId })); }
  send(res, output) {
    res.setHeader('Content-Type', output.contentType); res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
    if (output.filename) res.setHeader('Content-Disposition', `attachment; filename="${output.filename}"`);
    return res.send(Buffer.from(output.binary, 'base64'));
  }
}
