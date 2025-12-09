import { ApiProperty } from '@nestjs/swagger';

/**
 * 기관별 성과 데이터
 */
export class InstitutionPerformanceItemDto {
  @ApiProperty({ description: '기관 ID' })
  institutionId: string;

  @ApiProperty({ description: '기관명' })
  institutionName: string;

  @ApiProperty({ description: '총 상담 수' })
  totalCounselCount: number;

  @ApiProperty({ description: '완료 상담 수' })
  completedCounselCount: number;

  @ApiProperty({ description: '진행 중 상담 수' })
  inProgressCounselCount: number;

  @ApiProperty({ description: '평균 평점' })
  averageRating: number;

  @ApiProperty({ description: '리뷰 수' })
  reviewCount: number;

  @ApiProperty({ description: '완료율 (%)' })
  completionRate: number;

  @ApiProperty({ description: '평균 처리 시간 (일)' })
  averageProcessingDays: number;
}

/**
 * 기관 성과 통계 응답 DTO
 */
export class InstitutionPerformanceDto {
  @ApiProperty({ description: '전체 기관 수' })
  totalInstitutions: number;

  @ApiProperty({ description: '활성 기관 수' })
  activeInstitutions: number;

  @ApiProperty({ description: '평균 완료율 (%)' })
  averageCompletionRate: number;

  @ApiProperty({ description: '평균 평점' })
  averageRating: number;

  @ApiProperty({ description: '기관별 성과 목록', type: [InstitutionPerformanceItemDto] })
  institutions: InstitutionPerformanceItemDto[];
}
