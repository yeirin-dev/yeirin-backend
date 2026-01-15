import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import {
  FacilityType,
  FacilityTypeDisplayName,
} from '@application/auth/dto/institution-auth.dto';

/**
 * 파트너 기관 정보 DTO (Landing 페이지용)
 */
export class PartnerDto {
  @ApiProperty({ description: '기관 ID (UUID)' })
  id: string;

  @ApiProperty({ description: '기관명', example: '마루돌봄센터' })
  name: string;

  @ApiProperty({ description: '기관 유형', enum: FacilityType })
  facilityType: FacilityType;

  @ApiProperty({
    description: '기관 유형 표시명',
    example: '양육시설/그룹홈',
  })
  facilityTypeDisplayName: string;

  @ApiProperty({ description: '구/군', example: '해운대구' })
  district: string;

  @ApiPropertyOptional({ description: '연락처', example: '051-123-4567' })
  phoneNumber: string | null;

  @ApiProperty({ description: '주소', example: '부산광역시 해운대구 센텀중앙로 78' })
  address: string;
}

/**
 * 카테고리별 기관 수 DTO
 */
export class CategoryCountDto {
  @ApiProperty({ description: '기관 유형', enum: FacilityType })
  facilityType: FacilityType;

  @ApiProperty({ description: '표시명', example: '양육시설/그룹홈' })
  label: string;

  @ApiProperty({ description: '기관 수', example: 12 })
  count: number;
}

/**
 * 파트너 목록 응답 DTO
 */
export class PartnerListResponseDto {
  @ApiProperty({ description: '파트너 목록', type: [PartnerDto] })
  partners: PartnerDto[];

  @ApiProperty({ description: '전체 기관 수', example: 35 })
  total: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 10 })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수', example: 4 })
  totalPages: number;

  @ApiProperty({ description: '카테고리별 기관 수', type: [CategoryCountDto] })
  categoryCounts: CategoryCountDto[];

  @ApiProperty({
    description: '사용 가능한 구/군 목록',
    type: [String],
    example: ['강서구', '금정구', '남구'],
  })
  availableDistricts: string[];
}

/**
 * 파트너 목록 조회 쿼리 DTO
 */
export class PartnerQueryDto {
  @ApiPropertyOptional({ description: '페이지 번호', default: 1, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지당 항목 수', default: 10, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: '기관 유형 필터',
    enum: FacilityType,
  })
  @IsEnum(FacilityType)
  @IsOptional()
  facilityType?: FacilityType;

  @ApiPropertyOptional({ description: '구/군 필터', example: '해운대구' })
  @IsString()
  @IsOptional()
  district?: string;
}

// Re-export for convenience
export { FacilityType, FacilityTypeDisplayName };
