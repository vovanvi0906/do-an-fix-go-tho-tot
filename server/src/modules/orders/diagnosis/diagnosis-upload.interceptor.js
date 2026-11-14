import {
  BadRequestException,
  BadGatewayException,
  GatewayTimeoutException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Readable } from 'node:stream';
import { performance } from 'node:perf_hooks';
import { incidentStorage } from '../../../config/cloudinary.config';

const MAX_BYTES = 10 * 1024 * 1024;
export function validateDiagnosisImage(buffer, mime) {
  const jpeg = buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).equals(
    buffer.subarray(0, 8),
  );
  const webp =
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP';
  if (
    !buffer.length ||
    !(
      (mime === 'image/jpeg' && jpeg) ||
      (mime === 'image/png' && png) ||
      (mime === 'image/webp' && webp)
    )
  )
    throw new BadRequestException({
      code: 'IMAGE_INVALID',
      stage: 'image_validation',
      message: 'Ảnh phải là JPG, PNG hoặc WebP hợp lệ.',
    });
}
export function mapDiagnosisUploadError(error) {
  if (error?.getStatus) return error;
  if (
    error?.code === 'ETIMEDOUT' ||
    error?.http_code === 499 ||
    /timeout|timed out/i.test(error?.message || '')
  )
    return new GatewayTimeoutException({
      code: 'STORAGE_TIMEOUT',
      stage: 'storage_upload',
      message: 'Lưu ảnh quá thời gian cho phép.',
    });
  if (
    error?.http_code === 400 &&
    /unknown file format|invalid (image|png|jpeg|jpg|webp)|unsupported image|invalid format|image file is invalid/i.test(
      error?.message || '',
    )
  )
    return new BadRequestException({
      code: 'IMAGE_INVALID',
      stage: 'image_validation',
      message: 'Không giải mã được nội dung ảnh.',
    });
  return new BadGatewayException({
    code: 'STORAGE_UNAVAILABLE',
    stage: 'storage_upload',
    message: 'Dịch vụ lưu ảnh chưa khả dụng. Vui lòng thử lại.',
  });
}
export class DiagnosisImageStorage {
  constructor(storage = incidentStorage) {
    this.storage = storage;
  }
  _handleFile(req, file, callback) {
    const start = performance.now(),
      chunks = [];
    let bytes = 0,
      finished = false;
    const done = (error, result) => {
      if (finished) return;
      finished = true;
      const mapped = error ? mapDiagnosisUploadError(error) : null;
      const stage = {
        stage: mapped?.getResponse?.().stage || 'storage_upload',
        durationMs: performance.now() - start,
        status: mapped?.getStatus?.() || 200,
        code: mapped?.getResponse?.().code || 'UPLOADED',
        upstreamStatus: error?.http_code || null,
      };
      req.diagnosisStages = [...(req.diagnosisStages || []), stage];
      // No image URLs, buffers, credentials or upstream messages in logs.
      console.log(
        JSON.stringify({
          type: 'diagnosis_upload',
          requestId: req.requestId,
          ...stage,
        }),
      );
      callback(mapped || undefined, result);
    };
    file.stream.on('limit', () =>
      done(
        new PayloadTooLargeException({
          code: 'IMAGE_TOO_LARGE',
          stage: 'image_validation',
          message: 'Ảnh tối đa 10 MB.',
        }),
      ),
    );
    file.stream.on('error', () =>
      done(
        new BadRequestException({
          code: 'IMAGE_READ_FAILED',
          stage: 'image_validation',
          message: 'Không đọc được ảnh.',
        }),
      ),
    );
    file.stream.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes <= MAX_BYTES) chunks.push(chunk);
    });
    file.stream.on('end', () => {
      if (finished) return;
      try {
        const buffer = Buffer.concat(chunks);
        validateDiagnosisImage(buffer, file.mimetype);
        this.storage._handleFile(
          req,
          { ...file, stream: Readable.from(buffer) },
          done,
        );
      } catch (error) {
        done(error);
      }
    });
  }
  _removeFile(req, file, callback) {
    this.storage._removeFile(req, file, callback);
  }
}
export const DiagnosisUploadInterceptor = FileInterceptor('image', {
  storage: new DiagnosisImageStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype))
      return callback(
        new BadRequestException({
          code: 'IMAGE_INVALID',
          stage: 'image_validation',
          message: 'Định dạng ảnh không được hỗ trợ.',
        }),
        false,
      );
    callback(null, true);
  },
});
