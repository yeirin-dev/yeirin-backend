import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetLinkedChildrenUseCase } from '@application/b-impact-institution/use-cases/get-linked-children.usecase';
import { AcceptLinkageUseCase } from '@application/b-impact-institution/use-cases/accept-linkage.usecase';
import { RejectLinkageUseCase } from '@application/b-impact-institution/use-cases/reject-linkage.usecase';
import { GetChildDetailUseCase } from '@application/b-impact-institution/use-cases/get-child-detail.usecase';
import { GetCounselSessionsUseCase } from '@application/b-impact-institution/use-cases/get-counsel-sessions.usecase';
import { CreateCounselSessionUseCase } from '@application/b-impact-institution/use-cases/create-counsel-session.usecase';
import { UpdateCounselSessionUseCase } from '@application/b-impact-institution/use-cases/update-counsel-session.usecase';
import { CancelCounselSessionUseCase } from '@application/b-impact-institution/use-cases/cancel-counsel-session.usecase';
import { CompleteCounselSessionUseCase } from '@application/b-impact-institution/use-cases/complete-counsel-session.usecase';
import { GetCounselRecordsUseCase } from '@application/b-impact-institution/use-cases/get-counsel-records.usecase';
import { GetCounselRecordUseCase } from '@application/b-impact-institution/use-cases/get-counsel-record.usecase';
import { CreateCounselRecordUseCase } from '@application/b-impact-institution/use-cases/create-counsel-record.usecase';
import { UpdateCounselRecordUseCase } from '@application/b-impact-institution/use-cases/update-counsel-record.usecase';
import { SubmitCounselRecordUseCase } from '@application/b-impact-institution/use-cases/submit-counsel-record.usecase';
import { ShareCounselRecordUseCase } from '@application/b-impact-institution/use-cases/share-counsel-record.usecase';
import { VOUCHER_LINKAGE_REPOSITORY } from '@domain/voucher-linkage/repository/voucher-linkage.repository';
import { COUNSEL_SESSION_REPOSITORY } from '@domain/counsel-session/repository/counsel-session.repository';
import { COUNSEL_RECORD_REPOSITORY } from '@domain/counsel-record/repository/counsel-record.repository';
import { VoucherLinkageEntity } from '@infrastructure/persistence/typeorm/entity/voucher-linkage.entity';
import { VoucherLinkageRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/voucher-linkage.repository.impl';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { CounselRequestRecommendationEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request-recommendation.entity';
import { BImpactVoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/b-impact-voucher-institution.entity';
import { CounselSessionEntity } from '@infrastructure/persistence/typeorm/entity/counsel-session.entity';
import { CounselSessionRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/counsel-session.repository.impl';
import { CounselRecordEntity } from '@infrastructure/persistence/typeorm/entity/counsel-record.entity';
import { CounselRecordRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/counsel-record.repository.impl';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { OpenAIClient } from '@infrastructure/external/openai.client';
import { BImpactInstitutionController } from './b-impact-institution.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      VoucherLinkageEntity,
      CounselRequestEntity,
      CounselRequestRecommendationEntity,
      BImpactVoucherInstitutionEntity,
      CounselSessionEntity,
      CounselRecordEntity,
      ChildProfileEntity,
    ]),
  ],
  controllers: [BImpactInstitutionController],
  providers: [
    // External
    OpenAIClient,
    // Repositories
    {
      provide: VOUCHER_LINKAGE_REPOSITORY,
      useClass: VoucherLinkageRepositoryImpl,
    },
    {
      provide: COUNSEL_SESSION_REPOSITORY,
      useClass: CounselSessionRepositoryImpl,
    },
    {
      provide: COUNSEL_RECORD_REPOSITORY,
      useClass: CounselRecordRepositoryImpl,
    },
    // Use Cases - Linkage
    GetLinkedChildrenUseCase,
    AcceptLinkageUseCase,
    RejectLinkageUseCase,
    // Use Cases - Child Detail
    GetChildDetailUseCase,
    // Use Cases - Counsel Sessions
    GetCounselSessionsUseCase,
    CreateCounselSessionUseCase,
    UpdateCounselSessionUseCase,
    CancelCounselSessionUseCase,
    CompleteCounselSessionUseCase,
    // Use Cases - Counsel Records
    GetCounselRecordsUseCase,
    GetCounselRecordUseCase,
    CreateCounselRecordUseCase,
    UpdateCounselRecordUseCase,
    SubmitCounselRecordUseCase,
    ShareCounselRecordUseCase,
  ],
})
export class BImpactInstitutionModule {}
