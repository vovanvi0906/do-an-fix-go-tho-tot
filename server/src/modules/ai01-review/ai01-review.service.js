import path from 'node:path';
import { Injectable, Dependencies, BadRequestException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { readPolicy, principalFor, requireOperation, soloPrincipalFor } from './ai01-policy';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { LabelBrowserQueryDto } from './dto/label-browser-query.dto';
import { ReviewEngine } from './review-engine';
import { ReviewActionDto } from './dto/review-action.dto';
const SERVER = path.resolve(__dirname, '../../..');
const MUTATIONS = new Set(['mapping', 'annotate', 'adjudicate', 'save_provenance', 'export', 'solo_mapping', 'solo_annotate', 'solo_confirm', 'solo_save_provenance', 'solo_export', 'fast_save', 'fast_check', 'fast_export', 'fast_quality_save', 'fast_quality_export']);
const READS = new Set(['overview', 'items', 'catalog', 'mappings', 'adjudication', 'provenance', 'related', 'readiness', 'history', 'solo_catalog', 'solo_items', 'solo_mappings', 'solo_detail', 'solo_related', 'solo_readiness', 'fast_catalog', 'fast_items', 'fast_label_options', 'fast_label_items', 'fast_label_queue', 'fast_detail', 'fast_mappings', 'fast_readiness', 'fast_preparation', 'fast_quality_overview', 'fast_quality_detail', 'management_status']);
function rejectIdentity(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (['reviewerId', 'userId', 'role', 'principal', 'authenticatedPrincipal', 'expert'].includes(key)) throw new BadRequestException('Không gửi reviewerId/role/danh tính; server lấy từ tài khoản FixGo.');
    rejectIdentity(item);
  }
}
@Injectable()
@Dependencies(PrismaService)
export class Ai01ReviewService {
  constructor(prisma) {
    this.prisma = prisma;
    this.config = { enabled: process.env.AI01_REVIEW_ENABLED === 'true', policyFile: process.env.AI01_REVIEW_POLICY_FILE || path.join(SERVER, 'config/ai01-review.example.json'), python: process.env.AI01_REVIEW_PYTHON || path.resolve(SERVER, '../ai-service/.venv/bin/python'), script: path.join(SERVER, 'scripts/ai01/review_bridge.py'), pilotDir: process.env.AI01_PILOT_DIR, stateDir: process.env.AI01_REVIEW_STATE_DIR };
    this.engine = new ReviewEngine(this.config);
  }
  onModuleDestroy() { this.engine.close(); }
  access(user) {
    const id = String(user.userId || user.id).toLowerCase(), admin = user.role === 'ADMIN';
    if (admin) {
      const principal = soloPrincipalFor(user);
      return { enabled: this.config.enabled, assigned: true, canManagePermissions: true, canUseSolo: true,
        userId: id, role: principal.role, expert: false, mode: 'SOLO_THESIS',
        message: this.config.enabled ? 'ACTIVE / ADMIN có toàn quyền quản lý AI trong chế độ SOLO.' : 'Module AI-01 chưa được bật trên backend.' };
    }
    const policy = readPolicy(this.config.policyFile), assignment = policy.users.get(id);
    const principal = assignment ? principalFor(user, policy) : null;
    return { enabled: this.config.enabled, assigned: Boolean(principal), canManagePermissions: false, canUseSolo: false,
      userId: id, role: principal?.role || null, expert: principal?.expert || false,
      message: !assignment ? 'Tài khoản chưa được phân công AI.' : 'Vai trò AI được xác minh tại backend.' };
  }

