import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';

/**
 * Admin 전용 메타데이터 키
 */
export const ADMIN_ONLY_KEY = 'adminOnly';

/**
 * @AdminOnly() 데코레이터
 * - ADMIN 역할만 접근 가능한 엔드포인트 표시
 * - Swagger 문서에 인증 정보 자동 추가
 *
 * @example
 * ```typescript
 * @AdminOnly()
 * @Get('users')
 * async getUsers() { ... }
 * ```
 */
export function AdminOnly() {
  return applyDecorators(
    SetMetadata(ADMIN_ONLY_KEY, true),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: '인증이 필요합니다' }),
    ApiForbiddenResponse({ description: 'ADMIN 권한이 필요합니다' }),
  );
}
