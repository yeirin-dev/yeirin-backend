import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Public 데코레이터 확인
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Admin API는 별도 AdminJwtAuthGuard 사용 - 글로벌 가드 스킵
    const request = context.switchToHttp().getRequest<Request>();
    if (request.path.startsWith('/admin')) {
      return true;
    }

    return super.canActivate(context);
  }
}
