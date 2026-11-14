function assertDisposable(url) {
  if (!url) throw new Error('DISPOSABLE_DATABASE_URL must be explicit; no DATABASE_URL fallback.');
  const u = new URL(url);
  if (u.hostname !== '127.0.0.1' || u.port !== '55439' || u.pathname !== '/fixgo_symptoms_disposable' || u.username !== 'fixgo_disposable') throw new Error('Refusing non-disposable database (requires loopback port 55439/fixgo_symptoms_disposable).');
  return url;
}
module.exports = { assertDisposable };
