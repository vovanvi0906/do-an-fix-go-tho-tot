import { Injectable, Dependencies, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

// Capability status only. No pending request or template is fabricated/persisted.
@Injectable()
@Dependencies(PrismaService)
export class FaceIdentityService {
  constructor(prisma) { this.prisma = prisma; }

  async status(userId) {
    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId },
      include: { user: { select: { role: true, status: true } }, faceProfile: { select: { id: true } } },
    });
    if (!worker) throw new NotFoundException('WORKER_NOT_FOUND');
    if (worker.user?.role !== 'WORKER' || worker.user?.status !== 'ACTIVE') {
      throw new ForbiddenException('ACTIVE_WORKER_REQUIRED');
    }
    const blockers = [
      ...(worker.approvalStatus === 'APPROVED' ? [] : ['WORKER_APPROVAL_REQUIRED']),
      'IDENTITY_EVIDENCE_REVIEW_REQUIRED', 'PAD_NOT_EVALUATED',
      'TEMPLATE_STORAGE_POLICY_REQUIRED', 'DURABLE_PROOF_STORAGE_REQUIRED',
    ];
    return {
      enrollmentStatus: worker.faceProfile ? 'LEGACY_UNTRUSTED' : 'PENDING_REVIEW',
      reviewRequestSubmitted: false,
      canEnroll: false, canVerifyDaily: false, canVerifyOrder: false,
      canRequestReset: false,
      templateVersion: null, padDecision: 'NOT_EVALUATED',
      dailyProof: null, orderProof: null, blockers,
      message: 'Đăng ký khuôn mặt đang chờ quy trình duyệt danh tính, PAD và lưu trữ an toàn. Chưa gửi yêu cầu duyệt.',
    };
  }

  async preflight(userId, body, reset = false) {
    if (!body || body.consent !== true || Object.keys(body).some(k => k !== 'consent')) {
      throw new BadRequestException('EXPLICIT_CONSENT_REQUIRED_NO_BIOMETRIC_INPUT');
    }
    const status = await this.status(userId);
    return { ...status, action: reset ? 'RESET' : 'ENROLLMENT', accepted: false,
      errorCode: reset ? 'RESET_REVIEW_WORKFLOW_UNAVAILABLE' : 'ENROLLMENT_POLICY_UNAVAILABLE' };
  }
}
