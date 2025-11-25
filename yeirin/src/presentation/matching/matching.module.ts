import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RECOMMENDATION_REPOSITORY } from '@domain/matching/repository/recommendation.repository.token';
import { RequestCounselorRecommendationUseCase } from '@application/matching/use-case/request-counselor-recommendation.usecase';
import { AIRecommendationClient } from '@infrastructure/external/ai-recommendation.client';
import { AIRecommendationRepositoryImpl } from '@infrastructure/external/ai-recommendation.repository.impl';
import { MatchingController } from './matching.controller';

/**
 * 매칭 모듈
 * 상담기관 추천 관련 기능 제공
 *
 * DDD 패턴:
 * - RequestCounselorRecommendationUseCase를 Domain Service로 export
 * - 다른 Bounded Context(counsel-request)에서 재사용 가능
 */
@Module({
  imports: [ConfigModule],
  controllers: [MatchingController],
  providers: [
    // UseCase (Domain Service)
    RequestCounselorRecommendationUseCase,

    // External Services
    AIRecommendationClient,

    // Repository Implementation
    {
      provide: RECOMMENDATION_REPOSITORY,
      useClass: AIRecommendationRepositoryImpl,
    },
  ],
  exports: [
    // 다른 도메인에서 AI 추천 서비스를 사용할 수 있도록 export
    RequestCounselorRecommendationUseCase,
  ],
})
export class MatchingModule {}
