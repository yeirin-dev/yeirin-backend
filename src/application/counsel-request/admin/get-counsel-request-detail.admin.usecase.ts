import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '@infrastructure/persistence/typeorm/entity/audit-log.entity';
import { CounselReportEntity } from '@infrastructure/persistence/typeorm/entity/counsel-report.entity';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { ReviewEntity } from '@infrastructure/persistence/typeorm/entity/review.entity';
import {
  AdminCounselRequestDetailResponseDto,
  StatusHistoryItemDto,
} from './dto/admin-counsel-request-response.dto';

/**
 * Admin 상담의뢰 상세 조회 Use Case
 */
@Injectable()
export class GetCounselRequestDetailAdminUseCase {
  constructor(
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
    @InjectRepository(CounselReportEntity)
    private readonly counselReportRepository: Repository<CounselReportEntity>,
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  async execute(id: string): Promise<AdminCounselRequestDetailResponseDto> {
    // 상담의뢰 조회 (관계 포함)
    const counselRequest = await this.counselRequestRepository.findOne({
      where: { id },
      relations: ['child'],
    });

    if (!counselRequest) {
      throw new NotFoundException(`상담의뢰를 찾을 수 없습니다: ${id}`);
    }

    // 상담보고서 수 조회
    const reportCount = await this.counselReportRepository.count({
      where: { counselRequestId: id },
    });

    // 리뷰 평점 조회 (기관 ID로 조회)
    let reviewRating: number | undefined;
    if (counselRequest.matchedInstitutionId) {
      const review = await this.reviewRepository.findOne({
        where: { institutionId: counselRequest.matchedInstitutionId },
        order: { createdAt: 'DESC' },
      });
      reviewRating = review?.rating;
    }

    // 상태 변경 히스토리 조회 (AuditLog에서)
    const statusHistory = await this.getStatusHistory(id);

    return {
      id: counselRequest.id,
      childId: counselRequest.childId,
      childName: counselRequest.child?.name || '',
      status: counselRequest.status,
      centerName: counselRequest.centerName,
      careType: counselRequest.careType,
      requestDate: counselRequest.requestDate,
      matchedInstitutionId: counselRequest.matchedInstitutionId,
      matchedInstitutionName: undefined, // TODO: Institution 조회 추가 필요시 구현
      matchedCounselorId: counselRequest.matchedCounselorId,
      matchedCounselorName: undefined, // TODO: Counselor 조회 추가 필요시 구현
      createdAt: counselRequest.createdAt,
      updatedAt: counselRequest.updatedAt,
      formData: counselRequest.formData,
      statusHistory,
      reportCount,
      reviewRating,
    };
  }

  private async getStatusHistory(counselRequestId: string): Promise<StatusHistoryItemDto[]> {
    // AuditLog에서 상태 변경 기록 조회
    const auditLogs = await this.auditLogRepository.find({
      where: {
        entityType: 'CounselRequest',
        entityId: counselRequestId,
        action: 'STATUS_CHANGE',
      },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return auditLogs.map((log) => {
      const metadata = (log.metadata as Record<string, unknown>) || {};
      return {
        fromStatus: (metadata.previousStatus as string) || '',
        toStatus: (metadata.newStatus as string) || '',
        reason: (metadata.reason as string) || log.description || '',
        changedBy: log.userId || '',
        changedByName: log.userEmail || '',
        changedAt: log.createdAt,
      };
    });
  }
}
