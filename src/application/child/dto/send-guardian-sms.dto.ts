import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

/**
 * 보호자 동의 SMS 발송 요청 DTO
 */
export class SendGuardianSmsDto {
  @ApiProperty({
    description: '보호자 전화번호',
    example: '010-1234-5678',
  })
  @IsNotEmpty({ message: '보호자 전화번호는 필수입니다.' })
  @IsString()
  @Matches(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, {
    message: '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)',
  })
  guardianPhone: string;

  @ApiProperty({
    description: '보호자 이름',
    example: '홍길동',
  })
  @IsNotEmpty({ message: '보호자 이름은 필수입니다.' })
  @IsString()
  guardianName: string;
}

/**
 * 보호자 동의 SMS 발송 응답 DTO
 */
export class SendGuardianSmsResponseDto {
  @ApiProperty({
    description: '발송 성공 여부',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '응답 메시지',
    example: '보호자 동의 요청 문자가 발송되었습니다.',
  })
  message: string;

  @ApiProperty({
    description: '동의 페이지 URL (개발 환경에서만 노출)',
    example: 'https://soul-e.yeirin.kr/consent/guardian/xxx',
    required: false,
  })
  consentUrl?: string;
}
