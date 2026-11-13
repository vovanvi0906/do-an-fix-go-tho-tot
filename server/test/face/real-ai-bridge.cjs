// Launched only by isolated Python smoke test. No DB/client app bootstrap or .env.
const { resolve } = require('path');
require('@babel/register')({ configFile: resolve(__dirname, '../../.babelrc') });
const { FastApiAiClient } = require('../../src/infrastructure/external/ai/fastapi-ai.client');
const { FaceEvidenceGateway } = require('../../src/modules/workers/face/face-evidence.gateway');
let input = '';
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', async () => {
  try {
    const body = JSON.parse(input), address = new URL(body.baseUrl);
    if (address.hostname !== '127.0.0.1' || address.protocol !== 'http:') throw new Error();
    const config = { AI_SERVICE_URL: body.baseUrl, AI_FACE_SERVICE_TOKEN: 'synthetic-local-smoke-token' };
    const client = new FastApiAiClient({ get: key => config[key] });
    const gateway = new FaceEvidenceGateway(client), caps = await gateway.capabilities();
    const request = { workerId:'synthetic',sessionId:'synthetic',photo:body.photo,modelVersion:caps.modelVersion,templateVersion:1 };
    const sample = await gateway.enroll(request);
    const match = await gateway.verify({ ...request, templateEmbedding: Array(128).fill(.125) });
    process.stdout.write(JSON.stringify({ ...caps, sampleDecision: sample.identityDecision, sampleError: sample.errorCode,
      identityDecision:match.identityDecision, padDecision:match.padDecision, embeddingReleased:sample.embedding!==undefined, verified:match.verified===true }));
  } catch (_) { process.stderr.write('LOCAL_FACE_BRIDGE_FAILED'); process.exitCode = 1; }
});
