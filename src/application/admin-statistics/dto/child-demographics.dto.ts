import { ApiProperty } from '@nestjs/swagger';

/**
 * 카테고리별 분포
 */
export class CategoryDistributionDto {
  @ApiProperty({ description: '카테고리명' })
  category: string;

  @ApiProperty({ description: '개수' })
  count: number;

  @ApiProperty({ description: '비율 (%)' })
  percentage: number;
}

/**
 * 연령대별 분포
 */
export class AgeGroupDistributionDto {
  @ApiProperty({ description: '연령대' })
  ageGroup: string;

  @ApiProperty({ description: '개수' })
  count: number;

  @ApiProperty({ description: '비율 (%)' })
  percentage: number;
}

/**
 * 아동 인구통계 응답 DTO
 */
export class ChildDemographicsDto {
  @ApiProperty({ description: '전체 아동 수' })
  totalChildren: number;

  @ApiProperty({ description: '아동 유형별 분포', type: [CategoryDistributionDto] })
  byChildType: CategoryDistributionDto[];

  @ApiProperty({ description: '심리 상태별 분포', type: [CategoryDistributionDto] })
  byPsychologicalStatus: CategoryDistributionDto[];

  @ApiProperty({ description: '연령대별 분포', type: [AgeGroupDistributionDto] })
  byAgeGroup: AgeGroupDistributionDto[];

  @ApiProperty({ description: '성별 분포', type: [CategoryDistributionDto] })
  byGender: CategoryDistributionDto[];

  @ApiProperty({ description: '상담 이력이 있는 아동 수' })
  childrenWithCounselHistory: number;

  @ApiProperty({ description: '현재 상담 중인 아동 수' })
  childrenInActiveCounseling: number;
}
