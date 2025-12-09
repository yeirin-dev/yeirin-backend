import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '@infrastructure/auth/decorators/current-user.decorator';
import { Roles } from '@infrastructure/auth/decorators/roles.decorator';
import {
  AdminPermissions,
  AdminPermissionGuard,
  AdminAuditInterceptor,
  AuditAction,
  SkipAdminAudit,
  ADMIN_PERMISSIONS,
  AdminPaginationQueryDto,
} from '@yeirin/admin-common';

/**
 * Admin Institution Controller
 * 기관 관리 Admin API
 *
 * @route /admin/institutions
 */
@ApiTags('Admin - 기관 관리')
@Controller('api/v1/admin/institutions')
@UseGuards(AdminPermissionGuard)
@UseInterceptors(AdminAuditInterceptor)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminInstitutionController {
  /**
   * 기관 목록 조회
   */
  @Get()
  @AdminPermissions(ADMIN_PERMISSIONS.INSTITUTION_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '기관 목록 조회',
    description: '전체 바우처 기관 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getInstitutions(@Query() query: AdminPaginationQueryDto) {
    // TODO: Implement use case
    return { message: 'Not implemented yet', query };
  }

  /**
   * 기관 상세 조회
   */
  @Get(':id')
  @AdminPermissions(ADMIN_PERMISSIONS.INSTITUTION_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '기관 상세 조회',
    description: '특정 기관의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '기관을 찾을 수 없음' })
  async getInstitutionDetail(@Param('id', ParseUUIDPipe) id: string) {
    // TODO: Implement use case
    return { message: 'Not implemented yet', id };
  }

  /**
   * 기관 활성화
   */
  @Post(':id/activate')
  @AdminPermissions(ADMIN_PERMISSIONS.INSTITUTION_ACTIVATE)
  @AuditAction('ACTIVATE', 'Institution', { level: 'HIGH' })
  @ApiOperation({
    summary: '기관 활성화',
    description: '비활성화된 기관을 활성화합니다.',
  })
  @ApiResponse({ status: 200, description: '활성화 성공' })
  async activateInstitution(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') adminId: string,
  ) {
    // TODO: Implement use case
    return { message: 'Not implemented yet', id, adminId };
  }

  /**
   * 기관 비활성화
   */
  @Post(':id/deactivate')
  @AdminPermissions(ADMIN_PERMISSIONS.INSTITUTION_DEACTIVATE)
  @AuditAction('DEACTIVATE', 'Institution', { level: 'HIGH' })
  @ApiOperation({
    summary: '기관 비활성화',
    description: '기관을 비활성화합니다.',
  })
  @ApiResponse({ status: 200, description: '비활성화 성공' })
  async deactivateInstitution(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') adminId: string,
  ) {
    // TODO: Implement use case
    return { message: 'Not implemented yet', id, adminId };
  }
}
