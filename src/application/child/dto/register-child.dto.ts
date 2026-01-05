import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { GenderType } from '@domain/child/model/value-objects/gender.vo';
import { ChildType } from '@infrastructure/persistence/typeorm/entity/enums/child-type.enum';

/**
 * 아동 등록 DTO
 *
 * 아동 유형별 관계 규칙:
 * - CARE_FACILITY (양육시설 아동): careFacilityId 필수
 * - COMMUNITY_CENTER (지역아동센터 아동): communityChildCenterId 필수
 *
 * NOTE: 모든 아동은 시설(Institution)에 직접 연결됩니다.
 *       Guardian 연결은 더 이상 사용되지 않습니다.
 */
export class RegisterChildDto {
  @ApiProperty({
    description: '아동 유형 (CARE_FACILITY 또는 COMMUNITY_CENTER)',
    enum: [ChildType.CARE_FACILITY, ChildType.COMMUNITY_CENTER],
    example: ChildType.CARE_FACILITY,
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

  // ========== 기관 연결 (시설 인증 시 자동 주입) ==========

  @ApiPropertyOptional({
    description: '양육시설 ID (CARE_FACILITY 유형, 시설 로그인 시 자동 주입)',
    example: 'care-facility-uuid-123',
  })
  @ValidateIf((o) => o.childType === ChildType.CARE_FACILITY)
  @IsUUID('4', { message: '유효한 양육시설 ID가 아닙니다' })
  @IsOptional()
  careFacilityId?: string;

  @ApiPropertyOptional({
    description: '지역아동센터 ID (COMMUNITY_CENTER 유형, 시설 로그인 시 자동 주입)',
    example: 'community-center-uuid-456',
  })
  @ValidateIf((o) => o.childType === ChildType.COMMUNITY_CENTER)
  @IsUUID('4', { message: '유효한 지역아동센터 ID가 아닙니다' })
  @IsOptional()
  communityChildCenterId?: string;

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
