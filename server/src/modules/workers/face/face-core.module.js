import { FaceReadyGuard } from './face-ready.guard';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../infrastructure/database/prisma.module';
import { AiModule } from '../../ai/ai.module';
import { FaceCoreService } from './face-core.service';
import { FaceEvidenceGateway } from './face-evidence.gateway';
import { FaceCoreController, FaceReviewController } from './face-core.controller';
import { FaceLabController } from './face-lab.controller';
import { FaceLabDebugGuard } from './face-lab.guard';
import { FaceLabInspectorService } from './face-lab-inspector.service';
@Module({ imports: [PrismaModule, AiModule], controllers: [FaceCoreController, FaceReviewController, FaceLabController],
  providers: [FaceCoreService, FaceEvidenceGateway, FaceReadyGuard, FaceLabDebugGuard, FaceLabInspectorService], exports: [FaceCoreService] })
export class FaceCoreModule {}
