import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_ONLY_KEY } from '../decorators/admin-only.decorator';
import {
  ADMIN_PERMISSIONS_KEY,
  ADMIN_PERMISSIONS_ALL_KEY,
} from '../decorators/admin-permissions.decorator';
import {
  AdminPermission,
  hasAnyPermission,
  hasAllPermissions,
  ROLE_PERMISSIONS,
} from '../types/admin-permission.type';

/**
 * JWT에서 추출된 사용자 정보 인터페이스
 */
export interface AdminUserContext {
  userId: string;
  email: string;
  role: string;
  institutionId?: string;
}

/**
 * Admin Permission Guard
 * - @AdminOnly(), @AdminPermissions(), @AdminPermissionsAll() 데코레이터와 함께 사용
 * - Role 기반 + Permission 기반 접근 제어
 * - 모든 접근 시도 로깅 (감사 추적)
 *
 * @example
 * ```typescript
 * // Controller 레벨에서 Guard 적용
 * @UseGuards(AdminPermissionGuard)
 * @Controller('admin/users')
 * export class AdminUserController { ... }
 * ```
 */
@Injectable()
export class AdminPermissionGuard implements CanActivate {
  private readonly logger = new Logger('AdminPermissionGuard');

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AdminUserContext | undefined;

    // 1. 인증 확인
    if (!user) {
      this.logAccessDenied(request, 'no_user_context', undefined);
      throw new UnauthorizedException('인증이 필요합니다');
    }

    // 2. @AdminOnly() 체크
    const isAdminOnly = this.reflector.getAllAndOverride<boolean>(ADMIN_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isAdminOnly && user.role !== 'ADMIN') {
      this.logAccessDenied(request, 'admin_only_violation', user);
      throw new ForbiddenException('ADMIN 권한이 필요합니다');
    }

    // 3. @AdminPermissions() 체크 (OR 조건)
    const requiredPermissions = this.reflector.getAllAndOverride<AdminPermission[]>(
      ADMIN_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredPermissions && requiredPermissions.length > 0) {
      if (!hasAnyPermission(user.role, requiredPermissions)) {
        this.logAccessDenied(request, 'insufficient_permission', user, requiredPermissions);
        throw new ForbiddenException(
          `다음 권한 중 하나가 필요합니다: ${requiredPermissions.join(', ')}`,
        );
      }
    }

    // 4. @AdminPermissionsAll() 체크 (AND 조건)
    const requiredAllPermissions = this.reflector.getAllAndOverride<AdminPermission[]>(
      ADMIN_PERMISSIONS_ALL_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredAllPermissions && requiredAllPermissions.length > 0) {
      if (!hasAllPermissions(user.role, requiredAllPermissions)) {
        this.logAccessDenied(request, 'insufficient_all_permissions', user, requiredAllPermissions);
        throw new ForbiddenException(
          `다음 모든 권한이 필요합니다: ${requiredAllPermissions.join(', ')}`,
        );
      }
    }

    // 5. 접근 허용 로그
    this.logAccessGranted(request, user, requiredPermissions || requiredAllPermissions);

    return true;
  }

  /**
   * 접근 거부 로그
   */
  private logAccessDenied(
    request: { url: string; method: string; requestId?: string; ip?: string },
    reason: string,
    user?: AdminUserContext,
    requiredPermissions?: AdminPermission[],
  ): void {
    this.logger.warn({
      type: 'admin_access_denied',
      reason,
      userId: user?.userId,
      userRole: user?.role,
      requiredPermissions,
      userPermissions: user?.role ? ROLE_PERMISSIONS[user.role] : undefined,
      path: request.url,
      method: request.method,
      requestId: request.requestId,
      ipAddress: request.ip,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 접근 허용 로그
   */
  private logAccessGranted(
    request: { url: string; method: string; requestId?: string; ip?: string },
    user: AdminUserContext,
    usedPermissions?: AdminPermission[],
  ): void {
    this.logger.debug({
      type: 'admin_access_granted',
      userId: user.userId,
      userEmail: user.email,
      userRole: user.role,
      usedPermissions,
      path: request.url,
      method: request.method,
      requestId: request.requestId,
      ipAddress: request.ip,
      timestamp: new Date().toISOString(),
    });
  }
}
