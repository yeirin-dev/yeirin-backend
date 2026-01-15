import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareFacilityEntity } from '@infrastructure/persistence/typeorm/entity/care-facility.entity';
import { CommunityChildCenterEntity } from '@infrastructure/persistence/typeorm/entity/community-child-center.entity';
import { EducationWelfareSchoolEntity } from '@infrastructure/persistence/typeorm/entity/education-welfare-school.entity';
import { LandingController } from './landing.controller';
import { LandingService } from './landing.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CareFacilityEntity,
      CommunityChildCenterEntity,
      EducationWelfareSchoolEntity,
    ]),
  ],
  controllers: [LandingController],
  providers: [LandingService],
  exports: [LandingService],
})
export class LandingModule {}
