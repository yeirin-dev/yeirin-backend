import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetChildDemographicsUseCase } from '@application/admin-statistics/get-child-demographics.usecase';
import { GetCounselRequestStatisticsUseCase } from '@application/admin-statistics/get-counsel-request-statistics.usecase';
import { GetInstitutionPerformanceUseCase } from '@application/admin-statistics/get-institution-performance.usecase';
import { CareFacilityEntity } from '@infrastructure/persistence/typeorm/entity/care-facility.entity';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { CommunityChildCenterEntity } from '@infrastructure/persistence/typeorm/entity/community-child-center.entity';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { EducationWelfareSchoolEntity } from '@infrastructure/persistence/typeorm/entity/education-welfare-school.entity';
import { AdminStatisticsRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/admin-statistics.repository.impl';
import { AdminStatisticsController } from './admin-statistics.controller';

/**
 * Admin Statistics Module
 * 통계 조회 Admin API
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
  ],
  controllers: [AdminStatisticsController],
  providers: [
    // Repository
    {
      provide: 'AdminStatisticsRepository',
      useClass: AdminStatisticsRepositoryImpl,
    },
    // Use Cases
    GetCounselRequestStatisticsUseCase,
    GetInstitutionPerformanceUseCase,
    GetChildDemographicsUseCase,
  ],
})
export class AdminStatisticsModule {}
