import { Ai01AuthConfigurationGuard } from './ai01-auth-configuration.guard';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { Ai01PermissionsController } from './ai01-permissions.controller';
import { Ai01PermissionsService } from './ai01-permissions.service';
import { AuthModule } from '../auth/auth.module';
import { Ai01ReviewController } from './ai01-review.controller';
import { Ai01ReviewService } from './ai01-review.service';
@Module({ imports: [AuthModule, PrismaModule], controllers: [Ai01ReviewController, Ai01PermissionsController], providers: [Ai01ReviewService, Ai01PermissionsService, Ai01AuthConfigurationGuard] })
export class Ai01ReviewModule {}
