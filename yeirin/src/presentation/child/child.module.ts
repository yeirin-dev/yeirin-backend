import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChildController } from './child.controller';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { GuardianProfileEntity } from '@infrastructure/persistence/typeorm/entity/guardian-profile.entity';
import { ChildRepository } from '@infrastructure/persistence/typeorm/repository/child.repository.impl';
import { TypeOrmGuardianProfileRepository } from '@infrastructure/persistence/typeorm/repository/typeorm-guardian-profile.repository';
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
      provide: 'IChildRepository',
      useClass: ChildRepository,
    },
    {
      provide: 'GuardianProfileRepository',
      useClass: TypeOrmGuardianProfileRepository,
    },
    // Use Cases
    RegisterChildUseCase,
    GetChildrenByGuardianUseCase,
  ],
  exports: ['IChildRepository'],
})
export class ChildModule {}
