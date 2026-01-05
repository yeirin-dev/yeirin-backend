import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetChildDemographicsUseCase } from '@application/admin-statistics/get-child-demographics.usecase';
import { GetCounselRequestStatisticsUseCase } from '@application/admin-statistics/get-counsel-request-statistics.usecase';
import { GetInstitutionPerformanceUseCase } from '@application/admin-statistics/get-institution-performance.usecase';
import { GetUserStatisticsUseCase } from '@application/admin-statistics/get-user-statistics.usecase';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { UserEntity } from '@infrastructure/persistence/typeorm/entity/user.entity';
import { VoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/voucher-institution.entity';
import { AdminStatisticsRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/admin-statistics.repository.impl';
import { AdminStatisticsController } from './admin-statistics.controller';

// Use Cases

// Repository

/**
 * Admin Statistics Module
 * 통계 조회 Admin API
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      CounselRequestEntity,
      ChildProfileEntity,
      VoucherInstitutionEntity,
    ]),
  ],
  controllers: [AdminStatisticsController],
  providers: [
    // Repository
    {
      provide: 'AdminStatisticsRepository',
      useClass: AdminStatisticsRepositoryImpl,
    },
    // Use Cases
    GetUserStatisticsUseCase,
    GetCounselRequestStatisticsUseCase,
    GetInstitutionPerformanceUseCase,
    GetChildDemographicsUseCase,
  ],
})
export class AdminStatisticsModule {}
