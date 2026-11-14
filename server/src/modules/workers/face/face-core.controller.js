import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiConsumes } from '@nestjs/swagger';
import { FaceReadyGuard } from './face-ready.guard';
import { Controller, Get, Post, Delete, Body, Req, Param, Query, Bind, UseGuards, Dependencies, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { FaceCoreService } from './face-core.service';
import { FaceConsentDto, FaceSessionDto, FaceCaptureDto, FaceReviewDto, FaceUploadDto } from '../dto/face-core.dto';
function bodyAs(type, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || validateSync(plainToInstance(type, value), { whitelist: true, forbidNonWhitelisted: true }).length) throw new BadRequestException('FACE_INPUT_INVALID: Dữ liệu không hợp lệ');
  return value;
}
@ApiTags('worker-face') @ApiBearerAuth()
@Controller('workers/me/face') @UseGuards(JwtAuthGuard, RolesGuard) @Roles('WORKER') @Dependencies(FaceCoreService)
export class FaceCoreController {
  constructor(core) { this.core = core; }
  @Get('capabilities') @ApiOperation({ summary: 'Trạng thái enrollment và proof bền vững' }) @ApiResponse({ status: 200 })
  @Bind(Req(), Query('orderId')) async status(req, orderId) { return { success: true, data: await this.core.status(req.user.userId, orderId) }; }
  @Post('consent') @ApiOperation({ summary: 'Ghi nhận đồng ý sinh trắc học theo phiên bản' }) @ApiBody({ type: FaceConsentDto }) @ApiResponse({ status: 201 })
  @Bind(Req(), Body()) async consent(req, body) { const dto = bodyAs(FaceConsentDto, body); return { success: true, data: await this.core.consent(req.user.userId, dto.version) }; }
  @Post('sessions') @ApiOperation({ summary: 'Tạo session enrollment/daily/order; fail closed khi PAD hoặc dữ liệu chưa được duyệt' }) @ApiBody({ type: FaceSessionDto }) @ApiResponse({ status: 201 })
  @Bind(Req(), Body()) async session(req, body) { return { success: true, data: await this.core.createSession(req.user.userId, bodyAs(FaceSessionDto, body)) }; }
  @Post('sessions/:id/submit') @ApiOperation({ summary: 'Xử lý capture cho session; không tin workerId/reference từ client' }) @ApiBody({ type: FaceCaptureDto }) @ApiResponse({ status: 201 })
  @Bind(Req(), Param('id'), Body()) async submit(req, id, body) { return { success: true, data: await this.core.submit(req.user.userId, id, bodyAs(FaceCaptureDto, body)) }; }
  @Post('sessions/:id/capture') @UseGuards(FaceReadyGuard)
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, fields: 1, files: 1 } }))
  @ApiOperation({ summary: 'Ảnh camera trong bộ nhớ; quyền/session/PAD được kiểm trước khi nhận multipart' })
  @ApiConsumes('multipart/form-data') @ApiBody({ schema: { type: 'object', properties: { nonce: { type: 'string' }, image: { type: 'string', format: 'binary' } }, required: ['nonce','image'] } }) @ApiResponse({ status: 201 })
  @Bind(Req(), Param('id'), Body(), UploadedFile()) async capture(req, id, body, file) {
    const dto = bodyAs(FaceUploadDto, body);
    if (!file?.buffer || !['image/jpeg','image/png'].includes(file.mimetype)) throw new BadRequestException('JPEG_OR_PNG_REQUIRED');
    return { success: true, data: await this.core.submit(req.user.userId, id, { nonce: dto.nonce, photo: `data:${file.mimetype};base64,${file.buffer.toString('base64')}` }) };
  }
  @Delete('template') @ApiOperation({ summary: 'Thu hồi consent, xóa ciphertext và vô hiệu hóa session/proof' }) @ApiResponse({ status: 200 })
  @Bind(Req()) async withdraw(req) { return { success: true, data: await this.core.withdraw(req.user.userId) }; }
}
@ApiTags('admin-worker-face') @ApiBearerAuth()
@Controller('admin/workers') @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN') @Dependencies(FaceCoreService)
export class FaceReviewController {
  constructor(core) { this.core = core; }
  @Post(':id/face/identity-reviews') @ApiOperation({ summary: 'Admin ghi bằng chứng đã kiểm tra danh tính; cấp lại cần review mới' }) @ApiBody({ type: FaceReviewDto }) @ApiResponse({ status: 201 })
  @Bind(Req(), Param('id'), Body()) async review(req, id, body) { return { success: true, data: await this.core.review(req.user.userId, id, bodyAs(FaceReviewDto, body)) }; }
}
