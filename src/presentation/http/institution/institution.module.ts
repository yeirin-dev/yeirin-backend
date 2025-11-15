import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/voucher-institution.entity';
import { InstitutionController } from './institution.controller';
import { InstitutionRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/institution.repository.impl';
import { GetInstitutionUseCase } from '@application/institution/use-case/get-institution.usecase';
import { GetInstitutionsUseCase } from '@application/institution/use-case/get-institutions.usecase';
import { CreateInstitutionUseCase } from '@application/institution/use-case/create-institution.usecase';
import { UpdateInstitutionUseCase } from '@application/institution/use-case/update-institution.usecase';
import { DeleteInstitutionUseCase } from '@application/institution/use-case/delete-institution.usecase';

@Module({
  imports: [TypeOrmModule.forFeature([VoucherInstitutionEntity])],
  controllers: [InstitutionController],
  providers: [
    {
      provide: 'InstitutionRepository',
      useClass: InstitutionRepositoryImpl,
    },
    {
      provide: GetInstitutionUseCase,
      useFactory: (repository: InstitutionRepositoryImpl) => {
        return new GetInstitutionUseCase(repository);
      },
      inject: ['InstitutionRepository'],
    },
    {
      provide: GetInstitutionsUseCase,
      useFactory: (repository: InstitutionRepositoryImpl) => {
        return new GetInstitutionsUseCase(repository);
      },
      inject: ['InstitutionRepository'],
    },
    {
      provide: CreateInstitutionUseCase,
      useFactory: (repository: InstitutionRepositoryImpl) => {
        return new CreateInstitutionUseCase(repository);
      },
      inject: ['InstitutionRepository'],
    },
    {
      provide: UpdateInstitutionUseCase,
      useFactory: (repository: InstitutionRepositoryImpl) => {
        return new UpdateInstitutionUseCase(repository);
      },
      inject: ['InstitutionRepository'],
    },
    {
      provide: DeleteInstitutionUseCase,
      useFactory: (repository: InstitutionRepositoryImpl) => {
        return new DeleteInstitutionUseCase(repository);
      },
      inject: ['InstitutionRepository'],
    },
  ],
})
export class InstitutionModule {}
