import {
  Injectable,
  Dependencies,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { getFirebaseAdmin, getFirebaseAuth } from '../../config/firebase.config';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp.service';

@Injectable()
@Dependencies(UsersService, JwtService, OtpService)
export class AuthService {
  constructor(usersService, jwtService, otpService) {
    this.usersService = usersService;
    this.jwtService = jwtService;
    this.otpService = otpService;
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '');
  }

  async register(data) {
    const role = (data.role || 'CUSTOMER').toUpperCase();
    if (role === 'WORKER') {
      return this.registerWorker(data);
    }
    return this.registerCustomer(data);
  }

  async registerCustomer(data) {
    const { email, password, phone, fullName, firstName, lastName, avatarUrl } = data;

    const existingEmail = await this.usersService.findByEmail(email);
    if (existingEmail) {
      throw new BadRequestException('Email đã tồn tại trong hệ thống');
    }

    if (phone) {
      const existingPhone = await this.usersService.findByPhone(phone);
      if (existingPhone) {
        throw new BadRequestException(
          'Số điện thoại đã tồn tại trong hệ thống',
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const resolvedFullName =
      fullName ||
      [lastName, firstName].filter(Boolean).join(' ').trim() ||
      null;

    const user = await this.usersService.create({
      email,
      passwordHash,
      phone: phone || null,
      name: resolvedFullName,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      isEmailVerified: false,
      customerProfile: {
        create: {
          fullName: resolvedFullName,
          avatarUrl: avatarUrl || null,
        },
      },
    });

    const { passwordHash: _, ...sanitizedUser } = user;
    const token = this.jwtService.sign({ sub: user.id, role: user.role });

    return {
      message: 'Đăng ký tài khoản khách hàng thành công',
      user: sanitizedUser,
      accessToken: token,
    };
  }

  async registerWorker(data) {
    const {
      email,
      password,
      phone,
      fullName,
      avatarUrl,
      skills,
      bio,
      cccdNumber,
    } = data;

    const existingEmail = await this.usersService.findByEmail(email);
    if (existingEmail) {
      throw new BadRequestException('Email đã tồn tại trong hệ thống');
    }

    if (phone) {
      const existingPhone = await this.usersService.findByPhone(phone);
      if (existingPhone) {
        throw new BadRequestException(
          'Số điện thoại đã tồn tại trong hệ thống',
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      email,
      passwordHash,
      phone: phone || null,
      role: 'WORKER',
      status: 'ACTIVE',
      isEmailVerified: false,
      workerProfile: {
        create: {
          fullName: fullName || null,
          avatarUrl: avatarUrl || null,
          idCardNumber: cccdNumber || null,
          skills: Array.isArray(skills) ? skills : skills ? [skills] : [],
          bio: bio || null,
          approvalStatus: 'DRAFT',
        },
      },
    });

    const { passwordHash: _, ...sanitizedUser } = user;
    const token = this.jwtService.sign({ sub: user.id, role: user.role });

    return {
      message: 'Đăng ký tài khoản thợ thành công',
      user: sanitizedUser,
      accessToken: token,
    };
  }

  async login(emailOrPhone, password) {
    console.log('🔑 [Backend AuthService] Nhận yêu cầu đăng nhập:', {
      identifier: emailOrPhone,
    });

    if (!emailOrPhone || !password) {
      console.warn('⚠️ [Backend AuthService] Thiếu emailOrPhone hoặc password');
      throw new BadRequestException('Vui lòng nhập đầy đủ thông tin đăng nhập');
    }

    const user = await this.usersService.findByEmailOrPhone(emailOrPhone);
    if (!user) {
      console.warn(
        '⚠️ [Backend AuthService] Không tìm thấy user với định danh:',
        emailOrPhone,
      );
      throw new UnauthorizedException(
        'Email / Số điện thoại hoặc mật khẩu không chính xác',
      );
    }

    if (user.status === 'BLOCKED') {
      console.warn('⚠️ [Backend AuthService] User bị khóa:', user.email);
      throw new ForbiddenException(
        'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin',
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.warn('⚠️ [Backend AuthService] Mật khẩu không khớp cho user:', {
        email: user.email,
        phone: user.phone,
      });
      throw new UnauthorizedException(
        'Email / Số điện thoại hoặc mật khẩu không chính xác',
      );
    }

    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    const { passwordHash: _, ...sanitizedUser } = user;

    console.log('✅ [Backend AuthService] Đăng nhập thành công:', {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });

    return {
      message: 'Đăng nhập thành công',
      user: sanitizedUser,
      accessToken: token,
    };
  }

  /**
   * Đặt lại mật khẩu (dùng resetToken từ OTP verify)
   */
  async resetPassword(resetToken, newPassword) {
    console.log('🔐 [Backend AuthService] Yêu cầu đặt lại mật khẩu');

    // Validate resetToken và lấy phone đã verify
    const phone = await this.otpService.validateResetToken(resetToken);

    // Kiểm tra user tồn tại
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new BadRequestException(
        'Không tìm thấy tài khoản với số điện thoại này',
      );
    }

    // Hash mật khẩu mới
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(phone, passwordHash);

    console.log(
      '✅ [Backend AuthService] Đặt lại mật khẩu thành công cho:',
      phone,
    );

    return {
      message:
        'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.',
    };
  }

  /**
   * Đăng nhập / Đăng ký tự động bằng tài khoản Google (Google Sign-In)
   * @param {string} idToken - Google JWT idToken gửi từ client
   */
  async googleLogin(idToken) {
    if (!idToken) {
      throw new BadRequestException('Vui lòng cung cấp idToken của Google');
    }

    console.log('🌐 [Backend AuthService] Bắt đầu xác thực Google idToken...');

    let payload;
    try {
      const allowedAudiences = [
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_FIREBASE_WEB_CLIENT_ID,
        process.env.GOOGLE_ANDROID_CLIENT_ID,
      ].filter(Boolean);
      const audience = allowedAudiences.length > 0 ? allowedAudiences : undefined;
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience,
      });
      payload = ticket.getPayload();
    } catch (err) {
      console.error('❌ [Backend AuthService] Xác thực Google idToken thất bại:', err.message);
      throw new UnauthorizedException('Mã xác thực Google (idToken) không hợp lệ hoặc đã hết hạn');
    }

    if (!payload || !payload.email) {
      throw new BadRequestException('Không thể trích xuất địa chỉ email từ tài khoản Google này');
    }

    const { email, sub: googleId, name, picture } = payload;
    console.log('👤 [Backend AuthService] Thông tin Google user:', {
      email,
      name,
      googleId,
    });

    // 1. Tìm user theo googleId
    let user = await this.usersService.findByGoogleId(googleId);

    // 2. Nếu chưa có theo googleId -> Tìm theo email
    if (!user) {
      user = await this.usersService.findByEmail(email);
      if (user) {
        // Tài khoản đã có trong hệ thống -> Liên kết Google ID và cập nhật xác thực email
        user = await this.usersService.linkGoogleAccount(user.id, googleId, {
          avatarUrl: user.avatarUrl || picture || null,
          name: user.name || name || null,
        });
        console.log('🔗 [Backend AuthService] Đã liên kết tài khoản Google với email hiện có:', email);
      }
    }

    // 3. Nếu chưa từng tồn tại tài khoản -> Tự động tạo mới User với vai trò CUSTOMER
    if (!user) {
      console.log('🆕 [Backend AuthService] Tự động tạo tài khoản Customer mới từ Google:', email);
      const displayName = name || 'Khách hàng FixGo';
      user = await this.usersService.create({
        email,
        name: displayName,
        avatarUrl: picture || null,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        isEmailVerified: true,
        googleId,
        customerProfile: {
          create: {
            fullName: displayName,
            avatarUrl: picture || null,
          },
        },
      });
    }

    if (user.status === 'BLOCKED') {
      throw new ForbiddenException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin');
    }

    // 4. Sinh Access Token và Refresh Token chuẩn JWT
    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role, email: user.email },
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, role: user.role, type: 'refresh' },
      { expiresIn: '7d' },
    );

    const { passwordHash: _, ...sanitizedUser } = user;

    console.log('🎉 [Backend AuthService] Đăng nhập Google thành công cho user:', user.email);

    return {
      success: true,
      statusCode: 200,
      message: 'Đăng nhập bằng Google thành công',
      data: {
        accessToken,
        refreshToken,
        requirePhoneUpdate: !user.phone,
        user: sanitizedUser,
      },
    };
  }

  /**
   * Đăng nhập / Đăng ký tự động bằng tài khoản Google thông qua Firebase Authentication
   * @param {string} idToken - Firebase ID Token từ Mobile Client
   */
  async firebaseGoogleLogin(idToken) {
    if (!idToken) {
      throw new BadRequestException('Vui lòng cung cấp idToken của Firebase');
    }

    console.log('🔥 [Backend AuthService] Bắt đầu xác thực Firebase idToken...');
    const auth = getFirebaseAuth();
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (err) {
      console.error('❌ [Backend AuthService] Xác thực Firebase idToken thất bại:', err.message);
      throw new UnauthorizedException(
        'Mã xác thực Firebase (idToken) không hợp lệ hoặc đã hết hạn: ' + err.message,
      );
    }

    const { email, uid, name, picture } = decodedToken;
    if (!email) {
      throw new BadRequestException(
        'Không thể trích xuất địa chỉ email từ tài khoản Firebase này',
      );
    }

    console.log('👤 [Backend AuthService] Thông tin Firebase user:', {
      email,
      name,
      uid,
    });

    // 1. Tìm user theo googleId (hoặc uid liên kết)
    let user = await this.usersService.findByGoogleId(uid);

    // 2. Nếu chưa có -> Tìm theo email để liên kết
    if (!user) {
      user = await this.usersService.findByEmail(email);
      if (user) {
        user = await this.usersService.linkGoogleAccount(user.id, uid, {
          avatarUrl: user.avatarUrl || picture || null,
          name: user.name || name || null,
        });
        console.log('🔗 [Backend AuthService] Đã liên kết tài khoản Firebase với email hiện có:', email);
      }
    }

    // 3. Nếu chưa từng tồn tại tài khoản -> Tự động tạo mới User với vai trò CUSTOMER
    if (!user) {
      console.log('🆕 [Backend AuthService] Tự động tạo tài khoản Customer mới từ Firebase Google:', email);
      const displayName = name || 'Khách hàng FixGo';
      user = await this.usersService.create({
        email,
        name: displayName,
        avatarUrl: picture || null,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        isEmailVerified: true,
        googleId: uid,
        customerProfile: {
          create: {
            fullName: displayName,
            avatarUrl: picture || null,
          },
        },
      });
    }

    if (user.status === 'BLOCKED') {
      throw new ForbiddenException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin');
    }

    // 4. Sinh Access Token và Refresh Token chuẩn JWT
    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role, email: user.email },
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, role: user.role, type: 'refresh' },
      { expiresIn: '7d' },
    );

    const { passwordHash: _, ...sanitizedUser } = user;

    console.log('🎉 [Backend AuthService] Đăng nhập Firebase Google thành công cho user:', user.email);

    return {
      success: true,
      statusCode: 200,
      message: 'Đăng nhập bằng Google (Firebase) thành công',
      data: {
        accessToken,
        refreshToken,
        expiresIn: 86400,
        requirePhoneUpdate: !user.phone,
        user: sanitizedUser,
      },
    };
  }
}
