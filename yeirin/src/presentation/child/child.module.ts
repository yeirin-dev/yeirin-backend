import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChildController } from './child.controller';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { GuardianProfileEntity } from '@infrastructure/persistence/typeorm/entity/guardian-profile.entity';
import { ChildRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/child.repository.impl';
import { GuardianProfileRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/guardian-profile.repository.impl';
import { RegisterChildUseCase } from '@application/child/use-cases/register-child/register-child.use-case';
import { GetChildrenByGuardianUseCase } from '@application/child/use-cases/get-children-by-guardian/get-children-by-guardian.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChildProfileEntity, GuardianProfileEntity]),
  ],
  controllers: [ChildController],
  providers: [
    // Repository 제공
    {
      provide: 'ChildRepository',
      useClass: ChildRepositoryImpl,
    },
    {
      provide: 'GuardianProfileRepository',
      useClass: GuardianProfileRepositoryImpl,
    },
    // Use Cases
    RegisterChildUseCase,
    GetChildrenByGuardianUseCase,
  ],
  exports: ['ChildRepository'],
})
export class ChildModule {}
