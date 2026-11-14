import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  BadGatewayException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
export function debugEnabled() {
  return (
    process.env.RECOMMENDATION_DEBUG_ENABLED === 'true' &&
    ['development', 'staging', 'test'].includes(process.env.NODE_ENV)
  );
}
@Injectable()
export class RecommendationDebugGuard {
  canActivate(context) {
    if (!debugEnabled()) throw new NotFoundException();
    const expected = process.env.RECOMMENDATION_DEBUG_TOKEN || '';
    const supplied =
      context.switchToHttp().getRequest().headers.authorization || '';
    const token = supplied.startsWith('Bearer ') ? supplied.slice(7) : '';
    if (
      expected.length < 32 ||
      Buffer.byteLength(expected) !== Buffer.byteLength(token) ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(token))
    )
      throw new UnauthorizedException();
    return true;
  }
}
export async function inspectRecommendation(body, requestId) {
  if (
    !body ||
    typeof body.imageUrl !== 'string' ||
    !body.imageUrl ||
    typeof (body.description || '') !== 'string'
  )
    throw new BadRequestException({ code: 'INVALID_DEBUG_INPUT' });
  const start = performance.now();
  try {
    const response = await fetch(
      `${process.env.AI_SERVICE_URL || process.env.FASTAPI_AI_URL || 'http://localhost:8000'}/ai/v2/internal/diagnose-debug`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'X-Recommendation-Debug-Token':
            process.env.RECOMMENDATION_DEBUG_TOKEN,
        },
        body: JSON.stringify({
          imageUrl: body.imageUrl,
          description: body.description || '',
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok) {
      const failure = await response.json().catch(() => null);
      const detail = failure?.detail;
      if (
        detail?.code === 'MODEL_STAGE_FAILED' &&
        [
          'image_validation',
          'clip',
          'yolo',
          'category_fusion',
          'target_resolution',
        ].includes(detail.stage)
      )
        throw new BadGatewayException({
          code: 'MODEL_STAGE_FAILED',
          stage: detail.stage,
          message: 'AI không hoàn tất stage xử lý.',
        });
      throw new Error('DEBUG_UPSTREAM');
    }
    const result = await response.json();
    const threshold = Number(process.env.AI_CONFIDENCE_THRESHOLD ?? 0.6);
    return {
      ...result,
      backend: {
        requestId,
        confidenceThreshold: threshold,
        thresholdSource: process.env.AI_CONFIDENCE_THRESHOLD
          ? 'AI_CONFIDENCE_THRESHOLD'
          : 'default',
        categoryThresholdPassed:
          typeof result.result.confidence === 'number' &&
          result.result.confidence >= threshold,
        aiHttpElapsedMs: performance.now() - start,
      },
    };
  } catch (error) {
    if (error instanceof BadGatewayException) throw error;
    throw new BadGatewayException({
      code: 'DEBUG_AI_UNAVAILABLE',
      stage: 'ai_transport',
      message: 'Không lấy được telemetry AI.',
    });
  }
}
