import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { SymptomsService } from './symptoms.service';
import { SymptomsController, AdminSymptomsController } from './symptoms.controller';
@Module({ imports: [PrismaModule], controllers: [SymptomsController, AdminSymptomsController], providers: [SymptomsService], exports: [SymptomsService] })
export class SymptomsModule {}
