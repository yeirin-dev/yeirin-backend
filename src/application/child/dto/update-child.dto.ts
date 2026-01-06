import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { GenderType } from '@domain/child/model/value-objects/gender.vo';

/**
 * 아동 정보 수정 DTO
 *
 * NOTE: childType은 수정 불가 (시설 유형은 변경할 수 없음)
 */
export class UpdateChildDto {
  @ApiPropertyOptional({
    description: '아동 이름 (2-30자)',
    example: '김철수',
    minLength: 2,
    maxLength: 30,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: '생년월일 (ISO 8601 형식)',
    example: '2015-05-10',
  })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({
    description: '성별',
    enum: GenderType,
    example: GenderType.MALE,
  })
  @IsEnum(GenderType)
  @IsOptional()
  gender?: GenderType;

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
