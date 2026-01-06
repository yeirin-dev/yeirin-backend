import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareFacilityEntity } from '@infrastructure/persistence/typeorm/entity/care-facility.entity';
import { CommunityChildCenterEntity } from '@infrastructure/persistence/typeorm/entity/community-child-center.entity';
import { AdminInstitutionController } from './admin-institution.controller';

/**
 * Admin Institution Module
 * 기관 관리 Admin API
 *
 * NOTE: VoucherInstitution 제거됨. CareFacility/CommunityChildCenter 기반으로 전환.
 */
@Module({
  imports: [TypeOrmModule.forFeature([CareFacilityEntity, CommunityChildCenterEntity])],
  controllers: [AdminInstitutionController],
  providers: [],
})
export class AdminInstitutionModule {}
