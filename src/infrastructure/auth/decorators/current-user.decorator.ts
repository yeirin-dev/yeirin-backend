import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * JWT 인증된 시설 정보
 * - 시설 기반 인증: userId (=facilityId), role='INSTITUTION', facilityType, facilityName, district
 * - 지원 시설 유형: CARE_FACILITY, COMMUNITY_CENTER, EDUCATION_WELFARE_SCHOOL
 */
export interface CurrentUserData {
  userId: string; // facilityId와 동일 (기존 API 호환)
  institutionId: string; // 시설 ID
  facilityType: 'CARE_FACILITY' | 'COMMUNITY_CENTER' | 'EDUCATION_WELFARE_SCHOOL';
  facilityName: string;
  district: string;
  role: 'INSTITUTION';
  isPasswordChanged: boolean;
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
