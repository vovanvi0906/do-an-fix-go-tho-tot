import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Offline storage primitive, not a provisioning API. Key custody/retention need approval.
function aad(context) {
  const { workerId, templateVersion, modelVersion } = context || {};
  if (typeof workerId !== 'string' || !workerId || !Number.isSafeInteger(templateVersion) || templateVersion < 1 ||
      typeof modelVersion !== 'string' || !modelVersion) throw new Error('INVALID_TEMPLATE_CONTEXT');
  return Buffer.from(JSON.stringify([workerId, templateVersion, modelVersion]));
}
function validateKey(key) {
  if (!Buffer.isBuffer(key) || key.length !== 32) throw new Error('INVALID_TEMPLATE_KEY');
}
function validateEmbedding(embedding) {
  if (!Array.isArray(embedding) || embedding.length !== 128 ||
      !embedding.every(v => typeof v === 'number' && Number.isFinite(v)) ||
      !Number.isFinite(Math.hypot(...embedding)) || Math.hypot(...embedding) === 0) {
    throw new Error('INVALID_EMBEDDING');
  }
}
export function sealTemplate(embedding, context, key) {
  validateKey(key); validateEmbedding(embedding);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(aad(context));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(embedding), 'utf8'), cipher.final()]);
  return { format: 'sface-aes256gcm-v1', iv: iv.toString('base64'), ciphertext: ciphertext.toString('base64'), tag: cipher.getAuthTag().toString('base64') };
}
export function openTemplate(envelope, context, key) {
  validateKey(key);
  if (envelope?.format !== 'sface-aes256gcm-v1') throw new Error('INVALID_TEMPLATE_FORMAT');
  const iv = Buffer.from(envelope.iv, 'base64');
  const tag = Buffer.from(envelope.tag, 'base64');
  if (iv.length !== 12 || tag.length !== 16 || typeof envelope.ciphertext !== 'string' || envelope.ciphertext.length > 8192) throw new Error('INVALID_TEMPLATE_FORMAT');
  const cipher = createDecipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(aad(context)); cipher.setAuthTag(tag);
  const embedding = JSON.parse(Buffer.concat([cipher.update(Buffer.from(envelope.ciphertext, 'base64')), cipher.final()]).toString('utf8'));
  validateEmbedding(embedding);
  return embedding;
}
