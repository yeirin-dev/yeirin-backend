import { IsString, IsDateString, IsEnum, IsUUID, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenderType } from '@domain/child/model/value-objects/gender.vo';

/**
 * 아동 등록 DTO
 * 비즈니스 규칙: guardianId와 institutionId 중 하나만 제공되어야 함
 */
export class RegisterChildDto {
  @ApiProperty({
    description: '아동 이름 (2-30자)',
    example: '김철수',
    minLength: 2,
    maxLength: 30,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '생년월일 (ISO 8601 형식)',
    example: '2015-05-10',
  })
  @IsDateString()
  birthDate: string;

  @ApiProperty({
    description: '성별',
    enum: GenderType,
    example: GenderType.MALE,
  })
  @IsEnum(GenderType)
  gender: GenderType;

  @ApiPropertyOptional({
    description: '보호자 ID (부모 또는 양육시설 교사)',
    example: 'guardian-uuid-123',
  })
  @ValidateIf((o) => !o.institutionId)
  @IsUUID()
  @IsOptional()
  guardianId?: string;

  @ApiPropertyOptional({
    description: '양육시설 ID (고아인 경우)',
    example: 'institution-uuid-456',
  })
  @ValidateIf((o) => !o.guardianId)
  @IsUUID()
  @IsOptional()
  institutionId?: string;

  @ApiPropertyOptional({
    description: '의료 정보 (민감 정보)',
    example: 'ADHD 진단, 알레르기: 우유',
  })
  @IsString()
  @IsOptional()
  medicalInfo?: string;

  @ApiPropertyOptional({
    description: '특수 요구사항',
    example: '감각 통합 치료 필요',
  })
  @IsString()
  @IsOptional()
  specialNeeds?: string;
}
