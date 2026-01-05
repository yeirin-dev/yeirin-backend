import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * JWT 인증된 사용자 정보
 * - 사용자 기반 인증: userId, email, role
 * - 시설 기반 인증: userId (=facilityId), role='INSTITUTION', facilityType, facilityName, district
 */
export interface CurrentUserData {
  userId: string;
  email?: string; // 사용자 기반 인증에서만 존재
  role: string;
  institutionId?: string; // 시설 ID (시설 기반 인증에서 사용)
  facilityType?: 'CARE_FACILITY' | 'COMMUNITY_CENTER'; // 시설 기반 인증
  facilityName?: string; // 시설명 (시설 기반 인증)
  district?: string; // 구/군 (시설 기반 인증)
  isPasswordChanged?: boolean; // 첫 로그인 비밀번호 변경 여부 (시설 기반 인증)
}

/**
 * 현재 인증된 사용자 정보를 추출하는 데코레이터
 *
 * @example
 * // 전체 사용자 정보
 * @CurrentUser() user: CurrentUserData
 *
 * // 특정 속성만 추출
 * @CurrentUser('userId') userId: string
 * @CurrentUser('email') email: string
 * @CurrentUser('role') role: string
 */
export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData;

    // 특정 속성만 요청한 경우
    if (data) {
      return user?.[data];
    }

    // 전체 user 객체 반환
    return user;
  },
);
