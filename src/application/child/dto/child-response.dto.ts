import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Child } from '@domain/child/model/child';

/**
 * 아동 응답 DTO
 *
 * NOTE: 모든 아동은 시설(Institution)에 직접 연결됩니다.
 */
export class ChildResponseDto {
  @ApiProperty({
    description: '아동 ID',
    example: 'child-uuid-123',
  })
  id: string;

  @ApiProperty({
    description: '아동 유형',
    example: 'CARE_FACILITY',
    enum: ['CARE_FACILITY', 'COMMUNITY_CENTER'],
  })
  childType: string;

  @ApiProperty({
    description: '아동 이름',
    example: '김철수',
  })
  name: string;

  @ApiProperty({
    description: '생년월일',
    example: '2015-05-10',
  })
  birthDate: string;

  @ApiProperty({
    description: '성별',
    example: 'MALE',
  })
  gender: string;

  @ApiProperty({
    description: '현재 나이',
    example: 8,
  })
  age: number;

  // ========== 기관 연결 ==========

  @ApiPropertyOptional({
    description: '양육시설 ID (CARE_FACILITY 유형만 해당)',
    example: 'care-facility-uuid-123',
    nullable: true,
  })
  careFacilityId: string | null;

  @ApiPropertyOptional({
    description: '지역아동센터 ID (COMMUNITY_CENTER 유형만 해당)',
    example: 'community-center-uuid-456',
    nullable: true,
  })
  communityChildCenterId: string | null;

  @ApiProperty({
    description: '고아 여부 (CARE_FACILITY 유형이면 true)',
    example: false,
  })
  isOrphan: boolean;

  // ========== 추가 정보 ==========

  @ApiPropertyOptional({
    description: '의료 정보',
    example: 'ADHD 진단',
    nullable: true,
  })
  medicalInfo: string | null;

  @ApiPropertyOptional({
    description: '특수 요구사항',
    example: '감각 통합 치료 필요',
    nullable: true,
  })
  specialNeeds: string | null;

  @ApiProperty({
    description: '생성 일시',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 일시',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  /**
   * Domain → DTO 변환
   */
  static fromDomain(child: Child): ChildResponseDto {
    const dto = new ChildResponseDto();
    dto.id = child.id;
    dto.childType = child.childType.value;
    dto.name = child.name.value;
    dto.birthDate = child.birthDate.value.toISOString().split('T')[0];
    dto.gender = child.gender.value;
    dto.age = child.getAge();
    dto.careFacilityId = child.careFacilityId;
    dto.communityChildCenterId = child.communityChildCenterId;
    dto.isOrphan = child.isOrphan;
    dto.medicalInfo = child.medicalInfo;
    dto.specialNeeds = child.specialNeeds;
    dto.createdAt = child.createdAt;
    dto.updatedAt = child.updatedAt;

    return dto;
  }
}
