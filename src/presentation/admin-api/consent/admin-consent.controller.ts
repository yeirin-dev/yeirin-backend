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
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, IsNull, Not, In } from 'typeorm';
import { Roles } from '@infrastructure/auth/decorators/roles.decorator';
import { ChildConsentEntity } from '@infrastructure/persistence/typeorm/entity/child-consent.entity';
import { ConsentHistoryEntity } from '@infrastructure/persistence/typeorm/entity/consent-history.entity';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { ConsentAction } from '@infrastructure/persistence/typeorm/entity/enums/consent-action.enum';
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
import { ConsentQueryDto, RevokeConsentDto } from './dto/consent-query.dto';

/**
 * Admin Consent Controller
 * 동의 관리 Admin API
 *
 * @route /admin/consents
 */
@ApiTags('Admin - 동의 관리')
@Controller('admin/consents')
@UseGuards(AdminJwtAuthGuard, AdminPermissionGuard)
@UseInterceptors(AdminAuditInterceptor)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminConsentController {
  private readonly logger = new Logger(AdminConsentController.name);

  constructor(
    @InjectRepository(ChildConsentEntity)
    private readonly consentRepository: Repository<ChildConsentEntity>,
    @InjectRepository(ConsentHistoryEntity)
    private readonly historyRepository: Repository<ConsentHistoryEntity>,
    @InjectRepository(ChildProfileEntity)
    private readonly childRepository: Repository<ChildProfileEntity>,
  ) {}

  /**
   * 동의 목록 조회
   */
  @Get()
  @AdminPermissions(ADMIN_PERMISSIONS.CONSENT_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '동의 목록 조회',
    description: '전체 동의 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getConsents(@Query() query: ConsentQueryDto) {
    const { page = 1, limit = 20, childId, role, isRevoked } = query;

    const where: FindOptionsWhere<ChildConsentEntity> = {};

    if (childId) {
      where.childId = childId;
    }
    if (role) {
      where.role = role;
    }
    if (isRevoked === true) {
      where.revokedAt = Not(IsNull());
    } else if (isRevoked === false) {
      where.revokedAt = IsNull();
    }

    const [data, total] = await this.consentRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['child'],
    });

    // 기관명 조회를 위한 아동 ID 수집
    const childIds = [...new Set(data.map((c) => c.childId))];
    const children = await this.childRepository.find({
      where: { id: In(childIds) },
      relations: ['careFacility', 'communityChildCenter'],
    });

    const childMap = new Map(children.map((c) => [c.id, c]));

    const items = data.map((consent) => {
      const child = childMap.get(consent.childId);
      const institutionName =
        child?.careFacility?.name || child?.communityChildCenter?.name || '';

      return {
        id: consent.id,
        childId: consent.childId,
        role: consent.role,
        status: consent.revokedAt ? 'REVOKED' : 'VALID',
        consentItems: consent.consentItems,
        consentVersion: consent.consentVersion,
        documentUrl: consent.documentUrl,
        consentedAt: consent.consentedAt.toISOString(),
        revokedAt: consent.revokedAt?.toISOString() || null,
        revocationReason: consent.revocationReason,
        guardianPhone: consent.guardianPhone,
        guardianRelation: consent.guardianRelation,
        ipAddress: consent.ipAddress,
        createdAt: consent.createdAt.toISOString(),
        updatedAt: consent.updatedAt.toISOString(),
        childName: child?.name || '',
        institutionName,
      };
    });

    return AdminPaginatedResponseDto.of(items, total, page, limit);
  }

  /**
   * 동의 상세 조회
   */
  @Get(':id')
  @AdminPermissions(ADMIN_PERMISSIONS.CONSENT_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '동의 상세 조회',
    description: '특정 동의의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '동의를 찾을 수 없음' })
  async getConsent(@Param('id', ParseUUIDPipe) id: string) {
    const consent = await this.consentRepository.findOne({
      where: { id },
      relations: ['child'],
    });

    if (!consent) {
      return { error: '동의를 찾을 수 없습니다', statusCode: 404 };
    }

    const child = await this.childRepository.findOne({
      where: { id: consent.childId },
      relations: ['careFacility', 'communityChildCenter'],
    });

    const institutionName =
      child?.careFacility?.name || child?.communityChildCenter?.name || '';

    return {
      id: consent.id,
      childId: consent.childId,
      role: consent.role,
      status: consent.revokedAt ? 'REVOKED' : 'VALID',
      consentItems: consent.consentItems,
      consentVersion: consent.consentVersion,
      documentUrl: consent.documentUrl,
      consentedAt: consent.consentedAt.toISOString(),
      revokedAt: consent.revokedAt?.toISOString() || null,
      revocationReason: consent.revocationReason,
      guardianPhone: consent.guardianPhone,
      guardianRelation: consent.guardianRelation,
      ipAddress: consent.ipAddress,
      createdAt: consent.createdAt.toISOString(),
      updatedAt: consent.updatedAt.toISOString(),
      childName: child?.name || '',
      institutionName,
    };
  }

  /**
   * 아동별 동의 이력 조회
   */
  @Get('history/:childId')
  @AdminPermissions(ADMIN_PERMISSIONS.CONSENT_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '아동별 동의 이력 조회',
    description: '특정 아동의 동의 이력을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getConsentHistory(@Param('childId', ParseUUIDPipe) childId: string) {
    const history = await this.historyRepository.find({
      where: { childId },
      order: { createdAt: 'DESC' },
    });

    return history.map((h) => ({
      id: h.id,
      consentId: h.consentId,
      childId: h.childId,
      action: h.action,
      previousData: h.previousData,
      newData: h.newData,
      ipAddress: h.ipAddress,
      createdAt: h.createdAt.toISOString(),
    }));
  }

  /**
   * 동의 철회
   */
  @Post(':id/revoke')
  @AdminPermissions(ADMIN_PERMISSIONS.CONSENT_REVOKE)
  @AuditAction('REVOKE', 'Consent', {
    level: 'HIGH',
    description: '동의 철회',
  })
  @ApiOperation({
    summary: '동의 철회',
    description: '동의를 철회합니다.',
  })
  @ApiResponse({ status: 200, description: '철회 성공' })
  @ApiResponse({ status: 404, description: '동의를 찾을 수 없음' })
  async revokeConsent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevokeConsentDto,
  ) {
    const consent = await this.consentRepository.findOne({ where: { id } });

    if (!consent) {
      return { error: '동의를 찾을 수 없습니다', statusCode: 404 };
    }

    if (consent.revokedAt) {
      return { error: '이미 철회된 동의입니다', statusCode: 400 };
    }

    const previousData = { ...consent };
    const now = new Date();

    // 동의 철회
    await this.consentRepository.update(id, {
      revokedAt: now,
      revocationReason: dto.reason,
    });

    // 이력 기록
    const historyEntry = this.historyRepository.create({
      consentId: consent.id,
      childId: consent.childId,
      action: ConsentAction.REVOKED,
      previousData: previousData as unknown as Record<string, unknown>,
      newData: {
        revokedAt: now.toISOString(),
        revocationReason: dto.reason,
      },
    });
    await this.historyRepository.save(historyEntry);

    this.logger.log(`동의 철회: ${id}, 사유: ${dto.reason}`);

    return { success: true, message: '동의가 철회되었습니다' };
  }
}
