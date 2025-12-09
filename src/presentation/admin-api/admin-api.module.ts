import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from '@infrastructure/audit/audit.service';
import { AuditLogEntity } from '@infrastructure/persistence/typeorm/entity/audit-log.entity';
import { AdminCommonModule } from '@yeirin/admin-common';
import { AdminAuditLogModule } from './audit-log/admin-audit-log.module';
import { AdminCounselRequestModule } from './counsel-request/admin-counsel-request.module';
import { AdminDashboardModule } from './dashboard/admin-dashboard.module';
import { AdminInstitutionModule } from './institution/admin-institution.module';
import { AdminStatisticsModule } from './statistics/admin-statistics.module';
import { AdminUserModule } from './user/admin-user.module';

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

    // Admin Sub-Modules
    AdminUserModule,
    AdminCounselRequestModule,
    AdminInstitutionModule,
    AdminStatisticsModule,
    AdminAuditLogModule,
    AdminDashboardModule,
  ],
  providers: [AuditService],
  exports: [AuditService],
})
export class AdminApiModule {}
