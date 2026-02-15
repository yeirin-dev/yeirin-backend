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
import { AdminSessionService } from './admin-session.service';
import { AdminSessionQueryDto } from './dto/admin-session-query.dto';
import type {
  PaginatedSessionsDto,
  AdminSessionStatsDto,
  AdminSessionDetailDto,
} from './dto/admin-session-response.dto';

/**
 * Admin Session Controller
 * 채팅 세션 조회 Admin API
 *
 * @route /admin/sessions
 */
@ApiTags('Admin - 채팅 세션')
@Controller('admin/sessions')
@UseGuards(AdminJwtAuthGuard, AdminPermissionGuard)
@UseInterceptors(AdminAuditInterceptor)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminSessionController {
  constructor(private readonly adminSessionService: AdminSessionService) {}

  /**
   * 세션 통계 조회
   */
  @Get('stats')
  @AdminPermissions(ADMIN_PERMISSIONS.STATISTICS_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '세션 통계 조회',
    description: '전체 채팅 세션 통계를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getSessionStats(): Promise<AdminSessionStatsDto> {
    return this.adminSessionService.getSessionStats();
  }

  /**
   * 세션 목록 조회
   */
  @Get()
  @AdminPermissions(ADMIN_PERMISSIONS.STATISTICS_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '세션 목록 조회',
    description: '페이지네이션을 지원하는 전체 채팅 세션 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getSessions(@Query() query: AdminSessionQueryDto): Promise<PaginatedSessionsDto> {
    return this.adminSessionService.getSessions(query);
  }

  /**
   * 세션 상세 조회
   */
  @Get(':id')
  @AdminPermissions(ADMIN_PERMISSIONS.STATISTICS_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '세션 상세 조회',
    description: '채팅 세션 ID로 상세 정보와 메시지를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '세션을 찾을 수 없음' })
  async getSessionDetail(@Param('id') id: string): Promise<AdminSessionDetailDto> {
    return this.adminSessionService.getSessionDetail(id);
  }
}
