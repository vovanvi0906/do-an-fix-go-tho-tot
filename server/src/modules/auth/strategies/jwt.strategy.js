import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { Injectable, Dependencies, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
@Dependencies(PrismaService)
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(prisma) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret',
    });
    this.prisma = prisma;
  }

  async validate(payload) {
    if (payload.type === 'refresh' || typeof payload.sub !== 'string') throw new UnauthorizedException('ACCESS_TOKEN_REQUIRED');
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException('ACTIVE_ACCOUNT_REQUIRED');
    return {
      id: payload.sub,
      userId: payload.sub,
      role: user.role,
    };
  }
}
