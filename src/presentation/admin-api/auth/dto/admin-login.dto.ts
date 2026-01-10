import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Admin 로그인 요청 DTO
 */
export class AdminLoginDto {
  @ApiProperty({
    description: '관리자 비밀번호',
    example: 'admin-secret-password',
  })
  @IsString()
  @MinLength(1)
  password: string;
}

/**
 * Admin 로그인 응답 DTO
 */
export class AdminLoginResponseDto {
  @ApiProperty({
    description: 'JWT 액세스 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;
}
