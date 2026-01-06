import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateCareFacilityUseCase } from '@application/care-facility/use-case/create-care-facility.usecase';
import { DeleteCareFacilityUseCase } from '@application/care-facility/use-case/delete-care-facility.usecase';
import { GetCareFacilitiesUseCase } from '@application/care-facility/use-case/get-care-facilities.usecase';
import { GetCareFacilityUseCase } from '@application/care-facility/use-case/get-care-facility.usecase';
import { UpdateCareFacilityUseCase } from '@application/care-facility/use-case/update-care-facility.usecase';
import { CareFacilityEntity } from '@infrastructure/persistence/typeorm/entity/care-facility.entity';
import { CareFacilityRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/care-facility.repository.impl';
import { CareFacilityController } from './care-facility.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CareFacilityEntity])],
  controllers: [CareFacilityController],
  providers: [
    // Repository 제공
    {
      provide: 'CareFacilityRepository',
      useClass: CareFacilityRepositoryImpl,
    },
    // Use Cases
    GetCareFacilityUseCase,
    GetCareFacilitiesUseCase,
    CreateCareFacilityUseCase,
    UpdateCareFacilityUseCase,
    DeleteCareFacilityUseCase,
  ],
  exports: ['CareFacilityRepository'],
})
export class CareFacilityModule {}
