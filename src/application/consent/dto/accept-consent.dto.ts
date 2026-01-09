import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { ConsentItemsDto } from './consent-items.dto';

/**
 * 동의 제출 요청 DTO
 */
export class AcceptConsentDto {
  @ApiProperty({
    description: '아동 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  childId: string;

  @ApiProperty({
    description: '동의 항목',
    type: ConsentItemsDto,
  })
  @ValidateNested()
  @Type(() => ConsentItemsDto)
  consentItems: ConsentItemsDto;

  @ApiProperty({
    description: '아동이 만 14세 이상인지 여부',
    example: false,
  })
  @IsBoolean()
  isChildOver14: boolean;

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
