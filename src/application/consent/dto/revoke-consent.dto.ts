import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

/**
 * 동의 철회 요청 DTO
 */
export class RevokeConsentDto {
  @ApiProperty({
    description: '철회 사유',
    example: '서비스 이용을 원하지 않음',
    minLength: 1,
  })
  @IsString()
  @MinLength(1, { message: '철회 사유는 필수입니다.' })
  reason: string;

  @ApiPropertyOptional({
    description: '요청 IP 주소',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}
