import { SetMetadata } from '@nestjs/common';

/**
 * Audit Action 메타데이터 키
 */
export const AUDIT_ACTION_KEY = 'auditAction';

/**
 * 감사 로그 액션 타입
 */
export type AuditActionType =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PERMISSION_CHANGE'
  | 'STATUS_CHANGE'
  | 'EXPORT'
  | 'IMPORT'
  | 'BAN'
  | 'UNBAN'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'FORCE_STATUS_CHANGE'
  | 'BULK_OPERATION';

/**
 * 감사 로그 메타데이터 인터페이스
 */
export interface AuditActionMeta {
  /** 액션 타입 */
  action: AuditActionType;
  /** 대상 엔티티 타입 */
  entityType: string;
  /** 감사 로그 중요도 (HIGH: 즉시 기록, NORMAL: 배치 처리) */
  level?: 'HIGH' | 'NORMAL';
  /** 추가 설명 */
  description?: string;
}

/**
 * @AuditAction() 데코레이터
 * - Admin 작업에 대한 감사 로그 메타데이터 설정
 * - AdminAuditInterceptor와 함께 사용
 *
 * @param action - 액션 타입
 * @param entityType - 대상 엔티티 타입
 * @param options - 추가 옵션 (level, description)
 *
 * @example
 * ```typescript
 * @AuditAction('STATUS_CHANGE', 'CounselRequest')
 * async updateStatus() { ... }
 *
 * @AuditAction('BAN', 'User', { level: 'HIGH', description: '사용자 정지' })
 * async banUser() { ... }
 * ```
 */
export function AuditAction(
  action: AuditActionType,
  entityType: string,
  options?: Partial<Pick<AuditActionMeta, 'level' | 'description'>>,
) {
  const meta: AuditActionMeta = {
    action,
    entityType,
    level: options?.level ?? 'HIGH',
    description: options?.description,
  };

  return SetMetadata(AUDIT_ACTION_KEY, meta);
}
