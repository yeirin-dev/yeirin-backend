import { Module } from '@nestjs/common';
import { GetInstitutionDashboardUseCase } from '@application/institution-dashboard/use-case/get-institution-dashboard.usecase';
import { ChildModule } from '@presentation/child/child.module';
import { CounselRequestModule } from '@presentation/counsel-request/counsel-request.module';
import { InstitutionDashboardController } from './institution-dashboard.controller';

/**
 * 시설 대시보드 모듈
 */
@Module({
  imports: [ChildModule, CounselRequestModule],
  controllers: [InstitutionDashboardController],
  providers: [GetInstitutionDashboardUseCase],
})
export class InstitutionDashboardModule {}
