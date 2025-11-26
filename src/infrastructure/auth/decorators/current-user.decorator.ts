import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * JWT 인증된 사용자 정보
 */
export interface CurrentUserData {
  userId: string;
  email: string;
  role: string;
  institutionId?: string; // CounselorProfile 등에서 추가될 수 있음
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
