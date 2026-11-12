import 'reflect-metadata';
import { Controller, Patch, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ApiBody, SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { UpdateAvailabilityDto } from './update-availability.dto';

@Controller('workers')
class SchemaController {
  @Patch('status')
  @ApiBody({ type: UpdateAvailabilityDto })
  update() {}
}
@Module({ controllers: [SchemaController] })
class SchemaModule {}

it('generates availability Swagger documentation without crashing startup', async () => {
  const app = await NestFactory.create(SchemaModule, { logger: false });
  try {
    const document = SwaggerModule.createDocument(app, new DocumentBuilder().build());
    expect(document.components.schemas.UpdateAvailabilityDto.properties).toMatchObject({
      isOnline: { type: 'boolean' }, lat: { type: 'number' }, lng: { type: 'number' },
    });
  } finally {
    await app.close();
  }
});
