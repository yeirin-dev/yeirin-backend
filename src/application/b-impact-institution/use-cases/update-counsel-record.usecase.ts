import { Inject, Injectable } from '@nestjs/common';
import { COUNSEL_RECORD_REPOSITORY, CounselRecordRepository } from '@domain/counsel-record/repository/counsel-record.repository';
import { Result, DomainError } from '@domain/common/result';
import { UpdateCounselRecordDto, CounselRecordResponseDto } from '../dto/counsel-record.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';

@Injectable()
export class UpdateCounselRecordUseCase {
  constructor(
    @Inject(COUNSEL_RECORD_REPOSITORY)
    private readonly counselRecordRepository: CounselRecordRepository,
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
  ) {}

  async execute(
    recordId: string,
    dto: UpdateCounselRecordDto,
    institutionId: string,
  ): Promise<Result<CounselRecordResponseDto, DomainError>> {
    const record = await this.counselRecordRepository.findById(recordId);
    if (!record) {
      return Result.fail(new DomainError('상담 기록을 찾을 수 없습니다', 'RECORD_NOT_FOUND'));
    }

    if (record.bImpactInstitutionId !== institutionId) {
      return Result.fail(new DomainError('해당 기관의 상담 기록이 아닙니다', 'FORBIDDEN'));
    }

    const updateResult = record.update({
      counselContent: dto.counselContent,
      childObservation: dto.childObservation,
      counselorOpinion: dto.counselorOpinion,
      nextSessionPlan: dto.nextSessionPlan,
      additionalCounselingNeeded: dto.additionalCounselingNeeded,
      attachmentUrls: dto.attachmentUrls,
    });

    if (updateResult.isFailure) {
      return Result.fail(updateResult.getError());
    }

    const saved = await this.counselRecordRepository.save(record);
    const cr = await this.counselRequestRepository.findOne({
      where: { id: saved.counselRequestId },
    });
    const childName = cr?.formData?.basicInfo?.childInfo?.name || '알 수 없음';

    return Result.ok({
      id: saved.id,
      counselSessionId: saved.counselSessionId,
      voucherLinkageId: saved.voucherLinkageId,
      counselRequestId: saved.counselRequestId,
      childId: saved.childId,
      childName,
      bImpactInstitutionId: saved.bImpactInstitutionId,
      sessionNumber: saved.sessionNumber,
      recordDate: saved.recordDate instanceof Date ? saved.recordDate.toISOString().split('T')[0] : String(saved.recordDate),
      counselContent: saved.counselContent,
      childObservation: saved.childObservation,
      counselorOpinion: saved.counselorOpinion,
      nextSessionPlan: saved.nextSessionPlan,
      additionalCounselingNeeded: saved.additionalCounselingNeeded,
      attachmentUrls: saved.attachmentUrls,
      status: saved.status,
      aiSummary: saved.aiSummary,
      aiSummaryForGuardian: saved.aiSummaryForGuardian,
      aiSummarizedAt: saved.aiSummarizedAt?.toISOString(),
      sharedAt: saved.sharedAt?.toISOString(),
      submittedAt: saved.submittedAt?.toISOString(),
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    });
  }
}
