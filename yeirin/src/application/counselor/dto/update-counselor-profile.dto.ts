import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsArray, IsOptional, Min, MaxLength } from 'class-validator';

/**
 * 상담사 프로필 수정 DTO
 */
export class UpdateCounselorProfileDto {
  @ApiProperty({ description: '상담사 이름', example: '김상담', required: false })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '경력 (년)', example: 6, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  experienceYears?: number;

  @ApiProperty({
    description: '보유 자격증 목록',
    example: ['임상심리전문가', '청소년상담사 1급'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @ApiProperty({
    description: '전문 분야 목록',
    example: ['불안장애', '우울증', 'ADHD'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialties?: string[];

  @ApiProperty({
    description: '소개',
    example: '12년 경력의 청소년 상담 전문가입니다.',
    required: false,
  })
  @IsString()
  @IsOptional()
  introduction?: string;
}
