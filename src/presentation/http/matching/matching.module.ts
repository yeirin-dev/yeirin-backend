import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MatchingController } from './matching.controller';
import { RequestCounselorRecommendationUseCase } from '@application/matching/use-case/request-counselor-recommendation.usecase';
import { AIRecommendationClient } from '@infrastructure/external/ai-recommendation.client';
import { AIRecommendationRepositoryImpl } from '@infrastructure/external/ai-recommendation.repository.impl';
import { RECOMMENDATION_REPOSITORY } from '@domain/matching/repository/recommendation.repository.token';

/**
 * 매칭 모듈
 * 상담기관 추천 관련 기능 제공
 */
@Module({
  imports: [ConfigModule],
  controllers: [MatchingController],
  providers: [
    // UseCase
    RequestCounselorRecommendationUseCase,

    // External Services
    AIRecommendationClient,

    // Repository Implementation
    {
      provide: RECOMMENDATION_REPOSITORY,
      useClass: AIRecommendationRepositoryImpl,
    },
  ],
})
export class MatchingModule {}
