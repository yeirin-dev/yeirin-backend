import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsArray, IsOptional, IsUUID, Min, MaxLength } from 'class-validator';

/**
 * 상담사 프로필 생성 DTO
 */
export class CreateCounselorProfileDto {
  @ApiProperty({ description: '상담사 User ID (COUNSELOR 역할)', example: '660e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  userId: string;

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
