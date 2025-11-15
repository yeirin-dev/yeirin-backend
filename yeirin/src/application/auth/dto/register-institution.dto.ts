import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ServiceType } from '@infrastructure/persistence/typeorm/entity/enums/service-type.enum';
import { SpecialTreatment } from '@infrastructure/persistence/typeorm/entity/enums/special-treatment.enum';
import { VoucherType } from '@infrastructure/persistence/typeorm/entity/enums/voucher-type.enum';

/**
 * 기관 대표 회원가입 DTO
 * User + VoucherInstitution 동시 생성
 */
export class RegisterInstitutionDto {
  // ========== User 기본 정보 ==========
  @ApiProperty({ example: 'institution@example.com', description: '이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  email: string;

  @ApiProperty({ example: 'Test1234!@#', description: '비밀번호 (최소 8자, 영문+숫자+특수문자)' })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  @MaxLength(100, { message: '비밀번호는 최대 100자까지 가능합니다' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/, {
    message: '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다',
  })
  password: string;

  @ApiProperty({ example: '김철수', description: '실명 (대표자명)' })
  @IsString()
  @MinLength(2, { message: '이름은 최소 2자 이상이어야 합니다' })
  @MaxLength(50, { message: '이름은 최대 50자까지 가능합니다' })
  realName: string;

  @ApiProperty({ example: '010-1234-5678', description: '전화번호' })
  @IsString()
  @Matches(/^010-?\d{4}-?\d{4}$/, {
    message: '올바른 전화번호 형식이 아닙니다 (010-xxxx-xxxx)',
  })
  phoneNumber: string;

  // ========== VoucherInstitution 정보 ==========
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
    description: '대표자명 (realName과 동일하게 자동 입력됨)',
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
    example: ['CHILD_PSYCHOLOGY', 'LANGUAGE_DEVELOPMENT'],
    enum: VoucherType,
    isArray: true,
  })
  @IsArray()
  @IsEnum(VoucherType, { each: true, message: '유효하지 않은 바우처 타입입니다' })
  operatingVouchers: VoucherType[];

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
    example: ['COUNSELING', 'PLAY_THERAPY', 'ART_THERAPY'],
    enum: ServiceType,
    isArray: true,
  })
  @IsArray()
  @IsEnum(ServiceType, { each: true, message: '유효하지 않은 서비스 타입입니다' })
  providedServices: ServiceType[];

  @ApiProperty({
    description: '특수 치료 항목',
    example: ['LANGUAGE', 'DEVELOPMENTAL_REHABILITATION'],
    enum: SpecialTreatment,
    isArray: true,
  })
  @IsArray()
  @IsEnum(SpecialTreatment, { each: true, message: '유효하지 않은 특수치료 타입입니다' })
  specialTreatments: SpecialTreatment[];

  @ApiProperty({
    description: '보호자 상담 가능 여부',
    example: true,
    default: false,
  })
  @IsBoolean()
  canProvideParentCounseling: boolean;
}
