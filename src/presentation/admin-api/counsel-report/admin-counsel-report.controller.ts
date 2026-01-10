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
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { Roles } from '@infrastructure/auth/decorators/roles.decorator';
import { CounselReportEntity } from '@infrastructure/persistence/typeorm/entity/counsel-report.entity';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
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
import { CounselReportQueryDto, UpdateReportStatusDto } from './dto/counsel-report-query.dto';

/**
 * Admin Counsel Report Controller
 * 상담보고서 관리 Admin API
 *
 * @route /admin/counsel-reports
 */
@ApiTags('Admin - 상담보고서 관리')
@Controller('admin/counsel-reports')
@UseGuards(AdminJwtAuthGuard, AdminPermissionGuard)
@UseInterceptors(AdminAuditInterceptor)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminCounselReportController {
  private readonly logger = new Logger(AdminCounselReportController.name);

  constructor(
    @InjectRepository(CounselReportEntity)
    private readonly reportRepository: Repository<CounselReportEntity>,
    @InjectRepository(ChildProfileEntity)
    private readonly childRepository: Repository<ChildProfileEntity>,
  ) {}

  /**
   * 상담보고서 목록 조회
   */
  @Get()
  @AdminPermissions(ADMIN_PERMISSIONS.COUNSEL_REPORT_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '상담보고서 목록 조회',
    description: '전체 상담보고서 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getReports(@Query() query: CounselReportQueryDto) {
    const { page = 1, limit = 20, counselRequestId, childId, status } = query;

    const where: FindOptionsWhere<CounselReportEntity> = {};

    if (counselRequestId) {
      where.counselRequestId = counselRequestId;
    }
    if (childId) {
      where.childId = childId;
    }
    if (status) {
      where.status = status;
    }

    const [data, total] = await this.reportRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['child'],
    });

    // 아동 및 기관명 조회
    const childIds = [...new Set(data.map((r) => r.childId))];
    const children = await this.childRepository.find({
      where: { id: In(childIds) },
      relations: ['careFacility', 'communityChildCenter'],
    });

    const childMap = new Map(children.map((c) => [c.id, c]));

    const items = data.map((report) => {
      const child = childMap.get(report.childId);
      const institutionName =
        child?.careFacility?.name || child?.communityChildCenter?.name || '';

      return {
        id: report.id,
        counselRequestId: report.counselRequestId,
        childId: report.childId,
        counselorId: report.counselorId,
        institutionId: report.institutionId,
        sessionNumber: report.sessionNumber,
        reportDate: this.formatDate(report.reportDate),
        centerName: report.centerName,
        counselorSignature: report.counselorSignature,
        counselReason: report.counselReason,
        counselContent: report.counselContent,
        centerFeedback: report.centerFeedback,
        homeFeedback: report.homeFeedback,
        attachmentUrls: report.attachmentUrls,
        status: report.status,
        submittedAt: report.submittedAt?.toISOString() || null,
        reviewedAt: report.reviewedAt?.toISOString() || null,
        guardianFeedback: report.guardianFeedback,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
        childName: child?.name || '',
        institutionName,
      };
    });

    return AdminPaginatedResponseDto.of(items, total, page, limit);
  }

  /**
   * 상담보고서 상세 조회
   */
  @Get(':id')
  @AdminPermissions(ADMIN_PERMISSIONS.COUNSEL_REPORT_READ)
  @SkipAdminAudit()
  @ApiOperation({
    summary: '상담보고서 상세 조회',
    description: '특정 상담보고서의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '보고서를 찾을 수 없음' })
  async getReport(@Param('id', ParseUUIDPipe) id: string) {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['child'],
    });

    if (!report) {
      return { error: '상담보고서를 찾을 수 없습니다', statusCode: 404 };
    }

    const child = await this.childRepository.findOne({
      where: { id: report.childId },
      relations: ['careFacility', 'communityChildCenter'],
    });

    const institutionName =
      child?.careFacility?.name || child?.communityChildCenter?.name || '';

    return {
      id: report.id,
      counselRequestId: report.counselRequestId,
      childId: report.childId,
      counselorId: report.counselorId,
      institutionId: report.institutionId,
      sessionNumber: report.sessionNumber,
      reportDate: this.formatDate(report.reportDate),
      centerName: report.centerName,
      counselorSignature: report.counselorSignature,
      counselReason: report.counselReason,
      counselContent: report.counselContent,
      centerFeedback: report.centerFeedback,
      homeFeedback: report.homeFeedback,
      attachmentUrls: report.attachmentUrls,
      status: report.status,
      submittedAt: report.submittedAt?.toISOString() || null,
      reviewedAt: report.reviewedAt?.toISOString() || null,
      guardianFeedback: report.guardianFeedback,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      childName: child?.name || '',
      institutionName,
    };
  }

  /**
   * 상담보고서 상태 변경
   */
  @Patch(':id/status')
  @AdminPermissions(ADMIN_PERMISSIONS.COUNSEL_REPORT_UPDATE)
  @AuditAction('UPDATE_STATUS', 'CounselReport', {
    level: 'NORMAL',
    description: '상담보고서 상태 변경',
  })
  @ApiOperation({
    summary: '상담보고서 상태 변경',
    description: '상담보고서의 상태를 변경합니다.',
  })
  @ApiResponse({ status: 200, description: '상태 변경 성공' })
  @ApiResponse({ status: 404, description: '보고서를 찾을 수 없음' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportStatusDto,
  ) {
    const report = await this.reportRepository.findOne({ where: { id } });

    if (!report) {
      return { error: '상담보고서를 찾을 수 없습니다', statusCode: 404 };
    }

    const now = new Date();
    const updateData: Partial<CounselReportEntity> = {
      status: dto.status,
    };

    // 상태에 따른 타임스탬프 업데이트
    if (dto.status === 'SUBMITTED' && !report.submittedAt) {
      updateData.submittedAt = now;
    } else if (dto.status === 'REVIEWED' && !report.reviewedAt) {
      updateData.reviewedAt = now;
    }

    await this.reportRepository.update(id, updateData);

    this.logger.log(`상담보고서 상태 변경: ${id} → ${dto.status}`);

    return { success: true, message: '상태가 변경되었습니다' };
  }

  private formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    return date.toISOString().split('T')[0];
  }
}
