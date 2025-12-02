import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { GenderType } from '@domain/child/model/value-objects/gender.vo';
import { ChildType } from '@infrastructure/persistence/typeorm/entity/enums/child-type.enum';

/**
 * 아동 등록 DTO
 *
 * 아동 유형별 관계 규칙:
 * - CARE_FACILITY (양육시설 아동, 고아): careFacilityId 필수
 * - COMMUNITY_CENTER (지역아동센터 아동): communityChildCenterId 필수, guardianId(부모) 필수
 * - REGULAR (일반 아동): guardianId(부모) 필수
 */
export class RegisterChildDto {
  @ApiProperty({
    description: '아동 유형',
    enum: ChildType,
    example: ChildType.REGULAR,
    enumName: 'ChildType',
  })
  @IsEnum(ChildType, { message: '유효하지 않은 아동 유형입니다' })
  childType: ChildType;

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

  // ========== 기관 연결 (아동 유형에 따라 선택적) ==========

  @ApiPropertyOptional({
    description: '양육시설 ID (CARE_FACILITY 유형만 필수)',
    example: 'care-facility-uuid-123',
  })
  @ValidateIf((o) => o.childType === ChildType.CARE_FACILITY)
  @IsUUID('4', { message: '유효한 양육시설 ID가 아닙니다' })
  @IsOptional()
  careFacilityId?: string;

  @ApiPropertyOptional({
    description: '지역아동센터 ID (COMMUNITY_CENTER 유형만 필수)',
    example: 'community-center-uuid-456',
  })
  @ValidateIf((o) => o.childType === ChildType.COMMUNITY_CENTER)
  @IsUUID('4', { message: '유효한 지역아동센터 ID가 아닙니다' })
  @IsOptional()
  communityChildCenterId?: string;

  // ========== 부모(보호자) 연결 ==========

  @ApiPropertyOptional({
    description:
      '부모 보호자 ID (COMMUNITY_CENTER, REGULAR 유형만 필수, Controller에서 자동 주입 가능)',
    example: 'guardian-uuid-789',
  })
  @ValidateIf(
    (o) => o.childType === ChildType.COMMUNITY_CENTER || o.childType === ChildType.REGULAR,
  )
  @IsUUID('4', { message: '유효한 보호자 ID가 아닙니다' })
  @IsOptional()
  guardianId?: string;

  // ========== 추가 정보 ==========

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
