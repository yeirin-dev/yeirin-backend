import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * 바우처 기관 수정 DTO
 */
export class UpdateInstitutionDto {
  @ApiPropertyOptional({
    description: '센터명',
    example: '서울아동심리상담센터',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  centerName?: string;

  @ApiPropertyOptional({
    description: '대표자명',
    example: '김철수',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  representativeName?: string;

  @ApiPropertyOptional({
    description: '센터 주소',
    example: '서울특별시 강남구 테헤란로 123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({
    description: '개소일 (YYYY-MM-DD)',
    example: '2020-01-15',
  })
  @IsOptional()
  @IsDateString()
  establishedDate?: string;

  @ApiPropertyOptional({
    description: '운영 중인 바우처 목록',
    example: ['CHILD_VOUCHER', 'YOUTH_VOUCHER'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  operatingVouchers?: string[];

  @ApiPropertyOptional({
    description: '품질 인증 여부',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isQualityCertified?: boolean;

  @ApiPropertyOptional({
    description: '수용 가능한 아동 수',
    example: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxCapacity?: number;

  @ApiPropertyOptional({
    description: '센터 한 줄 소개',
    example: 'ADHD 및 정서문제 전문 상담센터',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  introduction?: string;

  @ApiPropertyOptional({
    description: '주요 대상군 1',
    example: 'ADHD',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  primaryTargetGroup?: string;

  @ApiPropertyOptional({
    description: '주요 대상군 2',
    example: '불안장애',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  secondaryTargetGroup?: string;

  @ApiPropertyOptional({
    description: '종합심리검사 가능 여부',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  canProvideComprehensiveTest?: boolean;

  @ApiPropertyOptional({
    description: '제공 서비스 목록',
    example: ['INDIVIDUAL_COUNSELING', 'GROUP_COUNSELING'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  providedServices?: string[];

  @ApiPropertyOptional({
    description: '특수 치료 항목',
    example: ['PLAY_THERAPY', 'ART_THERAPY'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialTreatments?: string[];

  @ApiPropertyOptional({
    description: '보호자 상담 가능 여부',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  canProvideParentCounseling?: boolean;
}
