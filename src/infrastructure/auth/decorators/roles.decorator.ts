import { SetMetadata } from '@nestjs/common';

/**
 * 사용자 역할 정의
 */
export type UserRole = 'GUARDIAN' | 'INSTITUTION_ADMIN' | 'COUNSELOR' | 'ADMIN';

/**
 * 역할 메타데이터 키
 */
export const ROLES_KEY = 'roles';

/**
 * @Roles() 데코레이터
 * - 특정 역할만 접근 가능한 엔드포인트 지정
 * - RolesGuard와 함께 사용
 *
 * @example
 * ```typescript
 * @Roles('ADMIN')
 * @Get('admin-only')
 * adminOnly() { ... }
 *
 * @Roles('ADMIN', 'COUNSELOR')
 * @Get('admin-or-counselor')
 * adminOrCounselor() { ... }
 * ```
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
