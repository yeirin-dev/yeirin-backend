import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetDashboardOverviewUseCase } from '@application/admin-statistics/get-dashboard-overview.usecase';
import { CareFacilityEntity } from '@infrastructure/persistence/typeorm/entity/care-facility.entity';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { CommunityChildCenterEntity } from '@infrastructure/persistence/typeorm/entity/community-child-center.entity';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { EducationWelfareSchoolEntity } from '@infrastructure/persistence/typeorm/entity/education-welfare-school.entity';
import { AdminStatisticsRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/admin-statistics.repository.impl';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { AdminDashboardController } from './admin-dashboard.controller';

/**
 * Admin Dashboard Module
 * 대시보드 조회 Admin API
 *
 * NOTE: User 통계 기능 제거됨. 기관 기반 인증으로 전환.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CounselRequestEntity,
      ChildProfileEntity,
      CareFacilityEntity,
      CommunityChildCenterEntity,
      EducationWelfareSchoolEntity,
    ]),
    forwardRef(() => AdminAuthModule),
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
