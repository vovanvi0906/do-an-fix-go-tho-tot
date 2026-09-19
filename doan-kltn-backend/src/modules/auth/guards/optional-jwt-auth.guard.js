import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Auth Guard
 * Cho phép request đi qua kể cả khi không có JWT Token (Guest mode),
 * nhưng nếu có Token hợp lệ thì sẽ giải mã và gắn thông tin vào req.user.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    // Không ném ngoại lệ UnauthorizedException nếu không có user hoặc token lỗi
    return user || null;
  }
}
