import { ApiProperty } from '@nestjs/swagger';

/**
 * 상담기관 추천 결과 DTO
 */
export class RecommendationResultDto {
  /**
   * 상담기관 ID
   */
  @ApiProperty({
    description: '상담기관 ID (UUID)',
    example: '93dfda2d-6cd3-4e86-8259-ee1c098234f7',
  })
  institutionId: string;

  /**
   * 추천 점수 (0.0 ~ 1.0)
   */
  @ApiProperty({
    description: '추천 점수 (0.0 ~ 1.0)',
    example: 0.95,
    minimum: 0,
    maximum: 1,
  })
  score: number;

  /**
   * 추천 이유
   */
  @ApiProperty({
    description: 'AI가 분석한 추천 이유',
    example:
      '서울아동심리상담센터는 ADHD 및 정서문제 전문 상담센터로 10년 이상의 경력을 가진 상담사가 있으며, 종합심리검사와 행동 치료를 제공할 수 있습니다.',
  })
  reason: string;

  /**
   * 높은 점수 여부 (0.7 이상)
   */
  @ApiProperty({
    description: '높은 점수 여부 (0.7 이상)',
    example: true,
  })
  isHighScore: boolean;
}

/**
 * 매칭 추천 응답 DTO
 */
export class MatchingRecommendationResponseDto {
  /**
   * 요청한 상담의뢰지 텍스트
   */
  @ApiProperty({
    description: '요청한 상담의뢰지 텍스트',
    example: '7세 아들이 ADHD 진단을 받았습니다. 학교에서 집중하지 못하고 친구들과 자주 다툽니다.',
  })
  counselRequestText: string;

  /**
   * 추천 결과 목록
   */
  @ApiProperty({
    description: '추천 결과 목록 (점수 순으로 정렬됨, 최대 5개)',
    type: [RecommendationResultDto],
  })
  recommendations: RecommendationResultDto[];

  /**
   * 추천 생성 시간
   */
  @ApiProperty({
    description: '추천 생성 시간',
    example: '2025-11-11T10:03:07.370Z',
  })
  createdAt: Date;
}
