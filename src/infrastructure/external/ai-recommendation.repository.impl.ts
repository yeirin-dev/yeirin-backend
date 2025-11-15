import { Injectable } from '@nestjs/common';
import { InstitutionRecommendation } from '@domain/matching/entity/institution-recommendation';
import { MatchingRecommendation } from '@domain/matching/entity/matching-recommendation';
import { RecommendationRepository } from '@domain/matching/repository/recommendation.repository';
import { CounselRequestText } from '@domain/matching/value-object/counsel-request-text';
import { InstitutionId } from '@domain/matching/value-object/institution-id';
import { RecommendationScore } from '@domain/matching/value-object/recommendation-score';
import { AIRecommendationClient } from './ai-recommendation.client';

/**
 * AI 추천 Repository 구현체
 * AI MSA 클라이언트를 사용하여 Domain Repository 인터페이스 구현
 */
@Injectable()
export class AIRecommendationRepositoryImpl implements RecommendationRepository {
  constructor(private readonly aiClient: AIRecommendationClient) {}

  async requestRecommendation(
    counselRequestText: CounselRequestText,
  ): Promise<MatchingRecommendation> {
    // 1. AI MSA에 요청
    const aiResponse = await this.aiClient.requestRecommendation(counselRequestText.value);

    // 2. AI 응답을 Domain Model로 변환
    const recommendations: InstitutionRecommendation[] = [];

    for (const rec of aiResponse.recommendations) {
      // InstitutionId 생성
      const institutionIdResult = InstitutionId.create(rec.institution_id);
      if (institutionIdResult.isFailure) {
        throw new Error(institutionIdResult.error);
      }

      // RecommendationScore 생성
      const scoreResult = RecommendationScore.create(rec.score);
      if (scoreResult.isFailure) {
        throw new Error(scoreResult.error);
      }

      // InstitutionRecommendation 생성
      const recommendationResult = InstitutionRecommendation.create({
        institutionId: institutionIdResult.value,
        score: scoreResult.value,
        reason: rec.reasoning,
      });

      if (recommendationResult.isFailure) {
        throw new Error(recommendationResult.error);
      }

      recommendations.push(recommendationResult.value);
    }

    // 3. MatchingRecommendation Aggregate 생성
    const matchingResult = MatchingRecommendation.create({
      counselRequestText,
      recommendations,
    });

    if (matchingResult.isFailure) {
      throw new Error(matchingResult.error);
    }

    return matchingResult.value;
  }
}
