import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/**
 * 동의 항목 DTO
 */
export class ConsentItemsDto {
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

  @ApiProperty({
    description: '(14세 이상 필수) 아동 본인 동의',
    example: false,
  })
  @IsBoolean()
  childSelfConsent: boolean;
}
