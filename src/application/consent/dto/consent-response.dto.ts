import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsentItemsDto } from './consent-items.dto';

/**
 * 동의 정보 응답 DTO
 */
export class ConsentResponseDto {
  @ApiProperty({
    description: '동의 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '아동 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  childId: string;

  @ApiProperty({
    description: '동의 항목',
    type: ConsentItemsDto,
  })
  consentItems: ConsentItemsDto;

  @ApiProperty({
    description: '동의서 버전',
    example: '1.0.0',
  })
  consentVersion: string;

  @ApiPropertyOptional({
    description: '동의서 문서 URL',
    example: '/documents/privacy-policy-v1.0.0.pdf',
  })
  documentUrl: string | null;

  @ApiProperty({
    description: '유효한 동의 여부',
    example: true,
  })
  hasValidConsent: boolean;

  @ApiProperty({
    description: '동의 시각',
    example: '2024-01-01T00:00:00.000Z',
  })
  consentedAt: Date;

  @ApiPropertyOptional({
    description: '철회 시각',
    example: null,
  })
  revokedAt: Date | null;

  @ApiPropertyOptional({
    description: '철회 사유',
    example: null,
  })
  revocationReason: string | null;

  @ApiProperty({
    description: '생성 시각',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 시각',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

/**
 * 동의 상태 조회 응답 DTO
 */
export class ConsentStatusResponseDto {
  @ApiProperty({
    description: '동의 여부',
    example: true,
  })
  hasConsent: boolean;

  @ApiPropertyOptional({
    description: '동의 항목 (동의가 없으면 null)',
    type: ConsentItemsDto,
  })
  consentItems: ConsentItemsDto | null;

  @ApiPropertyOptional({
    description: '동의서 버전 (동의가 없으면 null)',
    example: '1.0.0',
  })
  consentVersion: string | null;

  @ApiPropertyOptional({
    description: '동의 시각 (동의가 없으면 null)',
    example: '2024-01-01T00:00:00.000Z',
  })
  consentedAt: Date | null;

  @ApiProperty({
    description: '유효한 동의 여부 (철회되지 않고 필수 항목 동의됨)',
    example: true,
  })
  isValid: boolean;
}
