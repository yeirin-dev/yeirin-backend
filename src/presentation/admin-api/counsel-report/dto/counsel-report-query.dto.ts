import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { ReportStatus } from '@domain/counsel-report/model/value-objects/report-status';

/**
 * 상담보고서 목록 조회 쿼리 DTO
 */
export class CounselReportQueryDto {
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

  @ApiPropertyOptional({ description: '상담의뢰 ID' })
  @IsOptional()
  @IsString()
  counselRequestId?: string;

  @ApiPropertyOptional({ description: '아동 ID' })
  @IsOptional()
  @IsString()
  childId?: string;

  @ApiPropertyOptional({ description: '보고서 상태', enum: ReportStatus })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}

/**
 * 상담보고서 상태 변경 DTO
 */
export class UpdateReportStatusDto {
  @ApiProperty({ description: '변경할 상태', enum: ReportStatus })
  @IsEnum(ReportStatus)
  status: ReportStatus;
}
