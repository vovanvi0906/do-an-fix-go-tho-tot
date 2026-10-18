import { Injectable, Dependencies } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
@Dependencies(PrismaService)
export class UsersRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async findById(id) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        customerProfile: true,
        workerProfile: true,
      },
    });
  }

  async findByEmail(email) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        customerProfile: true,
        workerProfile: true,
      },
    });
  }

  async findByPhone(phone) {
    if (!phone) return null;
    return this.prisma.user.findFirst({
      where: { phone },
      include: {
        customerProfile: true,
        workerProfile: true,
      },
    });
  }

  async findByEmailOrPhone(identifier) {
    if (!identifier) return null;
    const cleanPhone = identifier
      .replace(/@(phone|worker)\.alotho\.vn$/, '')
      .trim();
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { email: cleanPhone },
          { phone: identifier },
          { phone: cleanPhone },
        ],
      },
      include: {
        customerProfile: true,
        workerProfile: true,
      },
    });
  }

  async create(userData) {
    return this.prisma.user.create({
      data: userData,
      include: {
        customerProfile: true,
        workerProfile: true,
      },
    });
  }

  async updateStatus(id, status) {
    return this.prisma.user.update({
      where: { id },
      data: { status },
      include: {
        customerProfile: true,
        workerProfile: true,
      },
    });
  }

  async updatePassword(phone, passwordHash) {
    return this.prisma.user.updateMany({
      where: { phone },
      data: { passwordHash },
    });
  }

  async markEmailVerified(userId, email) {
    const data = { isEmailVerified: true };
    if (email) data.email = email;
    return this.prisma.user.update({
      where: { id: userId },
      data,
      include: {
        customerProfile: true,
        workerProfile: true,
      },
    });
  }

  async markEmailVerifiedByEmail(email) {
    return this.prisma.user.updateMany({
      where: { email },
      data: { isEmailVerified: true },
    });
  }

  async findByGoogleId(googleId) {
    if (!googleId) return null;
    return this.prisma.user.findFirst({
      where: { googleId },
      include: {
        customerProfile: true,
        workerProfile: true,
      },
    });
  }

  async linkGoogleAccount(userId, googleId, extraData = {}) {
    const data = {
      googleId,
      isEmailVerified: true,
    };
    if (extraData.avatarUrl) data.avatarUrl = extraData.avatarUrl;
    if (extraData.name) data.name = extraData.name;

    return this.prisma.user.update({
      where: { id: userId },
      data,
      include: {
        customerProfile: true,
        workerProfile: true,
      },
    });
  }

  async updateAvatar(userId, avatarUrl) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { customerProfile: true, workerProfile: true },
    });
    const data = { avatarUrl };
    if (user?.customerProfile) {
      data.customerProfile = { update: { avatarUrl } };
    }
    if (user?.workerProfile) {
      data.workerProfile = { update: { avatarUrl } };
    }
    return this.prisma.user.update({
      where: { id: userId },
      data,
      include: {
        customerProfile: true,
        workerProfile: true,
      },
    });
  }

  async updatePhone(userId, phone) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { customerProfile: true, workerProfile: true },
    });
    const data = { phone, isPhoneVerified: true };
    if (user?.customerProfile) {
      data.customerProfile = { update: { phone } };
    }
    if (user?.workerProfile) {
      data.workerProfile = { update: { phone } };
    }
    return this.prisma.user.update({
      where: { id: userId },
      data,
      include: {
        customerProfile: true,
        workerProfile: true,
      },
    });
  }
}

