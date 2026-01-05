import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateCommunityChildCenterUseCase } from '@application/community-child-center/use-case/create-community-child-center.usecase';
import { DeleteCommunityChildCenterUseCase } from '@application/community-child-center/use-case/delete-community-child-center.usecase';
import { GetCommunityChildCenterUseCase } from '@application/community-child-center/use-case/get-community-child-center.usecase';
import { GetCommunityChildCentersUseCase } from '@application/community-child-center/use-case/get-community-child-centers.usecase';
import { UpdateCommunityChildCenterUseCase } from '@application/community-child-center/use-case/update-community-child-center.usecase';
import { CommunityChildCenterEntity } from '@infrastructure/persistence/typeorm/entity/community-child-center.entity';
import { GuardianProfileEntity } from '@infrastructure/persistence/typeorm/entity/guardian-profile.entity';
import { CommunityChildCenterRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/community-child-center.repository.impl';
import { GuardianProfileRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/guardian-profile.repository.impl';
import { CommunityChildCenterController } from './community-child-center.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CommunityChildCenterEntity, GuardianProfileEntity])],
  controllers: [CommunityChildCenterController],
  providers: [
    // Repository 제공
    {
      provide: 'CommunityChildCenterRepository',
      useClass: CommunityChildCenterRepositoryImpl,
    },
    {
      provide: 'GuardianProfileRepository',
      useClass: GuardianProfileRepositoryImpl,
    },
    // Use Cases
    GetCommunityChildCenterUseCase,
    GetCommunityChildCentersUseCase,
    CreateCommunityChildCenterUseCase,
    UpdateCommunityChildCenterUseCase,
    DeleteCommunityChildCenterUseCase,
  ],
  exports: ['CommunityChildCenterRepository'],
})
export class CommunityChildCenterModule {}
