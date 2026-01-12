import { ApiProperty } from '@nestjs/swagger';

/**
 * 기관별 아동 현황 데이터
 * NOTE: VoucherInstitution → CareFacility/CommunityChildCenter/EducationWelfareSchool 전환
 */
export class InstitutionPerformanceItemDto {
  @ApiProperty({ description: '기관 ID' })
  institutionId: string;

  @ApiProperty({ description: '기관명' })
  institutionName: string;

  @ApiProperty({
    description: '기관 유형',
    enum: ['CARE_FACILITY', 'COMMUNITY_CENTER', 'EDUCATION_WELFARE_SCHOOL'],
  })
  institutionType: 'CARE_FACILITY' | 'COMMUNITY_CENTER' | 'EDUCATION_WELFARE_SCHOOL';

  @ApiProperty({ description: '등록 아동 수' })
  totalChildCount: number;

  @ApiProperty({ description: '상담의뢰 수' })
  counselRequestCount: number;

  @ApiProperty({ description: '상담의뢰 비율 (%)' })
  counselRequestRate: number;
}

/**
 * 기관 성과 통계 응답 DTO
 * NOTE: VoucherInstitution → CareFacility/CommunityChildCenter 전환
 */
export class InstitutionPerformanceDto {
  @ApiProperty({ description: '전체 기관 수' })
  totalInstitutions: number;

  @ApiProperty({ description: '활성 기관 수' })
  activeInstitutions: number;

  @ApiProperty({ description: '총 아동 수' })
  totalChildren: number;

  @ApiProperty({ description: '총 상담의뢰 수' })
  totalCounselRequests: number;

  @ApiProperty({ description: '기관별 현황 목록', type: [InstitutionPerformanceItemDto] })
  institutions: InstitutionPerformanceItemDto[];
}
