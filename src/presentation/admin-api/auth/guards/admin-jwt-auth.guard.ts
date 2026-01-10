import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '@infrastructure/auth/decorators/public.decorator';
import { AdminJwtPayload } from '../admin-auth.service';

/**
 * Admin JWT Auth Guard
 *
 * 관리자 JWT 토큰 검증 가드
 * - Bearer 토큰 추출
 * - JWT 검증 및 페이로드 확인
 * - ADMIN 역할 확인
 */
@Injectable()
export class AdminJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Public 데코레이터 확인
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('인증 토큰이 필요합니다');
    }

    try {
      const payload = await this.jwtService.verifyAsync<AdminJwtPayload>(token);

      if (payload.role !== 'ADMIN') {
        throw new UnauthorizedException('관리자 권한이 필요합니다');
      }

      // Request 객체에 사용자 정보 추가
      request['user'] = {
        sub: payload.sub,
        role: payload.role,
      };
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
