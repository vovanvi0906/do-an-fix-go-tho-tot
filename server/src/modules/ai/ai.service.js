import { Injectable, Dependencies } from '@nestjs/common';
import { FastApiAiClient } from '../../infrastructure/external/ai/fastapi-ai.client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
@Dependencies(FastApiAiClient, PrismaService)
export class AiService {
  constructor(fastApiAiClient, prisma) {
    this.fastApiAiClient = fastApiAiClient;
    this.prisma = prisma;
  }

  async verifyFace(workerUserId, faceImageUrl, idCardImageUrl) {
    // Caller-supplied reference supports comparison only, never account approval.
    return this.fastApiAiClient.verifyFace(workerUserId, faceImageUrl, idCardImageUrl);
  }

  async analyzeBeforeAfter(orderId, beforeImageUrl, afterImageUrl) {
    const result = await this.fastApiAiClient.analyzeBeforeAfter(
      beforeImageUrl,
      afterImageUrl,
    );

    if (orderId && result.completed) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          beforeImageUrl,
          afterImageUrl,
        },
      });
    }

    return result;
  }

  async analyzeIncident(orderId, imageUrl, description) {
    const result = await this.fastApiAiClient.analyzeIncident(
      imageUrl,
      description,
    );

    if (orderId && result.issueDetected) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          aiDetectedIssue: result.issueDetected,
        },
      });
    }

    return result;
  }
}
