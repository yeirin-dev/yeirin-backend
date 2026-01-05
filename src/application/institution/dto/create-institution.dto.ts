import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * 바우처 기관 생성 DTO
 */
export class CreateInstitutionDto {
  @ApiProperty({
    description: '기관 대표 User ID (INSTITUTION_ADMIN 역할)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: '센터명',
    example: '서울아동심리상담센터',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  centerName: string;

  @ApiProperty({
    description: '대표자명',
    example: '김철수',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  representativeName: string;

  @ApiProperty({
    description: '센터 주소',
    example: '서울특별시 강남구 테헤란로 123',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address: string;

  @ApiProperty({
    description: '개소일 (YYYY-MM-DD)',
    example: '2020-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  establishedDate: string;

  @ApiProperty({
    description: '운영 중인 바우처 목록',
    example: ['CHILD_VOUCHER', 'YOUTH_VOUCHER'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  operatingVouchers: string[];

  @ApiProperty({
    description: '품질 인증 여부',
    example: false,
    default: false,
  })
  @IsBoolean()
  isQualityCertified: boolean;

  @ApiProperty({
    description: '수용 가능한 아동 수',
    example: 30,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  maxCapacity: number;

  @ApiProperty({
    description: '센터 한 줄 소개',
    example: 'ADHD 및 정서문제 전문 상담센터',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  introduction: string;

  @ApiProperty({
    description: '주요 대상군 1',
    example: 'ADHD',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  primaryTargetGroup: string;

  @ApiProperty({
    description: '주요 대상군 2 (선택)',
    example: '불안장애',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  secondaryTargetGroup?: string;

  @ApiProperty({
    description: '종합심리검사 가능 여부',
    example: true,
    default: false,
  })
  @IsBoolean()
  canProvideComprehensiveTest: boolean;

  @ApiProperty({
    description: '제공 서비스 목록',
    example: ['INDIVIDUAL_COUNSELING', 'GROUP_COUNSELING', 'PSYCHOLOGICAL_TEST'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  providedServices: string[];

  @ApiProperty({
    description: '특수 치료 항목',
    example: ['PLAY_THERAPY', 'ART_THERAPY'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  specialTreatments: string[];

  @ApiProperty({
    description: '보호자 상담 가능 여부',
    example: true,
    default: false,
  })
  @IsBoolean()
  canProvideParentCounseling: boolean;
}
