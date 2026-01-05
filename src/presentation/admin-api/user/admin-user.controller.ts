import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ActivateUserAdminUseCase } from '@application/user/admin/activate-user.admin.usecase';
import { BanUserAdminUseCase } from '@application/user/admin/ban-user.admin.usecase';
import { DeactivateUserAdminUseCase } from '@application/user/admin/deactivate-user.admin.usecase';
import { AdminBanUserDto } from '@application/user/admin/dto/admin-ban-user.dto';
import { AdminUserQueryDto } from '@application/user/admin/dto/admin-user-query.dto';
import { AdminUserResponseDto } from '@application/user/admin/dto/admin-user-response.dto';
import { GetUserDetailAdminUseCase } from '@application/user/admin/get-user-detail.admin.usecase';
import { GetUsersAdminUseCase } from '@application/user/admin/get-users.admin.usecase';
import { UnbanUserAdminUseCase } from '@application/user/admin/unban-user.admin.usecase';
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

/**
 * Admin User Controller
 * 사용자 관리 Admin API
 *
 * @route /admin/users
 */
@ApiTags('Admin - 사용자 관리')
@Controller('api/v1/admin/users')
@UseGuards(AdminPermissionGuard)
@UseInterceptors(AdminAuditInterceptor)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminUserController {
  constructor(
    private readonly getUsersUseCase: GetUsersAdminUseCase,
    private readonly getUserDetailUseCase: GetUserDetailAdminUseCase,
    private readonly banUserUseCase: BanUserAdminUseCase,
    private readonly unbanUserUseCase: UnbanUserAdminUseCase,
    private readonly activateUserUseCase: ActivateUserAdminUseCase,
    private readonly deactivateUserUseCase: DeactivateUserAdminUseCase,
  ) {}

  /**
   * 사용자 목록 조회
   */
  @Get()
  @AdminPermissions(ADMIN_PERMISSIONS.USER_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '사용자 목록 조회',
    description: '전체 사용자 목록을 필터링 및 페이지네이션으로 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getUsers(@Query() query: AdminUserQueryDto) {
    return this.getUsersUseCase.execute(query);
  }

  /**
   * 사용자 상세 조회
   */
  @Get(':id')
  @AdminPermissions(ADMIN_PERMISSIONS.USER_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '사용자 상세 조회',
    description: '특정 사용자의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공', type: AdminUserResponseDto })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async getUserDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.getUserDetailUseCase.execute(id);
  }

  /**
   * 사용자 정지
   */
  @Post(':id/ban')
  @AdminPermissions(ADMIN_PERMISSIONS.USER_BAN)
  @AuditAction('BAN', 'User', { level: 'HIGH', description: '사용자 계정 정지' })
  @ApiOperation({
    summary: '사용자 정지',
    description: '사용자 계정을 정지합니다. 정지 사유가 필수입니다.',
  })
  @ApiResponse({ status: 200, description: '정지 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async banUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminBanUserDto,
    @CurrentUser('userId') adminId: string,
  ) {
    return this.banUserUseCase.execute(id, dto, adminId);
  }

  /**
   * 사용자 정지 해제
   */
  @Post(':id/unban')
  @AdminPermissions(ADMIN_PERMISSIONS.USER_BAN)
  @AuditAction('UNBAN', 'User', { level: 'HIGH', description: '사용자 계정 정지 해제' })
  @ApiOperation({
    summary: '사용자 정지 해제',
    description: '정지된 사용자 계정의 정지를 해제합니다.',
  })
  @ApiResponse({ status: 200, description: '정지 해제 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async unbanUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.unbanUserUseCase.execute(id);
  }

  /**
   * 사용자 활성화
   */
  @Post(':id/activate')
  @AdminPermissions(ADMIN_PERMISSIONS.USER_ACTIVATE)
  @AuditAction('ACTIVATE', 'User', { level: 'HIGH', description: '사용자 계정 활성화' })
  @ApiOperation({
    summary: '사용자 활성화',
    description: '비활성화된 사용자 계정을 활성화합니다.',
  })
  @ApiResponse({ status: 200, description: '활성화 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async activateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') adminId: string,
  ) {
    return this.activateUserUseCase.execute(id, adminId);
  }

  /**
   * 사용자 비활성화
   */
  @Post(':id/deactivate')
  @AdminPermissions(ADMIN_PERMISSIONS.USER_DEACTIVATE)
  @AuditAction('DEACTIVATE', 'User', { level: 'HIGH', description: '사용자 계정 비활성화' })
  @ApiOperation({
    summary: '사용자 비활성화',
    description: '사용자 계정을 비활성화합니다.',
  })
  @ApiResponse({ status: 200, description: '비활성화 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async deactivateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') adminId: string,
  ) {
    return this.deactivateUserUseCase.execute(id, adminId);
  }
}
