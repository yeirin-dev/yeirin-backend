import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateVoucherLinkageAdminUseCase } from '@application/counsel-request/admin/create-voucher-linkage.admin.usecase';
import { GetCounselRequestDetailAdminUseCase } from '@application/counsel-request/admin/get-counsel-request-detail.admin.usecase';
import { GetCounselRequestsAdminUseCase } from '@application/counsel-request/admin/get-counsel-requests.admin.usecase';
import { UpdateCounselRequestStatusAdminUseCase } from '@application/counsel-request/admin/update-status.admin.usecase';
import { UpdateVoucherLinkageAdminUseCase } from '@application/counsel-request/admin/update-voucher-linkage.admin.usecase';
import { VOUCHER_LINKAGE_REPOSITORY } from '@domain/voucher-linkage/repository/voucher-linkage.repository';
import { AuditLogEntity } from '@infrastructure/persistence/typeorm/entity/audit-log.entity';
import { CounselReportEntity } from '@infrastructure/persistence/typeorm/entity/counsel-report.entity';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { ReviewEntity } from '@infrastructure/persistence/typeorm/entity/review.entity';
import { VoucherLinkageEntity } from '@infrastructure/persistence/typeorm/entity/voucher-linkage.entity';
import { CounselRequestRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/counsel-request.repository.impl';
import { VoucherLinkageRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/voucher-linkage.repository.impl';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { AdminCounselRequestController } from './admin-counsel-request.controller';

// Admin Use Cases

/**
 * Admin Counsel Request Module
 * 상담의뢰 관리 Admin API
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CounselRequestEntity,
      CounselReportEntity,
      ReviewEntity,
      AuditLogEntity,
      VoucherLinkageEntity,
    ]),
    forwardRef(() => AdminAuthModule),
  ],
  controllers: [AdminCounselRequestController],
  providers: [
    // Repositories
    {
      provide: 'CounselRequestRepository',
      useClass: CounselRequestRepositoryImpl,
    },
    {
      provide: VOUCHER_LINKAGE_REPOSITORY,
      useClass: VoucherLinkageRepositoryImpl,
    },
    // Use Cases
    GetCounselRequestsAdminUseCase,
    GetCounselRequestDetailAdminUseCase,
    UpdateCounselRequestStatusAdminUseCase,
    CreateVoucherLinkageAdminUseCase,
    UpdateVoucherLinkageAdminUseCase,
  ],
})
export class AdminCounselRequestModule {}
