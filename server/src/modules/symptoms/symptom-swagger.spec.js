import { Test } from '@nestjs/testing';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { SymptomsController, AdminSymptomsController } from './symptoms.controller';
import { SymptomsService } from './symptoms.service';

it('builds real Swagger schemas with explicit JS/Babel DTO field types', async () => {
  const module = await Test.createTestingModule({ controllers: [SymptomsController, AdminSymptomsController], providers: [{ provide: SymptomsService, useValue: {} }] }).compile();
  const app = module.createNestApplication();
  try {
    await app.init();
    const document = SwaggerModule.createDocument(app, new DocumentBuilder().build());
    const create = document.components.schemas.CreateSymptomDto;
    expect(create.properties.targetId.type).toBe('string');
    expect(create.properties.isActive.type).toBe('boolean');
    expect(create.properties.sortOrder.type).toBe('number');
    expect(create.properties.aliases.items.type).toBe('string');
    expect(document.components.schemas.SymptomMappingDto.properties.priority.type).toBe('number');
    expect(document.paths['/admin/symptoms'].post).toBeDefined();
  } finally { await app.close(); }
});
