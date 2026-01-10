import { Controller, Get, Query, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import { Repository, Between } from 'typeorm';
import { Roles } from '@infrastructure/auth/decorators/roles.decorator';
import { AuditLogEntity } from '@infrastructure/persistence/typeorm/entity/audit-log.entity';
import {
  AdminPermissions,
  AdminPermissionGuard,
  AdminAuditInterceptor,
  AuditAction,
  SkipAdminAudit,
  ADMIN_PERMISSIONS,
  AdminDateRangeQueryDto,
  AdminPaginatedResponseDto,
} from '@yeirin/admin-common';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';

/**
 * Admin Audit Log Controller
 * 감사 로그 조회 Admin API
 *
 * @route /admin/audit-logs
 */
@ApiTags('Admin - 감사 로그')
@Controller('admin/audit-logs')
@UseGuards(AdminJwtAuthGuard, AdminPermissionGuard)
@UseInterceptors(AdminAuditInterceptor)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminAuditLogController {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  /**
   * 감사 로그 목록 조회
   */
  @Get()
  @AdminPermissions(ADMIN_PERMISSIONS.AUDIT_LOG_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '감사 로그 목록 조회',
    description: '시스템 전체 감사 로그를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getAuditLogs(@Query() query: AdminDateRangeQueryDto) {
    const { page = 1, limit = 20, startDate, endDate, sortBy, sortOrder } = query;

    const whereCondition: Record<string, unknown> = {};

    if (startDate && endDate) {
      whereCondition.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const [data, total] = await this.auditLogRepository.findAndCount({
      where: whereCondition,
      order: { [sortBy || 'createdAt']: sortOrder || 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return AdminPaginatedResponseDto.of(data, total, page, limit);
  }

  /**
   * 감사 로그 내보내기 (CSV)
   */
  @Get('export')
  @AdminPermissions(ADMIN_PERMISSIONS.AUDIT_LOG_EXPORT)
  @AuditAction('EXPORT', 'AuditLog', { level: 'HIGH', description: '감사 로그 내보내기' })
  @ApiOperation({
    summary: '감사 로그 내보내기',
    description: '감사 로그를 CSV 파일로 내보냅니다.',
  })
  @ApiResponse({ status: 200, description: '내보내기 성공' })
  async exportAuditLogs(@Query() query: AdminDateRangeQueryDto, @Res() res: Response) {
    const { startDate, endDate } = query;

    const whereCondition: Record<string, unknown> = {};

    if (startDate && endDate) {
      whereCondition.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const logs = await this.auditLogRepository.find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
      take: 10000, // 최대 10,000건
    });

    // CSV 헤더
    const headers = [
      'ID',
      'Action',
      'EntityType',
      'EntityId',
      'UserId',
      'UserEmail',
      'UserRole',
      'Description',
      'IsSuccess',
      'ErrorMessage',
      'CreatedAt',
    ].join(',');

    // CSV 데이터
    const rows = logs.map((log) =>
      [
        log.id,
        log.action,
        log.entityType,
        log.entityId || '',
        log.userId || '',
        log.userEmail || '',
        log.userRole || '',
        `"${(log.description || '').replace(/"/g, '""')}"`,
        log.isSuccess,
        `"${(log.errorMessage || '').replace(/"/g, '""')}"`,
        log.createdAt.toISOString(),
      ].join(','),
    );

    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`,
    );
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8 support
  }
}
