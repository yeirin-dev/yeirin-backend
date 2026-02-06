import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { VoucherLinkageStatus } from '@domain/voucher-linkage/model/voucher-linkage';

/**
 * 바우처 연계 생성 DTO
 */
export class CreateVoucherLinkageDto {
  @ApiPropertyOptional({ description: '비고', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

/**
 * 바우처 연계 완료 DTO (PENDING → COMPLETED)
 */
export class CompleteVoucherLinkageDto {
  @ApiProperty({ description: '연계 기관명', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  linkedInstitutionName: string;

  @ApiPropertyOptional({ description: '연계 기관 연락처', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  linkedInstitutionPhone?: string;

  @ApiPropertyOptional({ description: '연계 기관 주소', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkedInstitutionAddress?: string;

  @ApiPropertyOptional({ description: '담당 상담사명', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  linkedCounselorName?: string;

  @ApiPropertyOptional({ description: '연계 완료일 (ISO 8601)', example: '2024-01-15T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  linkedAt?: string;

  @ApiPropertyOptional({ description: '비고', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

/**
 * 바우처 연계 정보 수정 DTO
 */
export class UpdateVoucherLinkageDto {
  @ApiPropertyOptional({ description: '연계 상태', enum: VoucherLinkageStatus })
  @IsOptional()
  @IsEnum(VoucherLinkageStatus)
  status?: VoucherLinkageStatus;

  @ApiPropertyOptional({ description: '연계 기관명', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  linkedInstitutionName?: string;

  @ApiPropertyOptional({ description: '연계 기관 연락처', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  linkedInstitutionPhone?: string;

  @ApiPropertyOptional({ description: '연계 기관 주소', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkedInstitutionAddress?: string;

  @ApiPropertyOptional({ description: '담당 상담사명', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  linkedCounselorName?: string;

  @ApiPropertyOptional({ description: '연계 완료일 (ISO 8601)', example: '2024-01-15T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  linkedAt?: string;

  @ApiPropertyOptional({ description: '비고', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
