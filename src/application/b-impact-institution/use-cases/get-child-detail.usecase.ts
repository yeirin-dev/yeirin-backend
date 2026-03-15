import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { COUNSEL_SESSION_REPOSITORY, CounselSessionRepository } from '@domain/counsel-session/repository/counsel-session.repository';
import { COUNSEL_RECORD_REPOSITORY, CounselRecordRepository } from '@domain/counsel-record/repository/counsel-record.repository';
import { VOUCHER_LINKAGE_REPOSITORY, VoucherLinkageRepository } from '@domain/voucher-linkage/repository/voucher-linkage.repository';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { ChildProfileEntity } from '@infrastructure/persistence/typeorm/entity/child-profile.entity';
import { ChildDetailResponseDto } from '../dto/child-detail.dto';

@Injectable()
export class GetChildDetailUseCase {
  constructor(
    @Inject(VOUCHER_LINKAGE_REPOSITORY)
    private readonly voucherLinkageRepository: VoucherLinkageRepository,
    @Inject(COUNSEL_SESSION_REPOSITORY)
    private readonly counselSessionRepository: CounselSessionRepository,
    @Inject(COUNSEL_RECORD_REPOSITORY)
    private readonly counselRecordRepository: CounselRecordRepository,
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
    @InjectRepository(ChildProfileEntity)
    private readonly childProfileRepository: Repository<ChildProfileEntity>,
  ) {}

  async execute(linkageId: string, institutionId: string): Promise<ChildDetailResponseDto> {
    const linkage = await this.voucherLinkageRepository.findById(linkageId);
    if (!linkage) {
      throw new NotFoundException('연계 정보를 찾을 수 없습니다');
    }

    if (linkage.linkedVoucherInstitutionId !== institutionId) {
      throw new NotFoundException('해당 기관의 연계 정보가 아닙니다');
    }

    const counselRequest = await this.counselRequestRepository.findOne({
      where: { id: linkage.counselRequestId },
      relations: ['child'],
    });

    if (!counselRequest) {
      throw new NotFoundException('상담의뢰를 찾을 수 없습니다');
    }

    const childName = counselRequest.formData?.basicInfo?.childInfo?.name || '알 수 없음';
    const childAge = counselRequest.formData?.basicInfo?.childInfo?.age || 0;
    const childGender = counselRequest.formData?.basicInfo?.childInfo?.gender || '알 수 없음';

    const sessions = await this.counselSessionRepository.findByVoucherLinkageId(linkageId);
    const records = await this.counselRecordRepository.findByVoucherLinkageId(linkageId);

    const sessionIds = new Set(records.map((r) => r.counselSessionId));

    return {
      linkageId: linkage.id,
      childId: counselRequest.childId,
      childName,
      childAge,
      childGender,
      counselRequestId: linkage.counselRequestId,
      formData: counselRequest.formData || {},
      sessions: sessions.map((s) => ({
        id: s.id,
        voucherLinkageId: s.voucherLinkageId,
        counselRequestId: s.counselRequestId,
        childId: s.childId,
        childName,
        bImpactInstitutionId: s.bImpactInstitutionId,
        sessionNumber: s.sessionNumber,
        scheduledDate: s.scheduledDate instanceof Date ? s.scheduledDate.toISOString().split('T')[0] : String(s.scheduledDate),
        scheduledStartTime: s.scheduledStartTime,
        scheduledEndTime: s.scheduledEndTime,
        sessionType: s.sessionType,
        status: s.status,
        cancelReason: s.cancelReason,
        notes: s.notes,
        hasRecord: sessionIds.has(s.id),
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      records: records.map((r) => ({
        id: r.id,
        counselSessionId: r.counselSessionId,
        voucherLinkageId: r.voucherLinkageId,
        counselRequestId: r.counselRequestId,
        childId: r.childId,
        childName,
        bImpactInstitutionId: r.bImpactInstitutionId,
        sessionNumber: r.sessionNumber,
        recordDate: r.recordDate instanceof Date ? r.recordDate.toISOString().split('T')[0] : String(r.recordDate),
        counselContent: r.counselContent,
        childObservation: r.childObservation,
        counselorOpinion: r.counselorOpinion,
        nextSessionPlan: r.nextSessionPlan,
        additionalCounselingNeeded: r.additionalCounselingNeeded,
        attachmentUrls: r.attachmentUrls,
        status: r.status,
        aiSummary: r.aiSummary,
        aiSummaryForGuardian: r.aiSummaryForGuardian,
        aiSummarizedAt: r.aiSummarizedAt?.toISOString(),
        sharedAt: r.sharedAt?.toISOString(),
        submittedAt: r.submittedAt?.toISOString(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      careType: counselRequest.careType || '',
      centerName: counselRequest.centerName || '',
      requestDate: counselRequest.requestDate?.toISOString?.() || counselRequest.createdAt?.toISOString?.() || '',
      specialNeeds: counselRequest.child?.specialNeeds || undefined,
    };
  }
}
