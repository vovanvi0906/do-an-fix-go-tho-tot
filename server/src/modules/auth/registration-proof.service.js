import { Injectable, Dependencies, BadRequestException, ConflictException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { EsmsService } from './esms.service';

const PURPOSE = 'customer-registration';
const TTL_SECONDS = 300;
const digest = (token) => createHash('sha256').update(token).digest('hex');

@Injectable()
@Dependencies(PrismaService, EsmsService)
export class RegistrationProofService {
  constructor(prisma, esmsService) {
    this.prisma = prisma;
    this.esmsService = esmsService;
  }

  invalidProof() {
    return new BadRequestException({
      code: 'REGISTRATION_PROOF_INVALID',
      message:
        'Bằng chứng xác thực không hợp lệ, hết hạn hoặc đã sử dụng. Vui lòng xác thực OTP lại.',
    });
  }

  normalizePhone(phone) {
    if (typeof phone !== 'string' || !/^\+?[0-9 -]{9,16}$/.test(phone)) {
      throw this.invalidProof();
    }
    const normalized = this.esmsService.normalizePhone(phone);
    if (!/^0[35789][0-9]{8}$/.test(normalized)) throw this.invalidProof();
    return normalized;
  }

  async issue(phone) {
    const registrationProof = randomBytes(32).toString('hex');
    const tokenHash = digest(registrationProof);
    const normalizedPhone = this.normalizePhone(phone);
    await this.prisma.$executeRaw`
      INSERT INTO "registration_proofs" ("tokenHash", "phone", "purpose", "expiresAt")
      VALUES (${tokenHash}, ${normalizedPhone}, ${PURPOSE},
        clock_timestamp() + ${TTL_SECONDS} * interval '1 second')
    `;
    return { registrationProof, registrationProofExpiresIn: TTL_SECONDS };
  }

  async createCustomer(data, proof) {
    if (typeof proof !== 'string' || !/^[a-f0-9]{64}$/.test(proof)) {
      throw this.invalidProof();
    }
    const phone = this.normalizePhone(data.phone);
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Conditional UPDATE locks the row. A competing transaction rechecks
        // consumedAt after waiting; rollback also restores the unused proof.
        const tokenHash = digest(proof);
        const consumed = await tx.$executeRaw`
          UPDATE "registration_proofs"
          SET "consumedAt" = clock_timestamp()
          WHERE "tokenHash" = ${tokenHash} AND "phone" = ${phone}
            AND "purpose" = ${PURPOSE} AND "consumedAt" IS NULL
            AND "expiresAt" > clock_timestamp()
        `;
        if (consumed !== 1) throw this.invalidProof();
        return tx.user.create({
          data: { ...data, phone, role: 'CUSTOMER' },
          include: { customerProfile: true, workerProfile: true },
        });
      });
    } catch (error) {
      if (error.code === 'P2002') {
        const targets = Array.isArray(error.meta?.target) ? error.meta.target : [];
        const field = targets.includes('phone') ? 'phone' : targets.includes('email') ? 'email' : null;
        throw new ConflictException({
          code: field === 'phone' ? 'REGISTRATION_PHONE_CONFLICT' : field === 'email' ? 'REGISTRATION_EMAIL_CONFLICT' : 'REGISTRATION_CONFLICT',
          message: field === 'phone' ? 'Không thể dùng số điện thoại này để đăng ký. Vui lòng đăng nhập hoặc khôi phục mật khẩu.' : field === 'email' ? 'Không thể dùng email này để đăng ký. Vui lòng dùng email khác hoặc khôi phục mật khẩu.' : 'Không thể dùng thông tin này để đăng ký.',
        });
      }
      throw error;
    }
  }
}
