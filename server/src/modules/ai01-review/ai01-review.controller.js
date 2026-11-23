import { Ai01AuthConfigurationGuard } from './ai01-auth-configuration.guard';
import { Controller, Get, Post, Req, Res, Param, Query, Body, Bind, UseGuards, Dependencies } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Ai01ReviewService } from './ai01-review.service';
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
