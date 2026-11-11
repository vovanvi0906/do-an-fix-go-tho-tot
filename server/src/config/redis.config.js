import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => {
  let host = process.env.REDIS_HOST || 'localhost';
  let port = parseInt(process.env.REDIS_PORT, 10) || 6380;
  let password = process.env.REDIS_PASSWORD || undefined;

  if (process.env.REDIS_URL) {
    try {
      const parsed = new URL(process.env.REDIS_URL);
      host = parsed.hostname || host;
      if (parsed.port) {
        port = parseInt(parsed.port, 10);
      }
      if (parsed.password) {
        password = parsed.password;
      }
    } catch (_) {}
  }

  return {
    host,
    port,
    password,
  };
});
