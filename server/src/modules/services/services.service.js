import { Injectable, Dependencies, NotFoundException } from '@nestjs/common';
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

  async getServices(categoryId, targetId) {
    const where = {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
      ...(targetId ? { targetId } : {}),
    };

    return this.prisma.service.findMany({
      where,
      include: {
        category: true,
        target: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getServiceById(id) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        target: true,
      },
    });

    if (!service || !service.isActive || (service.category && !service.category.isActive)) {
      throw new NotFoundException('Dịch vụ không tồn tại hoặc đã ngừng hoạt động');
    }

    return service;
  }
}
