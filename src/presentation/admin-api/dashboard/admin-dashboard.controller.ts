import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GetDashboardOverviewUseCase } from '@application/admin-statistics/get-dashboard-overview.usecase';
import { Roles } from '@infrastructure/auth/decorators/roles.decorator';
import {
  AdminPermissions,
  AdminPermissionGuard,
  AdminAuditInterceptor,
  SkipAdminAudit,
  ADMIN_PERMISSIONS,
  AdminDateRangeQueryDto,
} from '@yeirin/admin-common';

// Use Cases

/**
 * Admin Dashboard Controller
 * 대시보드 조회 Admin API
 *
 * @route /admin/dashboard
 */
@ApiTags('Admin - 대시보드')
@Controller('api/v1/admin/dashboard')
@UseGuards(AdminPermissionGuard)
@UseInterceptors(AdminAuditInterceptor)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminDashboardController {
  constructor(private readonly getDashboardOverviewUseCase: GetDashboardOverviewUseCase) {}

  /**
   * 대시보드 개요 조회
   */
  @Get()
  @AdminPermissions(ADMIN_PERMISSIONS.STATISTICS_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '대시보드 개요 조회',
    description: '관리자 대시보드의 주요 지표 요약을 조회합니다. 트렌드 및 알림 포함.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getDashboardOverview(@Query() query: AdminDateRangeQueryDto) {
    return this.getDashboardOverviewUseCase.execute(query);
  }
}
