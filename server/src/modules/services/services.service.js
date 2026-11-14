import { Injectable, Dependencies, NotFoundException } from '@nestjs/common';
import { activeTarget, pageQuery } from '../symptoms/symptom-catalog';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
@Dependencies(PrismaService)
export class ServicesService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async getCategories() {
    return this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      include: {
        services: {
          where: { isActive: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getCategoryTree() {
    return this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      include: {
        targets: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            services: {
              where: { isActive: true },
              orderBy: { name: 'asc' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getTargets(categoryId) {
    const where = {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
    };
    return this.prisma.serviceTarget.findMany({
      where,
      include: {
        category: true,
        _count: { select: { services: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getServices(categoryId, targetId, query = {}) {
    if (targetId) await activeTarget(this.prisma, targetId, categoryId);
    const paged =
      query.page !== undefined ||
      query.limit !== undefined ||
      query.search !== undefined;
    const pagination = paged ? pageQuery(query) : null;
    const where = {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
      ...(targetId ? { targetId } : {}),
      category: { isActive: true },
      ...(pagination?.search
        ? {
            OR: [
              { name: { contains: pagination.search, mode: 'insensitive' } },
              {
                description: {
                  contains: pagination.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const items = await this.prisma.service.findMany({
      where,
      include: {
        category: true,
        target: true,
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      ...(pagination ? { skip: pagination.skip, take: pagination.limit } : {}),
    });
    if (!pagination) return items; // Preserve legacy array contract.
    const total = await this.prisma.service.count({ where });
    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      hasMore: pagination.page * pagination.limit < total,
    };
  }

  async getServiceById(id) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        target: true,
      },
    });

    if (
      !service ||
      !service.isActive ||
      (service.category && !service.category.isActive)
    ) {
      throw new NotFoundException(
        'Dịch vụ không tồn tại hoặc đã ngừng hoạt động',
      );
    }

    return service;
  }
}
