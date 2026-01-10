import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegisterChildUseCase } from '@application/child/use-cases/register-child/register-child.use-case';
import { SmsService } from '@infrastructure/external/sms.service';
import { SoulEClient } from '@infrastructure/external/soul-e.client';
import { CareFacilityEntity } from '@infrastructure/persistence/typeorm/entity/care-facility.entity';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { CommunityChildCenterEntity } from '@infrastructure/persistence/typeorm/entity/community-child-center.entity';
import { CareFacilityRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/care-facility.repository.impl';
import { ChildRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/child.repository.impl';
import { CommunityChildCenterRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/community-child-center.repository.impl';
import { ChildController } from './child.controller';

/**
 * 아동 관리 모듈
 *
 * NOTE: 모든 아동은 시설(Institution)에 직접 연결됩니다.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ChildProfileEntity, CareFacilityEntity, CommunityChildCenterEntity]),
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
    // External Services
    SoulEClient,
    SmsService,
    // Use Cases
    RegisterChildUseCase,
  ],
  exports: ['ChildRepository'],
})
export class ChildModule {}
