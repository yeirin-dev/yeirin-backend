import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckVoucherEligibilityUseCase } from '@application/child/use-cases/check-voucher-eligibility/check-voucher-eligibility.use-case';
import { GetChildCounselRecordsUseCase } from '@application/child/use-cases/get-child-counsel-records.usecase';
import { GetChildCounselSessionsUseCase } from '@application/child/use-cases/get-child-counsel-sessions.usecase';
import { RegisterChildUseCase } from '@application/child/use-cases/register-child/register-child.use-case';
import { COUNSEL_RECORD_REPOSITORY } from '@domain/counsel-record/repository/counsel-record.repository';
import { COUNSEL_SESSION_REPOSITORY } from '@domain/counsel-session/repository/counsel-session.repository';
import { SmsService } from '@infrastructure/external/sms.service';
import { SoulEClient } from '@infrastructure/external/soul-e.client';
import { CareFacilityEntity } from '@infrastructure/persistence/typeorm/entity/care-facility.entity';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { CommunityChildCenterEntity } from '@infrastructure/persistence/typeorm/entity/community-child-center.entity';
import { CounselRecordEntity } from '@infrastructure/persistence/typeorm/entity/counsel-record.entity';
import { CounselSessionEntity } from '@infrastructure/persistence/typeorm/entity/counsel-session.entity';
import { EducationWelfareSchoolEntity } from '@infrastructure/persistence/typeorm/entity/education-welfare-school.entity';
import { CareFacilityRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/care-facility.repository.impl';
import { ChildRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/child.repository.impl';
import { CommunityChildCenterRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/community-child-center.repository.impl';
import { CounselRecordRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/counsel-record.repository.impl';
import { CounselSessionRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/counsel-session.repository.impl';
import { EducationWelfareSchoolRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/education-welfare-school.repository.impl';
import { ConsentModule } from '../consent/consent.module';
import { ChildController } from './child.controller';

/**
 * 아동 관리 모듈
 *
 * NOTE: 모든 아동은 시설(Institution)에 직접 연결됩니다.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChildProfileEntity,
      CareFacilityEntity,
      CommunityChildCenterEntity,
      CounselRecordEntity,
      CounselSessionEntity,
      EducationWelfareSchoolEntity,
    ]),
    ConsentModule,
  ],
  controllers: [ChildController],
  providers: [
    // Repository 제공
    {
      provide: 'ChildRepository',
      useClass: ChildRepositoryImpl,
    },
    {
      provide: 'CareFacilityRepository',
      useClass: CareFacilityRepositoryImpl,
    },
    {
      provide: 'CommunityChildCenterRepository',
      useClass: CommunityChildCenterRepositoryImpl,
    },
    {
      provide: 'EducationWelfareSchoolRepository',
      useClass: EducationWelfareSchoolRepositoryImpl,
    },
    {
      provide: COUNSEL_SESSION_REPOSITORY,
      useClass: CounselSessionRepositoryImpl,
    },
    {
      provide: COUNSEL_RECORD_REPOSITORY,
      useClass: CounselRecordRepositoryImpl,
    },
    // External Services
    SoulEClient,
    SmsService,
    // Use Cases
    RegisterChildUseCase,
    CheckVoucherEligibilityUseCase,
    GetChildCounselSessionsUseCase,
    GetChildCounselRecordsUseCase,
  ],
  exports: ['ChildRepository', CheckVoucherEligibilityUseCase],
})
export class ChildModule {}
