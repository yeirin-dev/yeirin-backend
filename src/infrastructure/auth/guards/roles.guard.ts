import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, UserRole } from '../decorators/roles.decorator';

/**
 * Roles Guard
 * - RBAC (Role-Based Access Control) 구현
 * - @Roles() 데코레이터와 함께 사용
 * - 빅테크 스타일: 세분화된 권한 관리, 감사 로깅
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger('RolesGuard');

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Admin API는 별도 AdminPermissionGuard 사용 - 글로벌 RolesGuard 스킵
    if (request.path?.startsWith('/admin')) {
      return true;
    }

    // 메타데이터에서 필요한 역할 추출
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // @Roles() 데코레이터가 없으면 통과
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 요청에서 사용자 정보 추출
    const user = request.user;

    // 사용자 정보 없음 (JwtAuthGuard가 먼저 실행되어야 함)
    if (!user) {
      this.logger.warn({
        type: 'access_denied',
        reason: 'no_user_context',
        path: request.url,
        method: request.method,
        requestId: request.requestId,
      });
      throw new ForbiddenException('접근 권한이 없습니다');
    }

    // 역할 확인
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      this.logger.warn({
        type: 'access_denied',
        reason: 'insufficient_role',
        userId: user.userId,
        userRole: user.role,
        requiredRoles,
        path: request.url,
        method: request.method,
        requestId: request.requestId,
      });
      throw new ForbiddenException(`이 작업은 ${requiredRoles.join(' 또는 ')} 권한이 필요합니다`);
    }

    // 접근 허용 로그
    this.logger.debug({
      type: 'access_granted',
      userId: user.userId,
      userRole: user.role,
      requiredRoles,
      path: request.url,
      method: request.method,
      requestId: request.requestId,
    });

    return true;
  }
}
