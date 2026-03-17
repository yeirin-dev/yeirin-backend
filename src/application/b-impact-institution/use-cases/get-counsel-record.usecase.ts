import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { COUNSEL_RECORD_REPOSITORY, CounselRecordRepository } from '@domain/counsel-record/repository/counsel-record.repository';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { Result, DomainError } from '@domain/common/result';
import { CounselRecordResponseDto } from '../dto/counsel-record.dto';

@Injectable()
export class GetCounselRecordUseCase {
  constructor(
    @Inject(COUNSEL_RECORD_REPOSITORY)
    private readonly counselRecordRepository: CounselRecordRepository,
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
  ) {}

  async execute(
    recordId: string,
    institutionId: string,
  ): Promise<Result<CounselRecordResponseDto, DomainError>> {
    const record = await this.counselRecordRepository.findById(recordId);
    if (!record) {
      return Result.fail(new DomainError('상담 기록을 찾을 수 없습니다', 'RECORD_NOT_FOUND'));
    }

    if (record.bImpactInstitutionId !== institutionId) {
      return Result.fail(new DomainError('해당 기관의 상담 기록이 아닙니다', 'FORBIDDEN'));
    }

    const cr = await this.counselRequestRepository.findOne({
      where: { id: record.counselRequestId },
    });
    const childName = cr?.formData?.basicInfo?.childInfo?.name || '알 수 없음';

    return Result.ok({
      id: record.id,
      counselSessionId: record.counselSessionId,
      voucherLinkageId: record.voucherLinkageId,
      counselRequestId: record.counselRequestId,
      childId: record.childId,
      childName,
      bImpactInstitutionId: record.bImpactInstitutionId,
      sessionNumber: record.sessionNumber,
      recordDate: record.recordDate instanceof Date ? record.recordDate.toISOString().split('T')[0] : String(record.recordDate),
      counselContent: record.counselContent,
      childObservation: record.childObservation,
      counselorOpinion: record.counselorOpinion,
      nextSessionPlan: record.nextSessionPlan,
      feedbackToGuardian: record.feedbackToGuardian,
      additionalCounselingNeeded: record.additionalCounselingNeeded,
      attachmentUrls: record.attachmentUrls,
      status: record.status,
      aiSummary: record.aiSummary,
      aiSummaryForGuardian: record.aiSummaryForGuardian,
      aiSummarizedAt: record.aiSummarizedAt?.toISOString(),
      sharedAt: record.sharedAt?.toISOString(),
      submittedAt: record.submittedAt?.toISOString(),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    });
  }
}
