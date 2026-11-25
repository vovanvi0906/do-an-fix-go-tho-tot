import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { ServiceUnavailableException, ConflictException } from '@nestjs/common';
export class ReviewEngine {
  constructor(config) { this.config = config; this.pending = new Map(); this.child = null; this.buffer = ''; }
  start() {
    if (this.child) return;
    const { python, script, pilotDir, stateDir } = this.config;
    const child = spawn(python, ['-u', '-B', script], { shell: false, stdio: ['pipe', 'pipe', 'pipe'], env: { PATH: process.env.PATH || '/usr/bin:/bin', LANG: 'C.UTF-8', PYTHONDONTWRITEBYTECODE: '1', AI01_PILOT_DIR: pilotDir, AI01_REVIEW_STATE_DIR: stateDir } });
    this.child = child; this.buffer = '';
    child.stdout.on('data', chunk => {
      this.buffer += chunk.toString();
      if (this.buffer.length > 64 * 1024 * 1024) { this.close(); return; }
      let end;
      while ((end = this.buffer.indexOf('\n')) >= 0) {
        const line = this.buffer.slice(0, end); this.buffer = this.buffer.slice(end + 1);
        try {
          const result = JSON.parse(line), request = this.pending.get(result.id);
          if (!request) continue;
          clearTimeout(request.timer); this.pending.delete(result.id);
          if (result.ok) request.resolve(result.result);
          else request.reject(result.code === 'REVIEW_REJECTED' ? new ConflictException(result.message) : new ServiceUnavailableException('AI01_ENGINE_UNAVAILABLE: Kiểm tra dữ liệu/cấu hình Review Engine.'));
        } catch { this.close(); return; }
      }
    });
    // Do not expose Python filesystem traces or environmental details through HTTP/log aggregation.
    child.stderr.on('data', () => {});
    const fail = () => { if (this.child === child) { this.child = null; this.rejectPending(); } };
    child.stdin.on('error', fail); child.on('error', fail); child.on('exit', fail);
  }
  rejectPending() {
    for (const request of this.pending.values()) { clearTimeout(request.timer); request.reject(new ServiceUnavailableException('AI01_ENGINE_UNAVAILABLE: Không kết nối được engine; không tự chạy lại thao tác ghi.')); }
    this.pending.clear();
  }
  call(principal, op, payload = {}) {
    if (this.pending.size >= 32) return Promise.reject(new ServiceUnavailableException('Review Engine đang bận.'));
    this.start();
    const id = randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.close(), 180000);
      this.pending.set(id, { resolve, reject, timer });
      this.child.stdin.write(JSON.stringify({ id, principal, op, payload }) + '\n', error => { if (error) this.close(); });
    });
  }
  close() { const child = this.child; this.child = null; this.rejectPending(); if (child) child.kill('SIGTERM'); }
}
