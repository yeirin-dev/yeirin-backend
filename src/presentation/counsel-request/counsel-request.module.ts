import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompleteCounselingUseCase } from '@application/counsel-request/use-cases/complete-counseling.usecase';
import { CreateCounselRequestFromSouliUseCase } from '@application/counsel-request/use-cases/create-counsel-request-from-souli.usecase';
import { CreateCounselRequestUseCase } from '@application/counsel-request/use-cases/create-counsel-request.usecase';
import { DeleteCounselRequestUseCase } from '@application/counsel-request/use-cases/delete-counsel-request.usecase';
import { GetChildAssessmentResultsUseCase } from '@application/counsel-request/use-cases/get-child-assessment-results.usecase';
import { GetCounselRequestRecommendationsUseCase } from '@application/counsel-request/use-cases/get-counsel-request-recommendations.usecase';
import { GetCounselRequestUseCase } from '@application/counsel-request/use-cases/get-counsel-request.usecase';
import { GetCounselRequestsByChildUseCase } from '@application/counsel-request/use-cases/get-counsel-requests-by-child.usecase';
import { GetCounselRequestsByGuardianUseCase } from '@application/counsel-request/use-cases/get-counsel-requests-by-guardian.usecase';
import { GetCounselRequestsPaginatedUseCase } from '@application/counsel-request/use-cases/get-counsel-requests-paginated.usecase';
import { RequestCounselRequestRecommendationUseCase } from '@application/counsel-request/use-cases/request-counsel-request-recommendation.usecase';
import { SelectRecommendedInstitutionUseCase } from '@application/counsel-request/use-cases/select-recommended-institution.usecase';
import { StartCounselingUseCase } from '@application/counsel-request/use-cases/start-counseling.usecase';
import { UpdateCounselRequestUseCase } from '@application/counsel-request/use-cases/update-counsel-request.usecase';
import { SoulEClient } from '@infrastructure/external/soul-e.client';
import { YeirinAIClient } from '@infrastructure/external/yeirin-ai.client';
import { CounselRequestRecommendationEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request-recommendation.entity';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { CounselRequestRecommendationRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/counsel-request-recommendation.repository.impl';
import { CounselRequestRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/counsel-request.repository.impl';
import { MatchingModule } from '@presentation/matching/matching.module';
import { CounselRequestController } from './counsel-request.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CounselRequestEntity, CounselRequestRecommendationEntity]),
    ConfigModule,
    MatchingModule, // Matching Domain Service 사용 (DDD 패턴)
  ],
  controllers: [CounselRequestController],
  providers: [
    {
      provide: 'CounselRequestRepository',
      useClass: CounselRequestRepositoryImpl,
    },
    {
      provide: 'CounselRequestRecommendationRepository',
      useClass: CounselRequestRecommendationRepositoryImpl,
    },
    // AIRecommendationClient 제거 - MatchingModule을 통해 Domain Service 사용
    // Soul-E MSA 클라이언트
    SoulEClient,
    // Yeirin-AI MSA 클라이언트 (통합 보고서 생성)
    YeirinAIClient,
    CreateCounselRequestUseCase,
    CreateCounselRequestFromSouliUseCase,
    GetCounselRequestUseCase,
    GetCounselRequestsByChildUseCase,
    GetCounselRequestsByGuardianUseCase,
    GetCounselRequestsPaginatedUseCase,
    UpdateCounselRequestUseCase,
    DeleteCounselRequestUseCase,
    RequestCounselRequestRecommendationUseCase,
    GetCounselRequestRecommendationsUseCase,
    SelectRecommendedInstitutionUseCase,
    StartCounselingUseCase,
    CompleteCounselingUseCase,
    GetChildAssessmentResultsUseCase,
  ],
  exports: ['CounselRequestRepository', 'CounselRequestRecommendationRepository'],
})
export class CounselRequestModule {}
