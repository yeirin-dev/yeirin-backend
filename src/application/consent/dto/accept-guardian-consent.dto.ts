import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { GuardianConsentItemsDto } from './guardian-consent-items.dto';

/**
 * 보호자 동의 제출 요청 DTO
 * - 보호자가 아동을 대신하여 동의할 때 사용
 * - childSelfConsent 항목 없음
 */
export class AcceptGuardianConsentDto {
  @ApiProperty({
    description: '아동 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  childId: string;

  @ApiProperty({
    description: '보호자 동의 항목 (childSelfConsent 제외)',
    type: GuardianConsentItemsDto,
  })
  @ValidateNested()
  @Type(() => GuardianConsentItemsDto)
  consentItems: GuardianConsentItemsDto;

  @ApiProperty({
    description: '보호자 전화번호',
    example: '010-1234-5678',
  })
  @IsString()
  guardianPhone: string;

  @ApiProperty({
    description: '보호자 관계 (부모, 시설담당자, 기타)',
    example: '부모',
  })
  @IsString()
  guardianRelation: string;

  @ApiPropertyOptional({
    description: '동의서 문서 URL',
    example: '/documents/privacy-policy-v1.0.0.pdf',
  })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({
    description: '요청 IP 주소',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}
