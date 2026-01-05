import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AdminPermission } from '../types/admin-permission.type';

/**
 * Admin Permission 메타데이터 키
 */
export const ADMIN_PERMISSIONS_KEY = 'adminPermissions';

/**
 * @AdminPermissions() 데코레이터
 * - 세분화된 권한 기반 접근 제어
 * - 여러 권한 지정 시 OR 조건 (하나라도 있으면 통과)
 *
 * @param permissions - 필요한 권한 목록 (OR 조건)
 *
 * @example
 * ```typescript
 * // 단일 권한
 * @AdminPermissions('user:read')
 * async getUsers() { ... }
 *
 * // 복수 권한 (OR 조건)
 * @AdminPermissions('user:ban', 'user:deactivate')
 * async banUser() { ... }
 * ```
 */
export function AdminPermissions(...permissions: AdminPermission[]) {
  return applyDecorators(
    SetMetadata(ADMIN_PERMISSIONS_KEY, permissions),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: '인증이 필요합니다' }),
    ApiForbiddenResponse({
      description: `다음 권한 중 하나가 필요합니다: ${permissions.join(', ')}`,
    }),
  );
}

/**
 * 모든 권한이 필요한 경우 사용
 */
export const ADMIN_PERMISSIONS_ALL_KEY = 'adminPermissionsAll';

/**
 * @AdminPermissionsAll() 데코레이터
 * - 지정된 모든 권한을 가져야 접근 가능 (AND 조건)
 *
 * @param permissions - 필요한 권한 목록 (AND 조건)
 *
 * @example
 * ```typescript
 * @AdminPermissionsAll('user:read', 'user:update')
 * async updateUser() { ... }
 * ```
 */
export function AdminPermissionsAll(...permissions: AdminPermission[]) {
  return applyDecorators(
    SetMetadata(ADMIN_PERMISSIONS_ALL_KEY, permissions),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: '인증이 필요합니다' }),
    ApiForbiddenResponse({
      description: `다음 모든 권한이 필요합니다: ${permissions.join(', ')}`,
    }),
  );
}
