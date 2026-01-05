import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetGuardianDashboardUseCase } from '@application/guardian/use-cases/get-guardian-dashboard.usecase';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { GuardianProfileEntity } from '@infrastructure/persistence/typeorm/entity/guardian-profile.entity';
import { ChildRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/child.repository.impl';
import { CounselRequestRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/counsel-request.repository.impl';
import { GuardianProfileRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/guardian-profile.repository.impl';
import { GuardianController } from './guardian.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChildProfileEntity, CounselRequestEntity, GuardianProfileEntity]),
  ],
  controllers: [GuardianController],
  providers: [
    GetGuardianDashboardUseCase,
    {
      provide: 'ChildRepository',
      useClass: ChildRepositoryImpl,
    },
    {
      provide: 'CounselRequestRepository',
      useClass: CounselRequestRepositoryImpl,
    },
    {
      provide: 'GuardianProfileRepository',
      useClass: GuardianProfileRepositoryImpl,
    },
  ],
})
export class GuardianModule {}
