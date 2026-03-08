import {
  Controller,
  Get,
  Post,
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
import {
  CreateVoucherLinkageDto,
  UpdateVoucherLinkageDto,
  CompleteVoucherLinkageDto,
} from '@application/counsel-request/admin/dto/voucher-linkage.dto';
import { GetCounselRequestDetailAdminUseCase } from '@application/counsel-request/admin/get-counsel-request-detail.admin.usecase';
import { GetCounselRequestsAdminUseCase } from '@application/counsel-request/admin/get-counsel-requests.admin.usecase';
import { GetLinkageInfoStatusAdminUseCase } from '@application/counsel-request/admin/get-linkage-info-status.admin.usecase';
import { GetVoucherLinkageStatusAdminUseCase } from '@application/counsel-request/admin/get-voucher-linkage-status.admin.usecase';
import { UpdateCounselRequestStatusAdminUseCase } from '@application/counsel-request/admin/update-status.admin.usecase';
import { CreateVoucherLinkageAdminUseCase } from '@application/counsel-request/admin/create-voucher-linkage.admin.usecase';
import { UpdateVoucherLinkageAdminUseCase } from '@application/counsel-request/admin/update-voucher-linkage.admin.usecase';
import { LinkageInfoStatusQueryDto } from '@application/counsel-request/admin/dto/linkage-info-status-query.dto';
import { VoucherLinkageStatusQueryDto } from '@application/counsel-request/admin/dto/voucher-linkage-status-query.dto';
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
    private readonly createVoucherLinkageUseCase: CreateVoucherLinkageAdminUseCase,
    private readonly updateVoucherLinkageUseCase: UpdateVoucherLinkageAdminUseCase,
    private readonly getLinkageInfoStatusUseCase: GetLinkageInfoStatusAdminUseCase,
    private readonly getVoucherLinkageStatusUseCase: GetVoucherLinkageStatusAdminUseCase,
  ) {}

  /**
   * 구/군 목록 조회
   */
  @Get('districts')
  @AdminPermissions(ADMIN_PERMISSIONS.COUNSEL_REQUEST_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '구/군 목록 조회',
    description: '상담의뢰 필터링에 사용할 구/군 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getDistricts(): Promise<string[]> {
    return this.getCounselRequestsUseCase.getDistricts();
  }

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

  // ============================================
  // 바우처 연계 현황 조회
  // ============================================

  /**
   * 연계정보입력 현황 (기관별 집계)
   */
  @Get('voucher/linkage-info-status')
  @AdminPermissions(ADMIN_PERMISSIONS.COUNSEL_REQUEST_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '연계정보입력 현황 조회',
    description: '기관별 바우처 대상 아동의 연계정보 제출률을 집계합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getLinkageInfoStatus(@Query() query: LinkageInfoStatusQueryDto) {
    return this.getLinkageInfoStatusUseCase.execute(query);
  }

  /**
   * 연계현황 (개별 아동)
   */
  @Get('voucher/linkage-status')
  @AdminPermissions(ADMIN_PERMISSIONS.COUNSEL_REQUEST_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '연계현황 조회',
    description: '보호자 제출 정보 및 선택 기관 정보를 포함한 연계현황을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getVoucherLinkageStatus(@Query() query: VoucherLinkageStatusQueryDto) {
    return this.getVoucherLinkageStatusUseCase.execute(query);
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

  // ============================================
  // 바우처 연계 관리
  // ============================================

  /**
   * 바우처 연계 정보 생성
   */
  @Post(':id/voucher-linkage')
  @AdminPermissions(ADMIN_PERMISSIONS.COUNSEL_REQUEST_UPDATE_STATUS)
  @AuditAction('CREATE_VOUCHER_LINKAGE', 'VoucherLinkage', {
    level: 'NORMAL',
    description: '바우처 연계 정보 생성',
  })
  @ApiOperation({
    summary: '바우처 연계 정보 생성',
    description: '바우처 추천대상 상담의뢰지에 연계 정보를 생성합니다 (연계대기 상태).',
  })
  @ApiResponse({ status: 201, description: '연계 정보 생성 성공' })
  @ApiResponse({ status: 400, description: '바우처 추천대상이 아니거나 이미 연계 정보 존재' })
  @ApiResponse({ status: 404, description: '상담의뢰를 찾을 수 없음' })
  async createVoucherLinkage(
    @Param('id', ParseUUIDPipe) counselRequestId: string,
    @Body() dto: CreateVoucherLinkageDto,
    @CurrentUser('userId') adminId: string,
  ) {
    return this.createVoucherLinkageUseCase.execute(counselRequestId, dto, adminId);
  }

  /**
   * 바우처 연계 정보 수정
   */
  @Patch(':id/voucher-linkage')
  @AdminPermissions(ADMIN_PERMISSIONS.COUNSEL_REQUEST_UPDATE_STATUS)
  @AuditAction('UPDATE_VOUCHER_LINKAGE', 'VoucherLinkage', {
    level: 'NORMAL',
    description: '바우처 연계 정보 수정',
  })
  @ApiOperation({
    summary: '바우처 연계 정보 수정',
    description: '바우처 연계 정보를 수정합니다.',
  })
  @ApiResponse({ status: 200, description: '연계 정보 수정 성공' })
  @ApiResponse({ status: 404, description: '연계 정보를 찾을 수 없음' })
  async updateVoucherLinkage(
    @Param('id', ParseUUIDPipe) counselRequestId: string,
    @Body() dto: UpdateVoucherLinkageDto,
    @CurrentUser('userId') adminId: string,
  ) {
    return this.updateVoucherLinkageUseCase.execute(counselRequestId, dto, adminId);
  }

  /**
   * 바우처 연계 완료 처리
   */
  @Post(':id/voucher-linkage/complete')
  @AdminPermissions(ADMIN_PERMISSIONS.COUNSEL_REQUEST_UPDATE_STATUS)
  @AuditAction('COMPLETE_VOUCHER_LINKAGE', 'VoucherLinkage', {
    level: 'HIGH',
    description: '바우처 연계 완료 처리',
  })
  @ApiOperation({
    summary: '바우처 연계 완료 처리',
    description: '바우처 연계를 완료 상태로 변경합니다. 연계 기관 정보가 필수입니다.',
  })
  @ApiResponse({ status: 200, description: '연계 완료 처리 성공' })
  @ApiResponse({ status: 400, description: '이미 연계 완료 상태' })
  @ApiResponse({ status: 404, description: '연계 정보를 찾을 수 없음' })
  async completeVoucherLinkage(
    @Param('id', ParseUUIDPipe) counselRequestId: string,
    @Body() dto: CompleteVoucherLinkageDto,
    @CurrentUser('userId') adminId: string,
  ) {
    return this.updateVoucherLinkageUseCase.completeLinkage(counselRequestId, dto, adminId);
  }
}
