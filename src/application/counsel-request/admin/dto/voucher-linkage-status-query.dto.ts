import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { AdminDateRangeQueryDto } from '@yeirin/admin-common';
import { ChildType } from '@infrastructure/persistence/typeorm/entity/enums/child-type.enum';
import { VoucherLinkageStatus } from '@infrastructure/persistence/typeorm/entity/enums/voucher-linkage-status.enum';

/**
 * 연계현황 조회 Query DTO
 * 보호자 제출 정보 + 선택 기관 추적용
 */
export class VoucherLinkageStatusQueryDto extends AdminDateRangeQueryDto {
  @ApiPropertyOptional({
    description: '검색어 (아동명, 기관명)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: '구/군 필터',
    example: '해운대구',
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({
    description: '시설 구분 (아동 유형)',
    enum: ChildType,
  })
  @IsOptional()
  @IsEnum(ChildType)
  childType?: ChildType;

  @ApiPropertyOptional({
    description: '연계 상태',
    enum: VoucherLinkageStatus,
  })
  @IsOptional()
  @IsEnum(VoucherLinkageStatus)
  status?: VoucherLinkageStatus;

  @ApiPropertyOptional({
    description: '연계정보 제출 여부',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  linkageInfoSubmitted?: boolean;

  @ApiPropertyOptional({
    description: '플랫폼 연계 희망 여부',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  wantsPlatformLinkage?: boolean;
}
