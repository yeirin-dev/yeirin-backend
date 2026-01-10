import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CounselReportEntity } from '@infrastructure/persistence/typeorm/entity/counsel-report.entity';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { AdminCounselReportController } from './admin-counsel-report.controller';

/**
 * Admin Counsel Report Module
 * 상담보고서 관리 Admin API
 *
 * @route /admin/counsel-reports
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([CounselReportEntity, ChildProfileEntity]),
    forwardRef(() => AdminAuthModule),
  ],
  controllers: [AdminCounselReportController],
  providers: [],
})
export class AdminCounselReportModule {}
