import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetLinkedChildrenUseCase } from '@application/b-impact-institution/use-cases/get-linked-children.usecase';
import { AcceptLinkageUseCase } from '@application/b-impact-institution/use-cases/accept-linkage.usecase';
import { RejectLinkageUseCase } from '@application/b-impact-institution/use-cases/reject-linkage.usecase';
import { VoucherLinkageEntity } from '@infrastructure/persistence/typeorm/entity/voucher-linkage.entity';
import { VoucherLinkageRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/voucher-linkage.repository.impl';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { CounselRequestRecommendationEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request-recommendation.entity';
import { BImpactVoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/b-impact-voucher-institution.entity';
import { BImpactInstitutionController } from './b-impact-institution.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VoucherLinkageEntity,
      CounselRequestEntity,
      CounselRequestRecommendationEntity,
      BImpactVoucherInstitutionEntity,
    ]),
  ],
  controllers: [BImpactInstitutionController],
  providers: [
    GetLinkedChildrenUseCase,
    AcceptLinkageUseCase,
    RejectLinkageUseCase,
    {
      provide: 'VoucherLinkageRepository',
      useClass: VoucherLinkageRepositoryImpl,
    },
  ],
})
export class BImpactInstitutionModule {}
