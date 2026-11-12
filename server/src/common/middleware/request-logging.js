import { randomUUID } from 'node:crypto';

export const requestLogging = (req, res, next) => {
  const supplied = req.headers['x-request-id'];
  const requestId = typeof supplied === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(supplied)
    ? supplied : randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  const startedAt = Date.now();
  res.on('finish', () => {
    console.log(JSON.stringify({ type: 'http', requestId, method: req.method,
      path: req.path, status: res.statusCode, durationMs: Date.now() - startedAt }));
  });
  next();
};
