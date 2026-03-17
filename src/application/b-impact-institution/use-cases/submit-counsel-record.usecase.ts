import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { COUNSEL_RECORD_REPOSITORY, CounselRecordRepository } from '@domain/counsel-record/repository/counsel-record.repository';
import { Result, DomainError } from '@domain/common/result';
import { CounselRecordResponseDto } from '../dto/counsel-record.dto';
import { OpenAIClient } from '@infrastructure/external/openai.client';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';

@Injectable()
export class SubmitCounselRecordUseCase {
  private readonly logger = new Logger(SubmitCounselRecordUseCase.name);

  constructor(
    @Inject(COUNSEL_RECORD_REPOSITORY)
    private readonly counselRecordRepository: CounselRecordRepository,
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
    private readonly openAIClient: OpenAIClient,
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

    // 1. Submit (DRAFT → SUBMITTED)
    const submitResult = record.submit();
    if (submitResult.isFailure) {
      return Result.fail(submitResult.getError());
    }

    // Save SUBMITTED state first
    await this.counselRecordRepository.save(record);

    // 2. Get child info for AI summary
    const cr = await this.counselRequestRepository.findOne({
      where: { id: record.counselRequestId },
      relations: ['child'],
    });

    const childName = cr?.formData?.basicInfo?.childInfo?.name || '알 수 없음';
    const childAge = cr?.formData?.basicInfo?.childInfo?.age || 0;
    const childGender = cr?.formData?.basicInfo?.childInfo?.gender || 'OTHER';
    const specialNeeds = cr?.child?.specialNeeds;

    // 3. AI summary generation
    try {
      const { summary, guardianSummary } =
        await this.openAIClient.generateCounselingSummary({
          counselContent: record.counselContent,
          childObservation: record.childObservation,
          counselorOpinion: record.counselorOpinion,
          childInfo: {
            name: childName,
            age: childAge,
            gender: childGender,
            specialNeeds: specialNeeds || undefined,
          },
          sessionNumber: record.sessionNumber,
          sessionType: 'REGULAR',
        });

      // 4. Mark summarized (SUBMITTED → SUMMARIZED)
      const summarizeResult = record.markSummarized(summary, guardianSummary);
      if (summarizeResult.isFailure) {
        this.logger.error(`AI 요약 상태 전환 실패: ${summarizeResult.getError().message}`);
      }
    } catch (error: unknown) {
      this.logger.error(
        `AI 요약 생성 실패 (SUBMITTED 상태 유지): ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 5. Save final state
    const saved = await this.counselRecordRepository.save(record);

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
      feedbackToGuardian: saved.feedbackToGuardian,
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
