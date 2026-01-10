import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareFacilityEntity } from '@infrastructure/persistence/typeorm/entity/care-facility.entity';
import { CommunityChildCenterEntity } from '@infrastructure/persistence/typeorm/entity/community-child-center.entity';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { AdminCareFacilityController } from './admin-care-facility.controller';
import { AdminCommunityCenterController } from './admin-community-center.controller';

/**
 * Admin Institution Module
 * 기관 관리 Admin API
 *
 * - /admin/care-facilities: 양육시설 관리
 * - /admin/community-centers: 지역아동센터 관리
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([CareFacilityEntity, CommunityChildCenterEntity]),
    forwardRef(() => AdminAuthModule),
  ],
  controllers: [AdminCareFacilityController, AdminCommunityCenterController],
  providers: [],
})
export class AdminInstitutionModule {}
