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
import { CareFacilityEntity } from '@infrastructure/persistence/typeorm/entity/care-facility.entity';
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
 * Admin Care Facility Controller
 * 양육시설 관리 Admin API
 *
 * @route /admin/care-facilities
 */
@ApiTags('Admin - 양육시설 관리')
@Controller('admin/care-facilities')
@UseGuards(AdminJwtAuthGuard, AdminPermissionGuard)
@UseInterceptors(AdminAuditInterceptor)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminCareFacilityController {
  private readonly logger = new Logger(AdminCareFacilityController.name);

  constructor(
    @InjectRepository(CareFacilityEntity)
    private readonly careFacilityRepository: Repository<CareFacilityEntity>,
  ) {}

  /**
   * 양육시설 목록 조회
   */
  @Get()
  @AdminPermissions(ADMIN_PERMISSIONS.INSTITUTION_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '양육시설 목록 조회',
    description: '전체 양육시설 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getCareFacilities(@Query() query: InstitutionQueryDto) {
    const { page = 1, limit = 20, search, district, isActive } = query;

    const where: FindOptionsWhere<CareFacilityEntity> = {};

    if (search) {
      where.name = Like(`%${search}%`);
    }
    if (district) {
      where.district = district;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await this.careFacilityRepository.findAndCount({
      where,
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['children'],
    });

    // 프론트엔드 형식에 맞게 변환
    const items = data.map((facility) => ({
      id: facility.id,
      type: 'CARE_FACILITY' as const,
      name: facility.name,
      district: facility.district,
      address: facility.address,
      addressDetail: facility.addressDetail,
      postalCode: facility.postalCode || '',
      representativeName: facility.representativeName,
      contactPhone: facility.phoneNumber,
      phoneNumber: facility.phoneNumber,
      capacity: facility.capacity,
      establishedDate: facility.establishedDate?.toISOString() || null,
      introduction: facility.introduction,
      isActive: facility.isActive,
      isPasswordChanged: facility.isPasswordChanged,
      childCount: facility.children?.length || 0,
      childrenCount: facility.children?.length || 0,
      createdAt: facility.createdAt.toISOString(),
      updatedAt: facility.updatedAt.toISOString(),
    }));

    return AdminPaginatedResponseDto.of(items, total, page, limit);
  }

  /**
   * 양육시설 상세 조회
   */
  @Get(':id')
  @AdminPermissions(ADMIN_PERMISSIONS.INSTITUTION_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '양육시설 상세 조회',
    description: '특정 양육시설의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '기관을 찾을 수 없음' })
  async getCareFacility(@Param('id', ParseUUIDPipe) id: string) {
    const facility = await this.careFacilityRepository.findOne({
      where: { id },
      relations: ['children'],
    });

    if (!facility) {
      return { error: '양육시설을 찾을 수 없습니다', statusCode: 404 };
    }

    return {
      id: facility.id,
      type: 'CARE_FACILITY' as const,
      name: facility.name,
      district: facility.district,
      address: facility.address,
      addressDetail: facility.addressDetail,
      postalCode: facility.postalCode || '',
      representativeName: facility.representativeName,
      contactPhone: facility.phoneNumber,
      phoneNumber: facility.phoneNumber,
      capacity: facility.capacity,
      establishedDate: facility.establishedDate?.toISOString() || null,
      introduction: facility.introduction,
      isActive: facility.isActive,
      isPasswordChanged: facility.isPasswordChanged,
      childCount: facility.children?.length || 0,
      childrenCount: facility.children?.length || 0,
      createdAt: facility.createdAt.toISOString(),
      updatedAt: facility.updatedAt.toISOString(),
    };
  }

  /**
   * 양육시설 비밀번호 초기화
   */
  @Post(':id/reset-password')
  @AdminPermissions(ADMIN_PERMISSIONS.INSTITUTION_UPDATE)
  @AuditAction('RESET_PASSWORD', 'CareFacility', {
    level: 'HIGH',
    description: '양육시설 비밀번호 초기화',
  })
  @ApiOperation({
    summary: '양육시설 비밀번호 초기화',
    description: '양육시설의 비밀번호를 임시 비밀번호로 초기화합니다.',
  })
  @ApiResponse({ status: 200, description: '초기화 성공' })
  @ApiResponse({ status: 404, description: '기관을 찾을 수 없음' })
  async resetPassword(@Param('id', ParseUUIDPipe) id: string): Promise<PasswordResetResponseDto> {
    const facility = await this.careFacilityRepository.findOne({ where: { id } });

    if (!facility) {
      throw new Error('양육시설을 찾을 수 없습니다');
    }

    // 임시 비밀번호 생성 (8자리 랜덤)
    const temporaryPassword = this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // 비밀번호 업데이트 및 isPasswordChanged 초기화
    await this.careFacilityRepository.update(id, {
      password: hashedPassword,
      isPasswordChanged: false,
    });

    this.logger.log(`양육시설 비밀번호 초기화: ${facility.name} (${id})`);

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
}
