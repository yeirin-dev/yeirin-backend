import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateVoucherLinkageAdminUseCase } from '@application/counsel-request/admin/create-voucher-linkage.admin.usecase';
import { GetCounselRequestDetailAdminUseCase } from '@application/counsel-request/admin/get-counsel-request-detail.admin.usecase';
import { GetCounselRequestsAdminUseCase } from '@application/counsel-request/admin/get-counsel-requests.admin.usecase';
import { GetLinkageInfoStatusAdminUseCase } from '@application/counsel-request/admin/get-linkage-info-status.admin.usecase';
import { GetVoucherLinkageStatusAdminUseCase } from '@application/counsel-request/admin/get-voucher-linkage-status.admin.usecase';
import { UpdateCounselRequestStatusAdminUseCase } from '@application/counsel-request/admin/update-status.admin.usecase';
import { UpdateVoucherLinkageAdminUseCase } from '@application/counsel-request/admin/update-voucher-linkage.admin.usecase';
import { VOUCHER_LINKAGE_REPOSITORY } from '@domain/voucher-linkage/repository/voucher-linkage.repository';
import { AuditLogEntity } from '@infrastructure/persistence/typeorm/entity/audit-log.entity';
import { CareFacilityEntity } from '@infrastructure/persistence/typeorm/entity/care-facility.entity';
import { CommunityChildCenterEntity } from '@infrastructure/persistence/typeorm/entity/community-child-center.entity';
import { CounselReportEntity } from '@infrastructure/persistence/typeorm/entity/counsel-report.entity';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { BImpactVoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/b-impact-voucher-institution.entity';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { CommonVoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/common-voucher-institution.entity';
import { EducationWelfareSchoolEntity } from '@infrastructure/persistence/typeorm/entity/education-welfare-school.entity';
import { ReviewEntity } from '@infrastructure/persistence/typeorm/entity/review.entity';
import { VoucherLinkageEntity } from '@infrastructure/persistence/typeorm/entity/voucher-linkage.entity';
import { CounselRequestRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/counsel-request.repository.impl';
import { VoucherLinkageRepositoryImpl } from '@infrastructure/persistence/typeorm/repository/voucher-linkage.repository.impl';
import { S3Service } from '@infrastructure/storage/s3.service';
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
      CareFacilityEntity,
      CommunityChildCenterEntity,
      EducationWelfareSchoolEntity,
      BImpactVoucherInstitutionEntity,
      CommonVoucherInstitutionEntity,
      ChildProfileEntity,
    ]),
    forwardRef(() => AdminAuthModule),
  ],
  controllers: [AdminCounselRequestController],
  providers: [
    // Infrastructure Services
    S3Service,
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
    GetLinkageInfoStatusAdminUseCase,
    GetVoucherLinkageStatusAdminUseCase,
  ],
})
export class AdminCounselRequestModule {}
