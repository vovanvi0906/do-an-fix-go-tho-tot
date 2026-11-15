import { Injectable, Dependencies, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { createHash } from 'crypto';
import { cloudinary } from '../../config/cloudinary.config';
import { FaceCoreService } from '../workers/face/face-core.service';
import { validateDiagnosisImage, mapDiagnosisUploadError } from './diagnosis/diagnosis-upload.interceptor';

// Cloudinary is the existing image storage provider. No biometric evidence is issued here.
@Injectable()
@Dependencies(FaceCoreService)
export class OrderBeforeMediaService {
  constructor(core) { this.core = core; }

  async authorize(userId, orderId, action) {
    return this.core.workerTx(userId, async (tx, worker) => {
      await this.core.requireOrderProof(tx, worker.id, orderId);
      const arrival = await tx.orderStatusHistory.findFirst({
        where: { orderId, status: 'ARRIVED' }, orderBy: { createdAt: 'asc' },
      });
      if (!arrival) throw new BadRequestException('ARRIVAL_HISTORY_REQUIRED');
      const context = { workerId: worker.id, orderId, arrivalId: arrival.id };
      return action ? action(tx, context) : context;
    });
  }

  prefix({ workerId, orderId, arrivalId }) {
    return `fixgo/order-before/${workerId}/${orderId}/${arrivalId}/`;
  }

  configured() {
    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key || !config.api_secret)
      throw new ServiceUnavailableException('STORAGE_NOT_CONFIGURED');
    return config.cloud_name;
  }

  publicId(url, context) {
    const cloud = this.configured();
    let parsed;
    try { parsed = new URL(url); } catch (_) { throw new BadRequestException('INVALID_PHOTO_URL'); }
    const root = `/${cloud}/image/upload/`;
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'res.cloudinary.com' ||
        parsed.port || parsed.username || parsed.password || parsed.search || parsed.hash ||
        !parsed.pathname.startsWith(root)) throw new BadRequestException('BEFORE_MEDIA_NOT_VERIFIED');
    const match = /^v\d+\/(.+)\.(jpg|jpeg|png)$/.exec(parsed.pathname.slice(root.length));
    const prefix = this.prefix(context);
    if (!match || !match[1].startsWith(prefix) || !/^[a-f0-9]{64}$/.test(match[1].slice(prefix.length)))
      throw new BadRequestException('BEFORE_MEDIA_NOT_VERIFIED');
    return match[1];
  }

  async verify(url, context) {
    const id = this.publicId(url, context);
    let asset;
    try { asset = await cloudinary.api.resource(id, { resource_type: 'image', type: 'upload', timeout: 15000 }); }
    catch (error) {
      if (error?.http_code === 404) throw new BadRequestException('BEFORE_MEDIA_NOT_VERIFIED');
      throw mapDiagnosisUploadError(error);
    }
    if (asset?.public_id !== id || asset.resource_type !== 'image' || asset.type !== 'upload' ||
        asset.secure_url !== url || !Number.isFinite(asset.bytes) || asset.bytes <= 0)
      throw new BadRequestException('BEFORE_MEDIA_NOT_VERIFIED');
    return url;
  }

  async upload(userId, orderId, file) {
    if (!file?.buffer || !file.buffer.length || file.buffer.length > 5 * 1024 * 1024 ||
        !['image/jpeg', 'image/png'].includes(file.mimetype))
      throw new BadRequestException('JPEG_OR_PNG_REQUIRED');
    validateDiagnosisImage(file.buffer, file.mimetype);
    const context = await this.authorize(userId, orderId);
    this.configured();
    const digest = createHash('sha256').update(file.buffer).digest('hex');
    const id = this.prefix(context) + digest;
    let asset;
    try {
      asset = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ public_id: id,
          resource_type: 'image', overwrite: false, unique_filename: false,
          allowed_formats: ['jpg', 'jpeg', 'png'], timeout: 15000 },
        (error, result) => error ? reject(error) : resolve(result));
        stream.on('error', reject);
        stream.end(file.buffer);
      });
    } catch (error) { throw mapDiagnosisUploadError(error); }
    if (asset?.public_id !== id) throw new BadRequestException('BEFORE_MEDIA_NOT_VERIFIED');
    await this.verify(asset.secure_url, context);
    // Storage is outside the DB transaction. Revoke/expiry/assignment races must not grant a URL ACK.
    await this.authorize(userId, orderId, async (_tx, fresh) => {
      if (this.prefix(fresh) !== this.prefix(context)) throw new BadRequestException('BEFORE_MEDIA_NOT_VERIFIED');
    });
    return { url: asset.secure_url };
  }
}
