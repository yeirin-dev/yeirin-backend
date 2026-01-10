import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Roles } from '@infrastructure/auth/decorators/roles.decorator';
import { CommunityChildCenterEntity } from '@infrastructure/persistence/typeorm/entity/community-child-center.entity';
import {
  AdminPermissions,
  AdminPermissionGuard,
  AdminAuditInterceptor,
  AuditAction,
  SkipAdminAudit,
  ADMIN_PERMISSIONS,
  AdminPaginatedResponseDto,
} from '@yeirin/admin-common';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { InstitutionQueryDto, PasswordResetResponseDto } from './dto/institution-query.dto';

/**
 * Admin Community Center Controller
 * 지역아동센터 관리 Admin API
 *
 * @route /admin/community-centers
 */
@ApiTags('Admin - 지역아동센터 관리')
@Controller('admin/community-centers')
@UseGuards(AdminJwtAuthGuard, AdminPermissionGuard)
@UseInterceptors(AdminAuditInterceptor)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminCommunityCenterController {
  private readonly logger = new Logger(AdminCommunityCenterController.name);

  constructor(
    @InjectRepository(CommunityChildCenterEntity)
    private readonly communityCenterRepository: Repository<CommunityChildCenterEntity>,
  ) {}

  /**
   * 지역아동센터 목록 조회
   */
  @Get()
  @AdminPermissions(ADMIN_PERMISSIONS.INSTITUTION_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '지역아동센터 목록 조회',
    description: '전체 지역아동센터 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getCommunityCenters(@Query() query: InstitutionQueryDto) {
    const { page = 1, limit = 20, search, district, region, isActive } = query;

    const where: FindOptionsWhere<CommunityChildCenterEntity> = {};

    if (search) {
      where.name = Like(`%${search}%`);
    }
    if (district) {
      where.district = district;
    }
    if (region) {
      where.region = region;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await this.communityCenterRepository.findAndCount({
      where,
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['children'],
    });

    // 프론트엔드 형식에 맞게 변환
    const items = data.map((center) => ({
      id: center.id,
      type: 'COMMUNITY_CENTER' as const,
      name: center.name,
      district: center.district,
      region: center.region,
      address: center.address,
      addressDetail: center.addressDetail,
      postalCode: center.postalCode || '',
      directorName: center.directorName,
      managerName: center.managerName,
      managerPhone: center.managerPhone,
      contactPhone: center.phoneNumber,
      phoneNumber: center.phoneNumber,
      email: center.email,
      expectedChildCount: center.expectedChildCount,
      capacity: center.capacity,
      establishedDate: this.formatDate(center.establishedDate),
      introduction: center.introduction,
      operatingHours: center.operatingHours,
      isActive: center.isActive,
      isPasswordChanged: center.isPasswordChanged,
      childCount: center.children?.length || 0,
      childrenCount: center.children?.length || 0,
      createdAt: center.createdAt.toISOString(),
      updatedAt: center.updatedAt.toISOString(),
    }));

    return AdminPaginatedResponseDto.of(items, total, page, limit);
  }

  /**
   * 지역아동센터 상세 조회
   */
  @Get(':id')
  @AdminPermissions(ADMIN_PERMISSIONS.INSTITUTION_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '지역아동센터 상세 조회',
    description: '특정 지역아동센터의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '기관을 찾을 수 없음' })
  async getCommunityCenter(@Param('id', ParseUUIDPipe) id: string) {
    const center = await this.communityCenterRepository.findOne({
      where: { id },
      relations: ['children'],
    });

    if (!center) {
      return { error: '지역아동센터를 찾을 수 없습니다', statusCode: 404 };
    }

    return {
      id: center.id,
      type: 'COMMUNITY_CENTER' as const,
      name: center.name,
      district: center.district,
      region: center.region,
      address: center.address,
      addressDetail: center.addressDetail,
      postalCode: center.postalCode || '',
      directorName: center.directorName,
      managerName: center.managerName,
      managerPhone: center.managerPhone,
      contactPhone: center.phoneNumber,
      phoneNumber: center.phoneNumber,
      email: center.email,
      expectedChildCount: center.expectedChildCount,
      capacity: center.capacity,
      establishedDate: this.formatDate(center.establishedDate),
      introduction: center.introduction,
      operatingHours: center.operatingHours,
      isActive: center.isActive,
      isPasswordChanged: center.isPasswordChanged,
      childCount: center.children?.length || 0,
      childrenCount: center.children?.length || 0,
      createdAt: center.createdAt.toISOString(),
      updatedAt: center.updatedAt.toISOString(),
    };
  }

  /**
   * 지역아동센터 비밀번호 초기화
   */
  @Post(':id/reset-password')
  @AdminPermissions(ADMIN_PERMISSIONS.INSTITUTION_UPDATE)
  @AuditAction('RESET_PASSWORD', 'CommunityCenter', {
    level: 'HIGH',
    description: '지역아동센터 비밀번호 초기화',
  })
  @ApiOperation({
    summary: '지역아동센터 비밀번호 초기화',
    description: '지역아동센터의 비밀번호를 임시 비밀번호로 초기화합니다.',
  })
  @ApiResponse({ status: 200, description: '초기화 성공' })
  @ApiResponse({ status: 404, description: '기관을 찾을 수 없음' })
  async resetPassword(@Param('id', ParseUUIDPipe) id: string): Promise<PasswordResetResponseDto> {
    const center = await this.communityCenterRepository.findOne({ where: { id } });

    if (!center) {
      throw new Error('지역아동센터를 찾을 수 없습니다');
    }

    // 임시 비밀번호 생성 (8자리 랜덤)
    const temporaryPassword = this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // 비밀번호 업데이트 및 isPasswordChanged 초기화
    await this.communityCenterRepository.update(id, {
      password: hashedPassword,
      isPasswordChanged: false,
    });

    this.logger.log(`지역아동센터 비밀번호 초기화: ${center.name} (${id})`);

    // 만료 시간 (24시간 후)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
      temporaryPassword,
      expiresAt: expiresAt.toISOString(),
    };
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private formatDate(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    return date.toISOString().split('T')[0];
  }
}
