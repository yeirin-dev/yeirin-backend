import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { CounselRequestStatus } from '@domain/counsel-request/model/value-objects/counsel-request-enums';

/**
 * 페이지네이션 Query DTO (필터 포함)
 */
export class PaginationQueryDto {
  @ApiProperty({
    description: '페이지 번호 (1부터 시작)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: '페이지당 항목 수',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: '상태별 필터링 (선택)',
    enum: CounselRequestStatus,
    required: false,
    example: 'PENDING',
  })
  @IsOptional()
  @IsEnum(CounselRequestStatus)
  status?: CounselRequestStatus;
}
