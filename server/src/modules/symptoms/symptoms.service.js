import {
  Injectable,
  Dependencies,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  activeTarget,
  fail,
  listTargetSymptoms,
  pageQuery,
  recommendServices,
  requireCatalog,
} from './symptom-catalog';
import {
  CreateSymptomDto,
  UpdateSymptomDto,
  SymptomMappingDto,
} from './dto/symptom.dto';

function validated(Dto, body) {
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.values(body).some((value) => value === null)
  )
    fail('INVALID_BODY', 'Dữ liệu không hợp lệ.');
  const dto = plainToInstance(Dto, body);
  const errors = validateSync(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (errors.length)
    fail(
      'INVALID_BODY',
      errors
        .map((e) => Object.values(e.constraints || {}).join(', '))
        .join('; '),
    );
  if (dto.name !== undefined) {
    dto.name = dto.name.trim();
    if (!dto.name) fail('INVALID_NAME', 'Tên triệu chứng không được trống.');
  }
  if (dto.aliases)
    dto.aliases = [
      ...new Set(dto.aliases.map((s) => s.trim()).filter(Boolean)),
    ];
  return Object.fromEntries(
    Object.entries(dto).filter(([, value]) => value !== undefined),
  );
}
function approvedActive(value) {
  if (value.isActive && value.reviewStatus !== 'APPROVED')
    fail('REVIEW_REQUIRED', 'Phải duyệt trước khi kích hoạt.');
}
function translate(error) {
  if (error.code === 'P2002')
    throw new ConflictException({
      code: 'DUPLICATE_SYMPTOM_CODE',
      message: 'Code đã tồn tại trong thiết bị này.',
    });
  if (['P2003', 'P2034'].includes(error.code))
    throw new ConflictException({
      code: 'CATALOG_CHANGED',
      message: 'Catalog vừa thay đổi. Vui lòng tải lại và thử lại.',
    });
  throw error;
}
@Injectable()
@Dependencies(PrismaService)
export class SymptomsService {
  constructor(prisma) {
    this.prisma = prisma;
  }
  getSymptoms(targetId, categoryId) {
    return listTargetSymptoms(this.prisma, targetId, categoryId);
  }
  recommend(query) {
    return recommendServices(this.prisma, query);
  }
  async listAdmin(query = {}) {
    requireCatalog();
    const { page, limit, skip, search } = pageQuery(query);
    if (
      query.isActive !== undefined &&
      !['true', 'false'].includes(String(query.isActive))
    )
      fail('INVALID_FILTER', 'isActive phải là true hoặc false.');
    if (
      query.reviewStatus &&
      !['NEEDS_REVIEW', 'APPROVED', 'REJECTED'].includes(query.reviewStatus)
    )
      fail('INVALID_FILTER', 'Trạng thái duyệt không hợp lệ.');
    const where = {
      ...(query.targetId ? { targetId: query.targetId } : {}),
      ...(query.categoryId ? { target: { categoryId: query.categoryId } } : {}),
      ...(query.isActive !== undefined
        ? { isActive: String(query.isActive) === 'true' }
        : {}),
      ...(query.reviewStatus ? { reviewStatus: query.reviewStatus } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
              { aliases: { has: search } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.symptom.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        include: {
          target: { include: { category: true } },
          mappings: { include: { service: true } },
        },
      }),
      this.prisma.symptom.count({ where }),
    ]);
    return {
      items: items.map((s) => ({
        ...s,
        warnings: [
          ...(!s.target.isActive || !s.target.category.isActive
            ? ['TARGET_NOT_ACTIVE']
            : []),
          ...(!s.mappings.some(
            (m) =>
              m.isActive && m.reviewStatus === 'APPROVED' && m.service.isActive,
          )
            ? ['NO_ACTIVE_MAPPING']
            : []),
          ...s.mappings
            .filter(
              (m) =>
                !m.service.isActive ||
                m.service.targetId !== s.targetId ||
                m.service.categoryId !== s.target.categoryId,
            )
            .map((m) => `INVALID_OR_INACTIVE_SERVICE:${m.serviceId}`),
        ],
      })),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }
  async create(body, actorId) {
    requireCatalog();
    const dto = validated(CreateSymptomDto, body);
    approvedActive(dto);
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          await activeTarget(tx, dto.targetId);
          const item = await tx.symptom.create({
            data: { ...dto, createdBy: actorId, updatedBy: actorId },
          });
          await tx.symptomCatalogAudit.create({
            data: {
              actorId,
              action: 'CREATE_SYMPTOM',
              entityId: item.id,
              changes: dto,
            },
          });
          return item;
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (error) {
      translate(error);
    }
  }
  async update(id, body, actorId) {
    requireCatalog();
    const dto = validated(UpdateSymptomDto, body);
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const old = await tx.symptom.findUnique({ where: { id } });
          if (!old) throw new NotFoundException('Không tìm thấy triệu chứng.');
          if (dto.targetId && dto.targetId !== old.targetId)
            fail(
              'IMMUTABLE_TARGET',
              'Không chuyển triệu chứng sang thiết bị khác; hãy tạo triệu chứng mới.',
            );
          approvedActive({ ...old, ...dto });
          if (dto.isActive) await activeTarget(tx, old.targetId);
          const item = await tx.symptom.update({
            where: { id },
            data: { ...dto, updatedBy: actorId },
          });
          await tx.symptomCatalogAudit.create({
            data: {
              actorId,
              action: 'UPDATE_SYMPTOM',
              entityId: id,
              changes: {
                before: {
                  name: old.name,
                  isActive: old.isActive,
                  reviewStatus: old.reviewStatus,
                },
                after: dto,
              },
            },
          });
          return item;
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (error) {
      translate(error);
    }
  }
  async mapService(symptomId, serviceId, body, actorId) {
    requireCatalog();
    const dto = validated(SymptomMappingDto, body);
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const symptom = await tx.symptom.findUnique({
            where: { id: symptomId },
          });
          if (!symptom)
            throw new NotFoundException('Không tìm thấy triệu chứng.');
          const target = await activeTarget(tx, symptom.targetId);
          const service = await tx.service.findUnique({
            where: { id: serviceId },
          });
          if (!service?.isActive)
            fail(
              'SERVICE_NOT_AVAILABLE',
              'Dịch vụ đã ngừng hoạt động hoặc không tồn tại.',
            );
          if (
            service.targetId !== target.id ||
            service.categoryId !== target.categoryId
          )
            fail(
              'SERVICE_TARGET_MISMATCH',
              'Không thể liên kết dịch vụ khác thiết bị hoặc danh mục.',
            );
          const where = { symptomId_serviceId: { symptomId, serviceId } };
          const old = await tx.symptomService.findUnique({ where });
          approvedActive({ ...old, ...dto });
          const item = await tx.symptomService.upsert({
            where,
            create: {
              ...dto,
              symptomId,
              serviceId,
              targetId: symptom.targetId,
              createdBy: actorId,
              updatedBy: actorId,
            },
            update: { ...dto, updatedBy: actorId },
          });
          await tx.symptomCatalogAudit.create({
            data: {
              actorId,
              action: 'MAP_SERVICE',
              entityId: symptomId,
              changes: { serviceId, ...dto },
            },
          });
          return item;
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (error) {
      translate(error);
    }
  }
  async unmapService(symptomId, serviceId, actorId) {
    requireCatalog();
    return this.prisma.$transaction(async (tx) => {
      const where = { symptomId_serviceId: { symptomId, serviceId } };
      const old = await tx.symptomService.findUnique({ where });
      if (!old) throw new NotFoundException('Không tìm thấy liên kết.');
      const item = await tx.symptomService.update({
        where,
        data: { isActive: false, updatedBy: actorId },
      });
      await tx.symptomCatalogAudit.create({
        data: {
          actorId,
          action: 'UNMAP_SERVICE',
          entityId: symptomId,
          changes: { serviceId, isActive: false },
        },
      });
      return item;
    });
  }
}
