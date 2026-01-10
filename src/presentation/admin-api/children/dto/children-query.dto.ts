import { IsOptional, IsString, IsBoolean, IsInt, Min, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PsychologicalStatus } from '@infrastructure/persistence/typeorm/entity/enums/psychological-status.enum';

/**
 * 아동 목록 조회 쿼리 DTO
 */
export class ChildrenQueryDto {
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

  @ApiPropertyOptional({ description: '검색어 (아동 이름)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '기관 유형 (CARE_FACILITY, COMMUNITY_CENTER)' })
  @IsOptional()
  @IsString()
  institutionType?: string;

  @ApiPropertyOptional({ description: '기관 ID' })
  @IsOptional()
  @IsString()
  institutionId?: string;

  @ApiPropertyOptional({ description: '심리 상태', enum: PsychologicalStatus })
  @IsOptional()
  @IsEnum(PsychologicalStatus)
  psychologicalStatus?: PsychologicalStatus;

  @ApiPropertyOptional({ description: '유효한 동의 보유 여부' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasValidConsent?: boolean;
}
