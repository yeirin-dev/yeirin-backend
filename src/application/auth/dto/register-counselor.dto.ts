import { IsEmail, IsString, MinLength, MaxLength, Matches, IsInt, IsArray, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 상담사 회원가입 DTO
 * User + CounselorProfile 동시 생성
 */
export class RegisterCounselorDto {
  // ========== User 기본 정보 ==========
  @ApiProperty({ example: 'counselor@example.com', description: '이메일' })
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

  @ApiProperty({ example: '김상담', description: '실명' })
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

  // ========== CounselorProfile 정보 ==========
  @ApiProperty({ description: '소속 기관 ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  institutionId: string;

  @ApiProperty({ description: '상담사 이름', example: '김상담' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: '경력 (년)', example: 5 })
  @IsInt()
  @Min(0)
  experienceYears: number;

  @ApiProperty({ description: '보유 자격증 목록', example: ['임상심리전문가', '청소년상담사 1급'] })
  @IsArray()
  @IsString({ each: true })
  certifications: string[];

  @ApiProperty({ description: '전문 분야 목록', example: ['불안장애', '우울증'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialties?: string[];

  @ApiProperty({ description: '소개', example: '10년 경력의 청소년 상담 전문가입니다.', required: false })
  @IsString()
  @IsOptional()
  introduction?: string;
}
