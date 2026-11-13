// Fail before touching Docker/ADB if another worktree already owns a dev port.
const net = require('node:net');
const ports = [3000, 8000, 5173, 8081, 8082];
(async () => {
  for (const port of ports) {
    await new Promise((resolve, reject) => {
      const server = net.createServer();
      server.once('error', () => reject(new Error(`Cổng ${port} đang bận/không bind được. Kiểm tra PID và /proc/<PID>/cwd; không tự dừng process của worktree khác.`)));
      server.listen(port, '127.0.0.1', () => server.close(resolve));
    });
  }
  console.log(`USB ports available: ${ports.join(', ')}; worktree=${process.cwd()}`);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
