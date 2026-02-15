import { Controller, Get, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '@infrastructure/auth/decorators/roles.decorator';
import {
  AdminPermissions,
  AdminPermissionGuard,
  AdminAuditInterceptor,
  SkipAdminAudit,
  ADMIN_PERMISSIONS,
} from '@yeirin/admin-common';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { AdminRiskManagementService } from './admin-risk-management.service';
import { AdminRiskLogQueryDto } from './dto/admin-risk-log-query.dto';
import type {
  PaginatedRiskLogsDto,
  AdminRiskStatsDto,
  AdminRiskLogDetailDto,
} from './dto/admin-risk-log-response.dto';

/**
 * Admin Risk Management Controller
 * 위험관리 - 아동 심리 상태 변경 이력 조회 API
 *
 * @route /admin/risk-logs
 */
@ApiTags('Admin - 위험관리')
@Controller('admin/risk-logs')
@UseGuards(AdminJwtAuthGuard, AdminPermissionGuard)
@UseInterceptors(AdminAuditInterceptor)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminRiskManagementController {
  constructor(private readonly adminRiskManagementService: AdminRiskManagementService) {}

  /**
   * 위험 로그 통계 조회
   */
  @Get('stats')
  @AdminPermissions(ADMIN_PERMISSIONS.STATISTICS_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '위험 로그 통계 조회',
    description: '전체 위험 로그 통계를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getStats(): Promise<AdminRiskStatsDto> {
    return this.adminRiskManagementService.getStats();
  }

  /**
   * 위험 로그 목록 조회
   */
  @Get()
  @AdminPermissions(ADMIN_PERMISSIONS.STATISTICS_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '위험 로그 목록 조회',
    description: '페이지네이션을 지원하는 위험 로그 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getRiskLogs(@Query() query: AdminRiskLogQueryDto): Promise<PaginatedRiskLogsDto> {
    return this.adminRiskManagementService.getRiskLogs(query);
  }

  /**
   * 위험 로그 상세 조회
   */
  @Get(':id')
  @AdminPermissions(ADMIN_PERMISSIONS.STATISTICS_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '위험 로그 상세 조회',
    description: '위험 로그 ID로 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '위험 로그를 찾을 수 없음' })
  async getRiskLogDetail(@Param('id') id: string): Promise<AdminRiskLogDetailDto> {
    return this.adminRiskManagementService.getRiskLogDetail(id);
  }
}
