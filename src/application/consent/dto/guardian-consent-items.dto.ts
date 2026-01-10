import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/**
 * 보호자 동의 항목 DTO
 * - childSelfConsent 제외 (보호자는 아동 본인 동의를 할 수 없음)
 */
export class GuardianConsentItemsDto {
  @ApiProperty({
    description: '(필수) 개인정보 수집·이용 및 제3자 제공 동의',
    example: true,
  })
  @IsBoolean()
  personalInfo: boolean;

  @ApiProperty({
    description: '(필수) 민감정보 처리 동의',
    example: true,
  })
  @IsBoolean()
  sensitiveData: boolean;

  @ApiProperty({
    description: '(선택) 비식별화 데이터 연구 활용 동의',
    example: false,
  })
  @IsBoolean()
  researchData: boolean;
}
