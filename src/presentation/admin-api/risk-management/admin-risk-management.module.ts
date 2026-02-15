import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PsychologicalStatusLogEntity } from '@infrastructure/persistence/typeorm/entity/psychological-status-log.entity';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { AdminRiskManagementController } from './admin-risk-management.controller';
import { AdminRiskManagementService } from './admin-risk-management.service';

/**
 * Admin Risk Management Module
 * 위험관리 - 아동 심리 상태 변경 이력 조회 Admin API
 *
 * yeirin DB의 psychological_status_logs 테이블을 직접 조회
 *
 * @route /admin/risk-logs
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PsychologicalStatusLogEntity]),
    forwardRef(() => AdminAuthModule),
  ],
  controllers: [AdminRiskManagementController],
  providers: [AdminRiskManagementService],
})
export class AdminRiskManagementModule {}
