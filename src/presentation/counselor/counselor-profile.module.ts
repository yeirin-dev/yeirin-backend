import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateCounselorProfileUseCase } from '@application/counselor/use-case/create-counselor-profile.usecase';
import { DeleteCounselorProfileUseCase } from '@application/counselor/use-case/delete-counselor-profile.usecase';
import { GetCounselorProfileUseCase } from '@application/counselor/use-case/get-counselor-profile.usecase';
import { GetCounselorProfilesUseCase } from '@application/counselor/use-case/get-counselor-profiles.usecase';
import { UpdateCounselorProfileUseCase } from '@application/counselor/use-case/update-counselor-profile.usecase';
import { CounselorProfileEntity } from '@infrastructure/persistence/typeorm/entity/counselor-profile.entity';
import { CounselorProfileRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/counselor-profile.repository.impl';
import { CounselorProfileController } from './counselor-profile.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CounselorProfileEntity])],
  controllers: [CounselorProfileController],
  providers: [
    // Repository
    {
      provide: 'CounselorProfileRepository',
      useClass: CounselorProfileRepositoryImpl,
    },
    // UseCases
    CreateCounselorProfileUseCase,
    UpdateCounselorProfileUseCase,
    GetCounselorProfileUseCase,
    GetCounselorProfilesUseCase,
    DeleteCounselorProfileUseCase,
  ],
  exports: ['CounselorProfileRepository'],
})
export class CounselorProfileModule {}
