/**
 * Admin Permission Types
 * Resource:Action 형식의 세분화된 권한 체계
 */

/**
 * 관리 대상 리소스
 */
export type AdminResource =
  | 'user'
  | 'counsel-request'
  | 'counsel-report'
  | 'institution'
  | 'counselor'
  | 'child'
  | 'review'
  | 'audit-log'
  | 'statistics'
  | 'system';

/**
 * 액션 타입
 */
export type AdminAction =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'ban'
  | 'activate'
  | 'deactivate'
  | 'update:status'
  | 'export'
  | 'manage';

/**
 * Permission 문자열 타입 (resource:action 형식)
 */
export type AdminPermission = `${AdminResource}:${AdminAction}`;

/**
 * 미리 정의된 Admin 권한 상수
 */
export const ADMIN_PERMISSIONS = {
  // User Management
  USER_READ: 'user:read' as AdminPermission,
  USER_CREATE: 'user:create' as AdminPermission,
  USER_UPDATE: 'user:update' as AdminPermission,
  USER_DELETE: 'user:delete' as AdminPermission,
  USER_BAN: 'user:ban' as AdminPermission,
  USER_ACTIVATE: 'user:activate' as AdminPermission,
  USER_DEACTIVATE: 'user:deactivate' as AdminPermission,

  // Counsel Request Management
  COUNSEL_REQUEST_READ: 'counsel-request:read' as AdminPermission,
  COUNSEL_REQUEST_UPDATE: 'counsel-request:update' as AdminPermission,
  COUNSEL_REQUEST_UPDATE_STATUS: 'counsel-request:update:status' as AdminPermission,
  COUNSEL_REQUEST_DELETE: 'counsel-request:delete' as AdminPermission,

  // Counsel Report Management
  COUNSEL_REPORT_READ: 'counsel-report:read' as AdminPermission,
  COUNSEL_REPORT_UPDATE: 'counsel-report:update' as AdminPermission,
  COUNSEL_REPORT_DELETE: 'counsel-report:delete' as AdminPermission,

  // Institution Management
  INSTITUTION_READ: 'institution:read' as AdminPermission,
  INSTITUTION_CREATE: 'institution:create' as AdminPermission,
  INSTITUTION_UPDATE: 'institution:update' as AdminPermission,
  INSTITUTION_DELETE: 'institution:delete' as AdminPermission,
  INSTITUTION_ACTIVATE: 'institution:activate' as AdminPermission,
  INSTITUTION_DEACTIVATE: 'institution:deactivate' as AdminPermission,

  // Counselor Management
  COUNSELOR_READ: 'counselor:read' as AdminPermission,
  COUNSELOR_UPDATE: 'counselor:update' as AdminPermission,
  COUNSELOR_ACTIVATE: 'counselor:activate' as AdminPermission,
  COUNSELOR_DEACTIVATE: 'counselor:deactivate' as AdminPermission,

  // Child Management
  CHILD_READ: 'child:read' as AdminPermission,
  CHILD_UPDATE: 'child:update' as AdminPermission,

  // Review Management
  REVIEW_READ: 'review:read' as AdminPermission,
  REVIEW_DELETE: 'review:delete' as AdminPermission,

  // Audit Log
  AUDIT_LOG_READ: 'audit-log:read' as AdminPermission,
  AUDIT_LOG_EXPORT: 'audit-log:export' as AdminPermission,

  // Statistics
  STATISTICS_READ: 'statistics:read' as AdminPermission,

  // System
  SYSTEM_MANAGE: 'system:manage' as AdminPermission,
} as const;

/**
 * 역할별 기본 권한 매핑
 * ADMIN은 모든 권한 보유
 */
export const ROLE_PERMISSIONS: Record<string, AdminPermission[]> = {
  ADMIN: Object.values(ADMIN_PERMISSIONS),
  INSTITUTION_ADMIN: [
    ADMIN_PERMISSIONS.USER_READ,
    ADMIN_PERMISSIONS.COUNSEL_REQUEST_READ,
    ADMIN_PERMISSIONS.COUNSEL_REPORT_READ,
    ADMIN_PERMISSIONS.INSTITUTION_READ,
    ADMIN_PERMISSIONS.COUNSELOR_READ,
    ADMIN_PERMISSIONS.COUNSELOR_UPDATE,
    ADMIN_PERMISSIONS.CHILD_READ,
    ADMIN_PERMISSIONS.STATISTICS_READ,
  ],
  COUNSELOR: [
    ADMIN_PERMISSIONS.COUNSEL_REQUEST_READ,
    ADMIN_PERMISSIONS.COUNSEL_REPORT_READ,
    ADMIN_PERMISSIONS.CHILD_READ,
  ],
};

/**
 * Permission 검증 유틸리티
 */
export function hasPermission(userRole: string, requiredPermission: AdminPermission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(requiredPermission);
}

/**
 * 여러 권한 중 하나라도 보유하는지 검증
 */
export function hasAnyPermission(
  userRole: string,
  requiredPermissions: AdminPermission[],
): boolean {
  return requiredPermissions.some((permission) => hasPermission(userRole, permission));
}

/**
 * 모든 권한을 보유하는지 검증
 */
export function hasAllPermissions(
  userRole: string,
  requiredPermissions: AdminPermission[],
): boolean {
  return requiredPermissions.every((permission) => hasPermission(userRole, permission));
}
