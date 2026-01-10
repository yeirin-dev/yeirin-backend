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
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';

/**
 * Dashboard Stats Response DTO
 * 프론트엔드 DashboardStats 타입과 일치
 */
interface DashboardStatsResponse {
  counselRequests: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    rejected: number;
  };
  children: {
    total: number;
    careFacility: number;
    communityCenter: number;
    atRisk: number;
    highRisk: number;
  };
  institutions: {
    careFacilities: number;
    communityCenters: number;
    activeCareFacilities: number;
    activeCenters: number;
  };
  consents: {
    total: number;
    valid: number;
    revoked: number;
    pending: number;
  };
  sessions: {
    active: number;
    todayCreated: number;
    todayClosed: number;
  };
  assessments: {
    total: number;
    completed: number;
    inProgress: number;
    abandoned: number;
    completionRate: number;
    abandonmentRate: number;
  };
}

/**
 * Alert Item Response DTO
 */
interface AlertItemResponse {
  id: string;
  type: 'HIGH_RISK' | 'PIN_LOCKED' | 'CONSENT_EXPIRED' | 'STALE_SESSION';
  title: string;
  description: string;
  entityType: string;
  entityId: string;
  severity: 'critical' | 'warning' | 'info';
  createdAt: string;
}

/**
 * Admin Dashboard Controller
 * 대시보드 조회 Admin API
 *
 * @route /admin/dashboard
 */
@ApiTags('Admin - 대시보드')
@Controller('admin/dashboard')
@UseGuards(AdminJwtAuthGuard, AdminPermissionGuard)
@UseInterceptors(AdminAuditInterceptor)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminDashboardController {
  constructor(private readonly getDashboardOverviewUseCase: GetDashboardOverviewUseCase) {}

  /**
   * 대시보드 통계 조회
   */
  @Get('stats')
  @AdminPermissions(ADMIN_PERMISSIONS.STATISTICS_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '대시보드 통계 조회',
    description: '관리자 대시보드의 주요 통계를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getDashboardStats(@Query() query: AdminDateRangeQueryDto): Promise<DashboardStatsResponse> {
    const overview = await this.getDashboardOverviewUseCase.execute(query);

    // 프론트엔드 형식에 맞게 변환
    return {
      counselRequests: {
        total: overview.totalCounselRequests,
        pending: overview.pendingCounselRequests,
        inProgress: overview.inProgressCounselRequests,
        completed: overview.completedCounselRequests,
        rejected: overview.counselRequestsByStatus.find((s) => s.status === 'REJECTED')?.count || 0,
      },
      children: {
        total: overview.totalChildren,
        careFacility: 0, // TODO: Implement per-facility type count
        communityCenter: 0,
        atRisk: 0, // TODO: Implement risk level counts
        highRisk: 0,
      },
      institutions: {
        careFacilities: overview.totalInstitutions, // TODO: Split by facility type
        communityCenters: 0,
        activeCareFacilities: overview.activeInstitutions,
        activeCenters: 0,
      },
      consents: {
        total: 0, // TODO: Implement consent statistics
        valid: 0,
        revoked: 0,
        pending: 0,
      },
      sessions: {
        active: 0, // NOTE: Session stats from soul-e API
        todayCreated: 0,
        todayClosed: 0,
      },
      assessments: {
        total: 0, // NOTE: Assessment stats from soul-e API
        completed: 0,
        inProgress: 0,
        abandoned: 0,
        completionRate: 0,
        abandonmentRate: 0,
      },
    };
  }

  /**
   * 대시보드 알림 조회
   */
  @Get('alerts')
  @AdminPermissions(ADMIN_PERMISSIONS.STATISTICS_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '대시보드 알림 조회',
    description: '관리자 대시보드의 알림 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getDashboardAlerts(): Promise<AlertItemResponse[]> {
    const overview = await this.getDashboardOverviewUseCase.execute();

    // 기존 알림을 프론트엔드 형식으로 변환
    return overview.alerts.map((alert, index) => ({
      id: `alert-${index}-${Date.now()}`,
      type: this.mapAlertType(alert.entityType),
      title: this.getAlertTitle(alert.type),
      description: alert.message,
      entityType: alert.entityType || 'System',
      entityId: '',
      severity: this.mapSeverity(alert.type),
      createdAt: new Date().toISOString(),
    }));
  }

  /**
   * 대시보드 개요 조회 (레거시)
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

  private mapAlertType(
    entityType?: string,
  ): 'HIGH_RISK' | 'PIN_LOCKED' | 'CONSENT_EXPIRED' | 'STALE_SESSION' {
    switch (entityType) {
      case 'CounselRequest':
        return 'HIGH_RISK';
      case 'Child':
        return 'PIN_LOCKED';
      case 'Consent':
        return 'CONSENT_EXPIRED';
      case 'Session':
        return 'STALE_SESSION';
      default:
        return 'HIGH_RISK';
    }
  }

  private getAlertTitle(type: 'WARNING' | 'INFO' | 'CRITICAL'): string {
    switch (type) {
      case 'CRITICAL':
        return '긴급 알림';
      case 'WARNING':
        return '경고';
      default:
        return '알림';
    }
  }

  private mapSeverity(type: 'WARNING' | 'INFO' | 'CRITICAL'): 'critical' | 'warning' | 'info' {
    switch (type) {
      case 'CRITICAL':
        return 'critical';
      case 'WARNING':
        return 'warning';
      default:
        return 'info';
    }
  }
}
