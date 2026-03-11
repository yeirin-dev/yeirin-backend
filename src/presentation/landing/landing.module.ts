import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareFacilityEntity } from '@infrastructure/persistence/typeorm/entity/care-facility.entity';
import { CommunityChildCenterEntity } from '@infrastructure/persistence/typeorm/entity/community-child-center.entity';
import { EducationWelfareSchoolEntity } from '@infrastructure/persistence/typeorm/entity/education-welfare-school.entity';
import { FastTrackReferralEntity } from '@infrastructure/persistence/typeorm/entity/fast-track-referral.entity';
import { FastTrackReferralRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/fast-track-referral.repository.impl';
import { LandingController } from './landing.controller';
import { LandingService } from './landing.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CareFacilityEntity,
      CommunityChildCenterEntity,
      EducationWelfareSchoolEntity,
      FastTrackReferralEntity,
    ]),
  ],
  controllers: [LandingController],
  providers: [
    LandingService,
    {
      provide: 'FastTrackReferralRepository',
      useClass: FastTrackReferralRepositoryImpl,
    },
  ],
  exports: [LandingService],
})
export class LandingModule {}