  principal(user, operation) {
    if (!this.config.enabled || !this.config.pilotDir || !this.config.stateDir) throw new ServiceUnavailableException('AI01_SETUP_REQUIRED: Module/dataset/state chưa được cấu hình.');
    if (operation.startsWith('solo_') || operation.startsWith('fast_') || operation === 'management_status') {
      if (user.role !== 'ADMIN') throw new ForbiddenException('Gán nhãn phát triển một người chỉ dành cho ADMIN active.');
      return soloPrincipalFor(user);
    }
    const principal = principalFor(user, readPolicy(this.config.policyFile)); requireOperation(principal, operation); return principal;
  }
  async read(user, operation, query = {}) {
    if (!READS.has(operation)) throw new BadRequestException('Không có thao tác đọc này.');
    const principal = this.principal(user, operation);
    if (operation === 'management_status') return {
      mode: 'SOLO_THESIS',
      labeling: { supported: true, source: 'TASK03B + FastReview', exportType: 'solo-development' },
      training: { supported: false, status: 'not_integrated', cliSource: 'server/scripts/ai01/train_prepared.py',
        reason: 'Đã có pipeline CLI kiểm dataset và cấu hình thử nghiệm nguồn riêng. Admin Web chưa có job API training/fine-tuning; trang này không khởi chạy training.' },
      evaluation: { supported: false, status: 'not_integrated', cliSource: 'ai-service/eval/ai01/runner.py',
        reason: 'Có protocol/runner/metrics CLI; chưa có API quản lý tập test độc lập hoặc kho kết quả model đã xác minh.',
        precision: null, recall: null, f1: null, officialRuns: [] },
      deployment: { supported: false, status: 'not_integrated',
        reason: 'Chưa có model registry, API thử inference cách ly, activation hoặc rollback. Production model được giữ nguyên.' },
    };
    if (operation.startsWith('fast_label_')) {
      const dto = plainToInstance(LabelBrowserQueryDto, query);
      if (validateSync(dto, {whitelist:true, forbidNonWhitelisted:true}).length) throw new BadRequestException('Bộ lọc hoặc phân trang không hợp lệ.');
      let categories, targets;
      try {
        [categories, targets] = await Promise.all([
          this.prisma.serviceCategory.findMany({where:{isActive:true},select:{id:true,name:true,isActive:true},orderBy:{name:'asc'}}),
          this.prisma.serviceTarget.findMany({where:{isActive:true,category:{isActive:true}},select:{id:true,name:true,categoryId:true,isActive:true},orderBy:{name:'asc'}}),
        ]);
      } catch { throw new ServiceUnavailableException('Chưa đọc được taxonomy FixGo từ database. Hãy thử lại.'); }
      return this.engine.call(principal, operation, {...dto, catalog:{categories,targets}});
    }
    const payload = {};
    if (['adjudication', 'provenance', 'related', 'solo_detail', 'solo_related', 'fast_detail', 'fast_quality_detail'].includes(operation)) { if (!/^img-\d{5}$/.test(query.imageId || '')) throw new BadRequestException('ID ảnh không hợp lệ.'); payload.imageId = query.imageId; }
    return this.engine.call(principal, operation, payload);
  }
  async mutate(user, operation, body) {
    if (!MUTATIONS.has(operation)) throw new BadRequestException('Không có thao tác ghi này.');
    const principal = this.principal(user, operation);
    const dto = plainToInstance(ReviewActionDto, body);
    if (validateSync(dto, { whitelist: true, forbidNonWhitelisted: true }).length) throw new BadRequestException('Chỉ chấp nhận payload quyết định review hợp lệ.');
    rejectIdentity(dto.payload);
    if (Buffer.byteLength(JSON.stringify(dto.payload)) > 128000) throw new BadRequestException('Nội dung review quá lớn.');
    return this.engine.call(principal, operation, dto.payload);
  }
  async binary(user, operation, payload) {
    const principal = this.principal(user, operation);
    if (['image', 'related_image', 'solo_image', 'solo_related_image', 'fast_image', 'fast_quality_image'].includes(operation)) {
      if (!/^img-\d{5}$/.test(payload.imageId || '')) throw new BadRequestException('ID ảnh không hợp lệ.');
      if (['related_image', 'solo_related_image'].includes(operation) && !/^\d{1,6}$/.test(payload.memberId || '')) throw new BadRequestException('ID ảnh liên quan không hợp lệ.');
    } else if (['solo_download', 'fast_download'].includes(operation)) {
      if (!/^solo-development-[0-9TZ]+\.jsonl$/.test(payload.file || '')) throw new BadRequestException('Bản xuất một người không hợp lệ.');
    } else if (operation !== 'download' || !/^approved-development-[0-9TZ]+\.jsonl$/.test(payload.file || '')) throw new BadRequestException('Artifact không hợp lệ.');
    return this.engine.call(principal, operation, payload);
  }
}
