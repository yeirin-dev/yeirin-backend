import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, IsNull, Not } from 'typeorm';
import { Roles } from '@infrastructure/auth/decorators/roles.decorator';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { ChildConsentEntity } from '@infrastructure/persistence/typeorm/entity/child-consent.entity';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { PsychologicalStatusLogEntity } from '@infrastructure/persistence/typeorm/entity/psychological-status-log.entity';
import {
  AdminPermissions,
  AdminPermissionGuard,
  AdminAuditInterceptor,
  SkipAdminAudit,
  ADMIN_PERMISSIONS,
  AdminPaginatedResponseDto,
} from '@yeirin/admin-common';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { ChildrenQueryDto } from './dto/children-query.dto';

/**
 * Admin Children Controller
 * 아동 관리 Admin API
 *
 * @route /admin/children
 */
@ApiTags('Admin - 아동 관리')
@Controller('admin/children')
@UseGuards(AdminJwtAuthGuard, AdminPermissionGuard)
@UseInterceptors(AdminAuditInterceptor)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminChildrenController {
  private readonly logger = new Logger(AdminChildrenController.name);

  constructor(
    @InjectRepository(ChildProfileEntity)
    private readonly childRepository: Repository<ChildProfileEntity>,
    @InjectRepository(ChildConsentEntity)
    private readonly consentRepository: Repository<ChildConsentEntity>,
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
    @InjectRepository(PsychologicalStatusLogEntity)
    private readonly statusLogRepository: Repository<PsychologicalStatusLogEntity>,
  ) {}

  /**
   * 아동 목록 조회
   */
  @Get()
  @AdminPermissions(ADMIN_PERMISSIONS.CHILD_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '아동 목록 조회',
    description: '전체 아동 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getChildren(@Query() query: ChildrenQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      institutionType,
      institutionId,
      psychologicalStatus,
    } = query;

    const where: FindOptionsWhere<ChildProfileEntity> = {};

    if (search) {
      where.name = Like(`%${search}%`);
    }
    if (psychologicalStatus) {
      where.psychologicalStatus = psychologicalStatus;
    }

    // 기관 유형별 필터링
    if (institutionType === 'CARE_FACILITY') {
      where.careFacilityId = institutionId || Not(IsNull());
    } else if (institutionType === 'COMMUNITY_CENTER') {
      where.communityChildCenterId = institutionId || Not(IsNull());
    } else if (institutionId) {
      // 기관 ID만 지정된 경우 양쪽 모두 검색
      where.careFacilityId = institutionId;
    }

    const [data, total] = await this.childRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['careFacility', 'communityChildCenter'],
    });

    // 동의 상태 조회
    const childIds = data.map((c) => c.id);
    const consents = await this.consentRepository.find({
      where: childIds.length > 0 ? childIds.map((id) => ({ childId: id })) : [],
    });

    const consentMap = new Map<string, { guardian: boolean; child: boolean }>();
    consents.forEach((consent) => {
      const existing = consentMap.get(consent.childId) || { guardian: false, child: false };
      if (consent.revokedAt === null) {
        if (consent.role === 'GUARDIAN') {
          existing.guardian = true;
        } else {
          existing.child = true;
        }
      }
      consentMap.set(consent.childId, existing);
    });

    const items = data.map((child) => {
      const consentStatus = consentMap.get(child.id) || { guardian: false, child: false };
      const age = this.calculateAge(child.birthDate);
      const needsChildConsent = age >= 14;
      const institutionName =
        child.careFacility?.name || child.communityChildCenter?.name || '';

      let status: 'COMPLETE' | 'NEED_GUARDIAN' | 'NEED_CHILD' | 'NEED_BOTH' = 'NEED_BOTH';
      if (needsChildConsent) {
        if (consentStatus.guardian && consentStatus.child) status = 'COMPLETE';
        else if (!consentStatus.guardian && !consentStatus.child) status = 'NEED_BOTH';
        else if (!consentStatus.guardian) status = 'NEED_GUARDIAN';
        else status = 'NEED_CHILD';
      } else {
        status = consentStatus.guardian ? 'COMPLETE' : 'NEED_GUARDIAN';
      }

      return {
        id: child.id,
        childType: child.careFacilityId ? 'CARE_FACILITY' : 'COMMUNITY_CENTER',
        name: child.name,
        birthDate: this.formatDate(child.birthDate),
        gender: child.gender,
        careFacilityId: child.careFacilityId,
        communityChildCenterId: child.communityChildCenterId,
        medicalInfo: child.medicalInfo,
        specialNeeds: child.specialNeeds,
        psychologicalStatus: child.psychologicalStatus,
        createdAt: child.createdAt.toISOString(),
        updatedAt: child.updatedAt.toISOString(),
        age,
        institutionName,
        hasGuardianConsent: consentStatus.guardian,
        hasChildConsent: consentStatus.child,
        hasValidConsent: status === 'COMPLETE',
        consentStatus: status,
      };
    });

    return AdminPaginatedResponseDto.of(items, total, page, limit);
  }

  /**
   * 아동 상세 조회
   */
  @Get(':id')
  @AdminPermissions(ADMIN_PERMISSIONS.CHILD_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '아동 상세 조회',
    description: '특정 아동의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '아동을 찾을 수 없음' })
  async getChild(@Param('id', ParseUUIDPipe) id: string) {
    const child = await this.childRepository.findOne({
      where: { id },
      relations: ['careFacility', 'communityChildCenter'],
    });

    if (!child) {
      return { error: '아동을 찾을 수 없습니다', statusCode: 404 };
    }

    // 동의 정보 조회
    const consents = await this.consentRepository.find({
      where: { childId: id },
    });

    const guardianConsent = consents.find(
      (c) => c.role === 'GUARDIAN' && c.revokedAt === null,
    );
    const childConsent = consents.find((c) => c.role === 'CHILD' && c.revokedAt === null);

    // 상담 의뢰 통계
    const counselRequestStats = await this.counselRequestRepository
      .createQueryBuilder('cr')
      .select('cr.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('cr.childId = :childId', { childId: id })
      .groupBy('cr.status')
      .getRawMany();

    const counselRequests = {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
    };

    counselRequestStats.forEach((stat) => {
      const count = parseInt(stat.count, 10);
      counselRequests.total += count;
      if (stat.status === 'PENDING') counselRequests.pending = count;
      else if (stat.status === 'IN_PROGRESS') counselRequests.inProgress = count;
      else if (stat.status === 'COMPLETED') counselRequests.completed = count;
    });

    // 심리 상태 로그
    const statusLogs = await this.statusLogRepository.find({
      where: { childId: id },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const age = this.calculateAge(child.birthDate);
    const needsChildConsent = age >= 14;
    let consentStatus: 'COMPLETE' | 'NEED_GUARDIAN' | 'NEED_CHILD' | 'NEED_BOTH' = 'NEED_BOTH';

    if (needsChildConsent) {
      if (guardianConsent && childConsent) consentStatus = 'COMPLETE';
      else if (!guardianConsent && !childConsent) consentStatus = 'NEED_BOTH';
      else if (!guardianConsent) consentStatus = 'NEED_GUARDIAN';
      else consentStatus = 'NEED_CHILD';
    } else {
      consentStatus = guardianConsent ? 'COMPLETE' : 'NEED_GUARDIAN';
    }

    const institution = child.careFacility || child.communityChildCenter;

    return {
      id: child.id,
      childType: child.careFacilityId ? 'CARE_FACILITY' : 'COMMUNITY_CENTER',
      name: child.name,
      birthDate: this.formatDate(child.birthDate),
      gender: child.gender,
      careFacilityId: child.careFacilityId,
      communityChildCenterId: child.communityChildCenterId,
      medicalInfo: child.medicalInfo,
      specialNeeds: child.specialNeeds,
      psychologicalStatus: child.psychologicalStatus,
      createdAt: child.createdAt.toISOString(),
      updatedAt: child.updatedAt.toISOString(),
      age,
      institutionName: institution?.name || '',
      hasGuardianConsent: !!guardianConsent,
      hasChildConsent: !!childConsent,
      hasValidConsent: consentStatus === 'COMPLETE',
      consentStatus,
      institution: institution
        ? {
            id: institution.id,
            name: institution.name,
            type: child.careFacilityId ? 'CARE_FACILITY' : 'COMMUNITY_CENTER',
          }
        : null,
      consents: {
        guardian: guardianConsent
          ? {
              id: guardianConsent.id,
              status: 'VALID' as const,
              consentedAt: guardianConsent.consentedAt.toISOString(),
              revokedAt: null,
              guardianPhone: guardianConsent.guardianPhone,
              guardianRelation: guardianConsent.guardianRelation,
            }
          : null,
        child: childConsent
          ? {
              id: childConsent.id,
              status: 'VALID' as const,
              consentedAt: childConsent.consentedAt.toISOString(),
              revokedAt: null,
            }
          : null,
      },
      guardian: guardianConsent
        ? {
            phone: guardianConsent.guardianPhone,
            relation: guardianConsent.guardianRelation,
            consentedAt: guardianConsent.consentedAt.toISOString(),
            hasConsent: true,
          }
        : null,
      pin: {
        hasPin: false, // NOTE: PIN 정보는 soul-e에서 조회
        failedAttempts: 0,
        lastFailedAt: null,
      },
      counselRequests,
      psychologicalStatusLogs: statusLogs.map((log) => ({
        id: log.id,
        childId: log.childId,
        previousStatus: log.previousStatus,
        newStatus: log.newStatus,
        reason: log.reason,
        source: log.source,
        sessionId: log.sessionId,
        isEscalation: log.isEscalation,
        metadata: log.metadata,
        createdAt: log.createdAt.toISOString(),
      })),
    };
  }

  private calculateAge(birthDate: Date | string): number {
    const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    return age;
  }

  private formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    return date.toISOString().split('T')[0];
  }
}
