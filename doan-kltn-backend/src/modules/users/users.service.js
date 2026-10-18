import { Injectable, Dependencies, BadRequestException } from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Injectable()
@Dependencies(UsersRepository)
export class UsersService {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }

  async findById(id) {
    return this.usersRepository.findById(id);
  }

  async findByEmail(email) {
    return this.usersRepository.findByEmail(email);
  }

  async findByPhone(phone) {
    return this.usersRepository.findByPhone(phone);
  }

  async findByEmailOrPhone(identifier) {
    return this.usersRepository.findByEmailOrPhone(identifier);
  }

  async create(userData) {
    return this.usersRepository.create(userData);
  }

  async updateStatus(id, status) {
    return this.usersRepository.updateStatus(id, status);
  }

  async updatePassword(phone, passwordHash) {
    return this.usersRepository.updatePassword(phone, passwordHash);
  }

  async markEmailVerified(userId, email) {
    return this.usersRepository.markEmailVerified(userId, email);
  }

  async markEmailVerifiedByEmail(email) {
    return this.usersRepository.markEmailVerifiedByEmail(email);
  }

  async findByGoogleId(googleId) {
    return this.usersRepository.findByGoogleId(googleId);
  }

  async linkGoogleAccount(userId, googleId, extraData = {}) {
    return this.usersRepository.linkGoogleAccount(userId, googleId, extraData);
  }

  async updateAvatar(userId, avatarUrl) {
    return this.usersRepository.updateAvatar(userId, avatarUrl);
  }

  async updatePhone(userId, phone) {
    const vnPhoneRegex = /(0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phone || !vnPhoneRegex.test(phone.trim())) {
      throw new BadRequestException('Số điện thoại không hợp lệ (yêu cầu 10 số, bắt đầu bằng 03, 05, 07, 08, 09)');
    }

    const cleanPhone = phone.trim();
    const existing = await this.usersRepository.findByPhone(cleanPhone);
    if (existing && existing.id !== userId) {
      throw new BadRequestException('Số điện thoại này đã được sử dụng bởi một tài khoản khác');
    }

    return this.usersRepository.updatePhone(userId, cleanPhone);
  }
}
