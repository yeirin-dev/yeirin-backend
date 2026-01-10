import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminCounselRequestQueryDto } from '@application/counsel-request/admin/dto/admin-counsel-request-query.dto';
import { AdminUpdateCounselRequestStatusDto } from '@application/counsel-request/admin/dto/admin-update-status.dto';
import { GetCounselRequestDetailAdminUseCase } from '@application/counsel-request/admin/get-counsel-request-detail.admin.usecase';
import { GetCounselRequestsAdminUseCase } from '@application/counsel-request/admin/get-counsel-requests.admin.usecase';
import { UpdateCounselRequestStatusAdminUseCase } from '@application/counsel-request/admin/update-status.admin.usecase';
import { CurrentUser } from '@infrastructure/auth/decorators/current-user.decorator';
import { Roles } from '@infrastructure/auth/decorators/roles.decorator';
import {
  AdminPermissions,
  AdminPermissionGuard,
  AdminAuditInterceptor,
  AuditAction,
  SkipAdminAudit,
  ADMIN_PERMISSIONS,
} from '@yeirin/admin-common';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';

/**
 * Admin Counsel Request Controller
 * 상담의뢰 관리 Admin API
 *
 * @route /admin/counsel-requests
 */
@ApiTags('Admin - 상담의뢰 관리')
@Controller('admin/counsel-requests')
@UseGuards(AdminJwtAuthGuard, AdminPermissionGuard)
@UseInterceptors(AdminAuditInterceptor)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminCounselRequestController {
  constructor(
    private readonly getCounselRequestsUseCase: GetCounselRequestsAdminUseCase,
    private readonly getCounselRequestDetailUseCase: GetCounselRequestDetailAdminUseCase,
    private readonly updateStatusUseCase: UpdateCounselRequestStatusAdminUseCase,
  ) {}

  /**
   * 상담의뢰 목록 조회
   */
  @Get()
  @AdminPermissions(ADMIN_PERMISSIONS.COUNSEL_REQUEST_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '상담의뢰 목록 조회',
    description: '전체 상담의뢰 목록을 상태별, 기간별로 필터링하여 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getCounselRequests(@Query() query: AdminCounselRequestQueryDto) {
    return this.getCounselRequestsUseCase.execute(query);
  }

  /**
   * 상담의뢰 상세 조회
   */
  @Get(':id')
  @AdminPermissions(ADMIN_PERMISSIONS.COUNSEL_REQUEST_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '상담의뢰 상세 조회',
    description: '특정 상담의뢰의 상세 정보와 히스토리를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '상담의뢰를 찾을 수 없음' })
  async getCounselRequestDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.getCounselRequestDetailUseCase.execute(id);
  }

  /**
   * 상담의뢰 상태 강제 변경
   */
  @Patch(':id/status')
  @AdminPermissions(ADMIN_PERMISSIONS.COUNSEL_REQUEST_UPDATE_STATUS)
  @AuditAction('FORCE_STATUS_CHANGE', 'CounselRequest', {
    level: 'HIGH',
    description: '상담의뢰 상태 강제 변경',
  })
  @ApiOperation({
    summary: '상담의뢰 상태 강제 변경',
    description: 'Admin 권한으로 상담의뢰 상태를 강제 변경합니다. 변경 사유가 필수입니다.',
  })
  @ApiResponse({ status: 200, description: '상태 변경 성공' })
  @ApiResponse({ status: 400, description: '잘못된 상태 전환' })
  @ApiResponse({ status: 404, description: '상담의뢰를 찾을 수 없음' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateCounselRequestStatusDto,
    @CurrentUser('userId') adminId: string,
  ) {
    return this.updateStatusUseCase.execute(id, dto, adminId);
  }
}
