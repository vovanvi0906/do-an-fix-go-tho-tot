export function faceCoreConfig() {
  let keys = {};
  try { keys = Object.fromEntries(Object.entries(JSON.parse(process.env.FACE_TEMPLATE_KEYS_JSON || '{}')).map(([id, value]) => [id, Buffer.from(value, 'base64')])); } catch (_) { /* readiness stays closed */ }
  const number = (name, fallback) => Number(process.env[name] ?? fallback);
  return {
    enabled: process.env.FACE_CORE_ENABLED === 'true',
    captureApproved: process.env.FACE_BIOMETRIC_CAPTURE_APPROVED === 'true',
    consentVersion: process.env.FACE_CONSENT_VERSION || 'experimental-v1',
    keys, currentKeyId: process.env.FACE_TEMPLATE_KEY_ID,
    nonceKey: Buffer.from(process.env.FACE_NONCE_KEY_BASE64 || '', 'base64'),
    sessionMs: number('FACE_SESSION_TTL_MS', 120000), dailyMs: number('FACE_DAILY_TTL_MS', 28800000),
    orderMs: number('FACE_ORDER_TTL_MS', 300000), attempts: number('FACE_SESSION_ATTEMPTS', 3),
    windowAttempts: number('FACE_WINDOW_ATTEMPTS', 5), windowMs: number('FACE_WINDOW_MS', 900000),
    timeoutMs: number('FACE_INFERENCE_TIMEOUT_MS', 15000), threshold: number('FACE_IDENTITY_THRESHOLD', .60),
  };
}
