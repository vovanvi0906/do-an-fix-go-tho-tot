import { Injectable, ServiceUnavailableException } from '@nestjs/common';
// Keep the existing login/JWT strategy unchanged; do not enable AI permissions with its fallback key.
@Injectable()
export class Ai01AuthConfigurationGuard {
  canActivate() {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new ServiceUnavailableException('AI01_AUTH_SETUP_REQUIRED: Cần JWT secret riêng môi trường đủ mạnh trước khi bật quyền AI; không dùng fallback.');
    return true;
  }
}
