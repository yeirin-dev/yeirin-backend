import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetDashboardOverviewUseCase } from '@application/admin-statistics/get-dashboard-overview.usecase';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { UserEntity } from '@infrastructure/persistence/typeorm/entity/user.entity';
import { VoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/voucher-institution.entity';
import { AdminStatisticsRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/admin-statistics.repository.impl';
import { AdminDashboardController } from './admin-dashboard.controller';

// Use Cases

// Repository

/**
 * Admin Dashboard Module
 * 대시보드 조회 Admin API
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
  controllers: [AdminDashboardController],
  providers: [
    // Repository
    {
      provide: 'AdminStatisticsRepository',
      useClass: AdminStatisticsRepositoryImpl,
    },
    // Use Cases
    GetDashboardOverviewUseCase,
  ],
})
export class AdminDashboardModule {}
