import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/voucher-institution.entity';
import { AdminInstitutionController } from './admin-institution.controller';

/**
 * Admin Institution Module
 * 기관 관리 Admin API
 */
@Module({
  imports: [TypeOrmModule.forFeature([VoucherInstitutionEntity])],
  controllers: [AdminInstitutionController],
  providers: [],
})
export class AdminInstitutionModule {}
