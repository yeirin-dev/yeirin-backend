import { ApiProperty } from '@nestjs/swagger';

/**
 * 인증 응답 DTO (로그인/회원가입 공통)
 */
export class AuthResponseDto {
  @ApiProperty({ description: '액세스 토큰' })
  accessToken: string;

  @ApiProperty({ description: '리프레시 토큰' })
  refreshToken: string;

  @ApiProperty({ description: '사용자 정보' })
  user: {
    id: string;
    email: string;
    realName: string;
    role: string;
  };
}
