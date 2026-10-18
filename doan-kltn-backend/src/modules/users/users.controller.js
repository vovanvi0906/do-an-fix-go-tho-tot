import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Body,
  UseGuards,
  Req,
  Bind,
  Dependencies,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { avatarStorage } from '../../config/cloudinary.config';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
@Dependencies(UsersService)
export class UsersController {
  constructor(usersService) {
    this.usersService = usersService;
  }

  @Get('profile')
  @ApiOperation({ summary: 'Lấy thông tin cá nhân của người dùng hiện tại' })
  @Bind(Req())
  async getProfile(req) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) {
      throw new BadRequestException('Không tìm thấy người dùng');
    }
    const { passwordHash: _, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  @Put('profile')
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
  @Bind(Req(), Body())
  async updateProfile(req, updateDto) {
    return this.usersService.updateProfile
      ? this.usersService.updateProfile(req.user.id, updateDto)
      : this.usersService.updateStatus(req.user.id, updateDto);
  }

  @Post('upload-avatar')
  @ApiOperation({ summary: 'Tải ảnh đại diện lên Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar', { storage: avatarStorage }))
  @Bind(Req(), UploadedFile())
  async uploadAvatar(req, file) {
    try {
      if (!file) {
        throw new BadRequestException('Vui lòng chọn file ảnh hợp lệ để tải lên (field: avatar)');
      }
      const avatarUrl = file.path || file.secure_url || file.url;
      console.log('📸 [UsersController] Upload avatar lên Cloudinary thành công:', avatarUrl);

      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        throw new UnauthorizedException('Không tìm thấy thông tin định danh người dùng trong token');
      }

      const updatedUser = await this.usersService.updateAvatar(userId, avatarUrl);
      const { passwordHash: _, ...sanitizedUser } = updatedUser;

      return {
        success: true,
        message: 'Upload thành công',
        avatarUrl: sanitizedUser.avatarUrl,
        user: sanitizedUser,
      };
    } catch (error) {
      console.error('❌ [UsersController] Lỗi xử lý upload avatar:', error);
      if (error?.stack) {
        console.error(error.stack);
      }
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException(`Lỗi upload avatar: ${error.message || 'Lỗi server'}`);
    }
  }

  @Patch('update-phone')
  @ApiOperation({ summary: 'Cập nhật số điện thoại cho tài khoản' })
  @Bind(Req(), Body())
  async updatePhone(req, body) {
    const phone = body?.phone;
    const userId = req.user?.id || req.user?.userId;
    console.log('📱 [UsersController] Cập nhật số điện thoại:', { userId, phone });

    const updatedUser = await this.usersService.updatePhone(userId, phone);
    const { passwordHash: _, ...sanitizedUser } = updatedUser;

    return {
      success: true,
      message: 'Cập nhật số điện thoại thành công',
      user: sanitizedUser,
    };
  }
}
