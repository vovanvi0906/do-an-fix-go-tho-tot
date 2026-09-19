import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Bind,
  Dependencies,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LogsService } from './logs.service';

@ApiTags('logs')
@Controller('logs')
@Dependencies(LogsService)
export class LogsController {
  constructor(logsService) {
    this.logsService = logsService;
  }

  @Post('client')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tiếp nhận log và crash báo cáo từ Mobile/Web client' })
  @ApiResponse({ status: 200, description: 'Ghi log thành công' })
  @Bind(Body())
  async logClientError(body) {
    return this.logsService.writeClientLog(body);
  }
}
