import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LogsService {
  constructor() {
    // Đảm bảo đường dẫn tới thư mục logs ở root monorepo
    const possiblePaths = [
      path.resolve(process.cwd(), '../logs'),
      path.resolve(process.cwd(), 'logs'),
      path.resolve(__dirname, '../../../../logs'),
    ];

    let targetLogsDir = possiblePaths[0];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        targetLogsDir = p;
        break;
      }
    }

    try {
      if (!fs.existsSync(targetLogsDir)) {
        fs.mkdirSync(targetLogsDir, { recursive: true });
      }
    } catch (e) {
      console.warn('⚠️ [LogsService] Không thể tạo thư mục logs:', e);
    }

    this.logFilePath = path.join(targetLogsDir, 'mobile.log');
  }

  writeClientLog(dto = {}) {
    try {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const formattedTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const platformTag = (dto.platform || 'UNKNOWN').toUpperCase();
      const levelTag = (dto.level || 'ERROR').toUpperCase();
      const routeInfo = dto.route ? ` [Route: ${dto.route}]` : '';
      const contextInfo = dto.context ? ` [Context: ${dto.context}]` : '';

      const logEntry = `[${formattedTime}] [MOBILE-${platformTag}] [${levelTag}]${contextInfo}${routeInfo}: ${dto.message || 'No message'}\nStack: ${dto.stack || 'No stack trace'}\n-----------------------------------\n`;

      // Đảm bảo thư mục cha tồn tại
      const dir = path.dirname(this.logFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.appendFileSync(this.logFilePath, logEntry, 'utf8');
      console.log(`📝 [MOBILE-LOG] Logged [${levelTag}] from ${platformTag}: ${dto.message}`);
      return { success: true };
    } catch (err) {
      console.error('❌ [LogsService] Lỗi khi ghi client log:', err);
      return { success: false, error: err.message };
    }
  }
}
