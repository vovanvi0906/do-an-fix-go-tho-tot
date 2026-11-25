import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Transform, pipeline } from 'node:stream';
import { PayloadTooLargeException, BadRequestException } from '@nestjs/common';
const number = (key, fallback, max) => Math.max(1, Math.min(max, Number.parseInt(process.env[key], 10) || fallback));
export const datasetLimits = () => ({ maxImages: number('AI01_IMPORT_MAX_IMAGES', 200, 500), maxUploadBytes: number('AI01_IMPORT_MAX_UPLOAD_MB', 64, 256) * 1024 ** 2, maxExpandedBytes: number('AI01_IMPORT_MAX_EXPANDED_MB', 256, 1024) * 1024 ** 2, maxImageBytes: number('AI01_IMPORT_MAX_IMAGE_MB', 10, 10) * 1024 ** 2, maxEntries: 2000, maxRatio: 100 });
// Bound TOTAL streamed multipart bytes, rather than buffering N large files in memory.
export const datasetStorage = {
  _handleFile(req, file, done) {
    const filename = path.join(os.tmpdir(), 'fixgo-ai01-dataset-' + randomUUID());
    let size = 0;
    const meter = new Transform({ transform(chunk, _enc, next) {
      size += chunk.length; req.ai01DatasetBytes = (req.ai01DatasetBytes || 0) + chunk.length;
      next(req.ai01DatasetBytes > datasetLimits().maxUploadBytes ? new PayloadTooLargeException('Tổng dung lượng dataset vượt giới hạn.') : null, chunk);
    } });
    pipeline(file.stream, meter, fs.createWriteStream(filename, { flags: 'wx', mode: 0o600 }), error => {
      if (error) fs.unlink(filename, () => done(error)); else done(null, { path: filename, size });
    });
  },
  _removeFile(_req, file, done) { fs.unlink(file.path, done); },
};
export const datasetFileFilter = (_req, file, cb) => cb(/\.(zip|jpe?g|png|webp)$/i.test(file.originalname) ? null : new BadRequestException('Chỉ nhận ZIP hoặc ảnh JPG/PNG/WebP.'), true);
