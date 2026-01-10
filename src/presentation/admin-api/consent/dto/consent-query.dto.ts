import { IsOptional, IsString, IsBoolean, IsInt, Min, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { ConsentRole } from '@infrastructure/persistence/typeorm/entity/enums/consent-role.enum';

/**
 * 동의 목록 조회 쿼리 DTO
 */
export class ConsentQueryDto {
  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지당 항목 수', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: '아동 ID' })
  @IsOptional()
  @IsString()
  childId?: string;

  @ApiPropertyOptional({ description: '기관 ID' })
  @IsOptional()
  @IsString()
  institutionId?: string;

  @ApiPropertyOptional({ description: '동의 역할', enum: ConsentRole })
  @IsOptional()
  @IsEnum(ConsentRole)
  role?: ConsentRole;

  @ApiPropertyOptional({ description: '철회됨 필터' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isRevoked?: boolean;
}

/**
 * 동의 철회 요청 DTO
 */
export class RevokeConsentDto {
  @ApiProperty({ description: '철회 사유' })
  @IsString()
  reason: string;
}
