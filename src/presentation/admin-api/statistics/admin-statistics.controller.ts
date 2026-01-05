import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GetChildDemographicsUseCase } from '@application/admin-statistics/get-child-demographics.usecase';
import { GetCounselRequestStatisticsUseCase } from '@application/admin-statistics/get-counsel-request-statistics.usecase';
import { GetInstitutionPerformanceUseCase } from '@application/admin-statistics/get-institution-performance.usecase';
import { GetUserStatisticsUseCase } from '@application/admin-statistics/get-user-statistics.usecase';
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
 * Admin Statistics Controller
 * 통계 조회 Admin API
 *
 * @route /admin/statistics
 */
@ApiTags('Admin - 통계')
@Controller('api/v1/admin/statistics')
@UseGuards(AdminPermissionGuard)
@UseInterceptors(AdminAuditInterceptor)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminStatisticsController {
  constructor(
    private readonly getUserStatisticsUseCase: GetUserStatisticsUseCase,
    private readonly getCounselRequestStatisticsUseCase: GetCounselRequestStatisticsUseCase,
    private readonly getInstitutionPerformanceUseCase: GetInstitutionPerformanceUseCase,
    private readonly getChildDemographicsUseCase: GetChildDemographicsUseCase,
  ) {}

  /**
   * 사용자 통계 조회
   */
  @Get('users')
  @AdminPermissions(ADMIN_PERMISSIONS.STATISTICS_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '사용자 통계 조회',
    description: '역할별 분포, 가입 추이, 활동 현황 등 사용자 관련 통계를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getUserStatistics(@Query() query: AdminDateRangeQueryDto) {
    return this.getUserStatisticsUseCase.execute(query);
  }

  /**
   * 상담의뢰 통계 조회
   */
  @Get('counsel-requests')
  @AdminPermissions(ADMIN_PERMISSIONS.STATISTICS_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '상담의뢰 통계 조회',
    description: '상태별 분포, 추이, 전환율 분석 등 상담의뢰 관련 통계를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getCounselRequestStatistics(@Query() query: AdminDateRangeQueryDto) {
    return this.getCounselRequestStatisticsUseCase.execute(query);
  }

  /**
   * 기관 성과 통계 조회
   */
  @Get('institutions')
  @AdminPermissions(ADMIN_PERMISSIONS.STATISTICS_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '기관 성과 통계 조회',
    description: '기관별 매칭률, 완료율, 평점 등 성과 분석을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getInstitutionPerformance(@Query() query: AdminDateRangeQueryDto) {
    return this.getInstitutionPerformanceUseCase.execute({
      startDate: query.startDate,
      endDate: query.endDate,
      sortBy: query.sortBy as 'totalCounsel' | 'completionRate' | 'rating' | undefined,
      limit: query.limit,
    });
  }

  /**
   * 아동 인구통계 조회
   */
  @Get('children')
  @AdminPermissions(ADMIN_PERMISSIONS.STATISTICS_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '아동 인구통계 조회',
    description: '유형별, 심리상태별, 시설별 아동 분포 통계를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getChildDemographics(@Query() _query: AdminDateRangeQueryDto) {
    return this.getChildDemographicsUseCase.execute();
  }
}
