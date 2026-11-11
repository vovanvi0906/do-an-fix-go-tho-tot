import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Bind,
  Dependencies,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VerifyFaceDto } from './dto/verify-face.dto';
import { AnalyzeBeforeAfterDto } from './dto/analyze-before-after.dto';
import { AnalyzeIncidentDto } from './dto/analyze-incident.dto';

@ApiTags('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('ai')
@Dependencies(AiService)
export class AiController {
  constructor(aiService) {
    this.aiService = aiService;
  }

  @Post('verify-face')
  @ApiOperation({ summary: 'AI: Xác thực khuôn mặt thợ với CMND/CCCD' })
  @Bind(Req(), Body())
  async verifyFace(req, verifyFaceDto) {
    return this.aiService.verifyFace(
      req.user?.id || req.user?.userId,
      verifyFaceDto.faceImageUrl,
      verifyFaceDto.idCardImageUrl,
    );
  }

  @Post('analyze-before-after')
  @ApiOperation({ summary: 'AI: Đánh giá chất lượng trước và sau thi công' })
  @Bind(Body())
  async analyzeBeforeAfter(analyzeDto) {
    return this.aiService.analyzeBeforeAfter(
      analyzeDto.orderId,
      analyzeDto.beforeImageUrl,
      analyzeDto.afterImageUrl,
    );
  }

  @Post('analyze-incident')
  @ApiOperation({ summary: 'AI: Phân tích sự cố / hỏng hóc từ hình ảnh' })
  @Bind(Body())
  async analyzeIncident(incidentDto) {
    return this.aiService.analyzeIncident(
      incidentDto.orderId,
      incidentDto.imageUrl,
      incidentDto.description,
    );
  }
}
