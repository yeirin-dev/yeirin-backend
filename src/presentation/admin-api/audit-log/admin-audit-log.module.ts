import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from '@infrastructure/persistence/typeorm/entity/audit-log.entity';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { AdminAuditLogController } from './admin-audit-log.controller';

/**
 * Admin Audit Log Module
 * 감사 로그 조회 Admin API
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLogEntity]),
    forwardRef(() => AdminAuthModule),
  ],
  controllers: [AdminAuditLogController],
  providers: [],
})
export class AdminAuditLogModule {}
