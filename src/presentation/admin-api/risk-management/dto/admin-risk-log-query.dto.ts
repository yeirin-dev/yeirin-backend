import { IsOptional, IsString, IsInt, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PsychologicalStatus } from '@infrastructure/persistence/typeorm/entity/enums/psychological-status.enum';

export class AdminRiskLogQueryDto {
  @ApiPropertyOptional({ description: '아동 이름 검색' })
  @IsOptional()
  @IsString()
  childName?: string;

  @ApiPropertyOptional({ description: '변경 후 상태 필터', enum: PsychologicalStatus })
  @IsOptional()
  @IsEnum(PsychologicalStatus)
  newStatus?: PsychologicalStatus;

  @ApiPropertyOptional({ description: '출처 필터', enum: ['SOUL_E', 'COUNSELOR', 'SYSTEM'] })
  @IsOptional()
  @IsString()
  source?: 'SOUL_E' | 'COUNSELOR' | 'SYSTEM';

  @ApiPropertyOptional({ description: '시작 날짜 (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: '종료 날짜 (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ description: '위험도 상승만 보기' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  escalationOnly?: boolean;

  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지 당 항목 수', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
