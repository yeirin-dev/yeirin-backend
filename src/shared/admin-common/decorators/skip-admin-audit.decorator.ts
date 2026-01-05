import { SetMetadata } from '@nestjs/common';

/**
 * Skip Admin Audit 메타데이터 키
 */
export const SKIP_ADMIN_AUDIT_KEY = 'skipAdminAudit';

/**
 * @SkipAdminAudit() 데코레이터
 * - 해당 엔드포인트의 감사 로깅 건너뛰기
 * - 주로 단순 조회(READ) API에 사용
 * - 통계, 목록 조회 등 빈번한 호출에 적용
 *
 * @example
 * ```typescript
 * @SkipAdminAudit()
 * @Get('statistics')
 * async getStatistics() { ... }
 *
 * @SkipAdminAudit()
 * @Get('users')
 * async getUsers() { ... }
 * ```
 */
export function SkipAdminAudit() {
  return SetMetadata(SKIP_ADMIN_AUDIT_KEY, true);
}
