import { IsOptional, IsString, IsBoolean, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 기관 목록 조회 쿼리 DTO
 */
export class InstitutionQueryDto {
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

  @ApiPropertyOptional({ description: '검색어 (기관명)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '구/군' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: '권역 (지역아동센터 전용)' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: '활성화 상태' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}

/**
 * 비밀번호 재설정 응답 DTO
 */
export class PasswordResetResponseDto {
  @ApiPropertyOptional({ description: '임시 비밀번호' })
  temporaryPassword: string;

  @ApiPropertyOptional({ description: '만료 시간' })
  expiresAt: string;
}
