import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  CounselRequestStatus,
  CareType,
} from '@domain/counsel-request/model/value-objects/counsel-request-enums';
import { VoucherLinkageStatus } from '@domain/voucher-linkage/model/voucher-linkage';
import { AdminDateRangeQueryDto } from '@yeirin/admin-common';

/**
 * Admin 상담의뢰 목록 조회 쿼리 DTO
 */
export class AdminCounselRequestQueryDto extends AdminDateRangeQueryDto {
  @ApiPropertyOptional({ description: '검색어 (센터명, 아동명)', example: '행복' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '구/군 필터', example: '해운대구' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: '상태 필터', enum: CounselRequestStatus })
  @IsOptional()
  @IsEnum(CounselRequestStatus)
  status?: CounselRequestStatus;

  @ApiPropertyOptional({ description: '돌봄 유형 필터', enum: CareType })
  @IsOptional()
  @IsEnum(CareType)
  careType?: CareType;

  @ApiPropertyOptional({ description: '기관 ID 필터' })
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional({ description: '상담사 ID 필터' })
  @IsOptional()
  @IsUUID()
  counselorId?: string;

  @ApiPropertyOptional({ description: '바우처 추천대상 여부 필터', example: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isVoucherEligible?: boolean;

  @ApiPropertyOptional({
    description: '바우처 연계 상태 필터',
    enum: VoucherLinkageStatus,
    example: VoucherLinkageStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(VoucherLinkageStatus)
  voucherLinkageStatus?: VoucherLinkageStatus;
}
