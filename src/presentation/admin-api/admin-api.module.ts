import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from '@infrastructure/audit/audit.service';
import { AuditLogEntity } from '@infrastructure/persistence/typeorm/entity/audit-log.entity';
import { AdminCommonModule } from '@yeirin/admin-common';
import { AdminAuthModule } from './auth/admin-auth.module';
import { AdminAuditLogModule } from './audit-log/admin-audit-log.module';
import { AdminChildrenModule } from './children/admin-children.module';
import { AdminConsentModule } from './consent/admin-consent.module';
import { AdminCounselReportModule } from './counsel-report/admin-counsel-report.module';
import { AdminCounselRequestModule } from './counsel-request/admin-counsel-request.module';
import { AdminDashboardModule } from './dashboard/admin-dashboard.module';
import { AdminInstitutionModule } from './institution/admin-institution.module';
import { AdminReviewModule } from './review/admin-review.module';
import { AdminSettingsModule } from './settings/admin-settings.module';
import { AdminStatisticsModule } from './statistics/admin-statistics.module';

/**
 * Admin API Module
 *
 * 관리자 전용 API 모듈
 * - /admin/* 경로로 접근
 * - ADMIN 역할만 접근 가능
 * - 모든 작업 감사 로깅
 */
@Module({
  imports: [
    // Audit 로깅용 TypeORM
    TypeOrmModule.forFeature([AuditLogEntity]),

    // Admin 공통 모듈 (Guards, Interceptors, Decorators)
    AdminCommonModule.register({
      globalGuard: false, // 각 Controller에서 개별 적용
      globalInterceptor: false,
    }),

    // Admin Auth Module
    AdminAuthModule,

    // Admin Sub-Modules
    AdminDashboardModule,
    AdminInstitutionModule,
    AdminChildrenModule,
    AdminConsentModule,
    AdminCounselRequestModule,
    AdminCounselReportModule,
    AdminReviewModule,
    AdminSettingsModule,
    AdminStatisticsModule,
    AdminAuditLogModule,
  ],
  providers: [AuditService],
  exports: [AuditService, AdminAuthModule],
})
export class AdminApiModule {}
