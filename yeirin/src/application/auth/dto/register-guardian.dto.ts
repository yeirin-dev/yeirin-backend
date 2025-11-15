import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * 보호자 회원가입 DTO
 * User + GuardianProfile 동시 생성
 */
export class RegisterGuardianDto {
  // ========== User 기본 정보 ==========
  @ApiProperty({ example: 'guardian@example.com', description: '이메일' })
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

  @ApiProperty({ example: '홍길동', description: '실명' })
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

  // ========== GuardianProfile 정보 ==========
  @ApiProperty({ example: 'OO어린이집', description: '소속 기관명 (선택)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '기관명은 최대 100자까지 가능합니다' })
  organizationName?: string;

  @ApiProperty({
    example: 'PARENT',
    description: '보호자 유형',
    enum: ['TEACHER', 'PARENT'],
  })
  @IsEnum(['TEACHER', 'PARENT'], { message: '유효하지 않은 보호자 유형입니다' })
  guardianType: 'TEACHER' | 'PARENT';

  @ApiProperty({ example: 3, description: '담당 아동 수 (교사의 경우, 선택)', required: false })
  @IsOptional()
  @IsInt({ message: '아동 수는 정수여야 합니다' })
  @Min(0, { message: '아동 수는 0 이상이어야 합니다' })
  numberOfChildren?: number;

  @ApiProperty({
    example: '서울시 강남구 테헤란로 123',
    description: '주소 (선택)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '주소는 최대 200자까지 가능합니다' })
  address?: string;

  @ApiProperty({ example: '101동 101호', description: '상세 주소 (선택)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '상세 주소는 최대 100자까지 가능합니다' })
  addressDetail?: string;

  @ApiProperty({ example: '06234', description: '우편번호 (선택)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10, { message: '우편번호는 최대 10자까지 가능합니다' })
  postalCode?: string;

  @ApiProperty({ example: '추가 정보', description: '비고 (선택)', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
