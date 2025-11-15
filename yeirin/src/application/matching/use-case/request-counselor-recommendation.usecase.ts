import { Inject, Injectable } from '@nestjs/common';
import { RecommendationRepository } from '@domain/matching/repository/recommendation.repository';
import { RECOMMENDATION_REPOSITORY } from '@domain/matching/repository/recommendation.repository.token';
import { CounselRequestText } from '@domain/matching/value-object/counsel-request-text';
import {
  MatchingRecommendationResponseDto,
  RecommendationResultDto,
} from '../dto/recommendation-result.dto';
import { RequestCounselorRecommendationDto } from '../dto/request-counselor-recommendation.dto';

/**
 * 상담기관 추천 요청 UseCase
 *
 * 비즈니스 흐름:
 * 1. 상담의뢰지 텍스트 검증
 * 2. AI MSA에 추천 요청
 * 3. 추천 결과를 점수순으로 정렬하여 반환
 */
@Injectable()
export class RequestCounselorRecommendationUseCase {
  constructor(
    @Inject(RECOMMENDATION_REPOSITORY)
    private readonly recommendationRepository: RecommendationRepository,
  ) {}

  async execute(
    dto: RequestCounselorRecommendationDto,
  ): Promise<MatchingRecommendationResponseDto> {
    // 1. Value Object로 변환 및 검증
    const counselRequestTextResult = CounselRequestText.create(dto.counselRequestText);
    if (counselRequestTextResult.isFailure) {
      throw new Error(counselRequestTextResult.error);
    }

    // 2. Repository를 통해 추천 요청
    const matchingRecommendation = await this.recommendationRepository.requestRecommendation(
      counselRequestTextResult.value,
    );

    // 3. Domain Model을 DTO로 변환 (점수순 정렬)
    const sortedRecommendations = matchingRecommendation.getSortedByScore();

    return {
      counselRequestText: matchingRecommendation.counselRequestText.value,
      recommendations: sortedRecommendations.map((rec) => this.toRecommendationDto(rec)),
      createdAt: matchingRecommendation.createdAt,
    };
  }

  private toRecommendationDto(recommendation: any): RecommendationResultDto {
    return {
      institutionId: recommendation.institutionId.value,
      score: recommendation.score.value,
      reason: recommendation.reason,
      isHighScore: recommendation.isHighScore(),
    };
  }
}
