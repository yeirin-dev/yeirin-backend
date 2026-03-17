import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { COUNSEL_RECORD_REPOSITORY, CounselRecordRepository } from '@domain/counsel-record/repository/counsel-record.repository';
import { CounselRequestEntity } from '@infrastructure/persistence/typeorm/entity/counsel-request.entity';
import { CounselRecordResponseDto } from '../dto/counsel-record.dto';

@Injectable()
export class GetCounselRecordsUseCase {
  constructor(
    @Inject(COUNSEL_RECORD_REPOSITORY)
    private readonly counselRecordRepository: CounselRecordRepository,
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
  ) {}

  async execute(
    institutionId: string,
    page: number,
    limit: number,
  ): Promise<{ records: CounselRecordResponseDto[]; total: number }> {
    const { records, total } = await this.counselRecordRepository.findByInstitutionId(
      institutionId,
      page,
      limit,
    );

    if (records.length === 0) return { records: [], total: 0 };

    const counselRequestIds = [...new Set(records.map((r) => r.counselRequestId))];
    const counselRequests = await this.counselRequestRepository.find({
      where: { id: In(counselRequestIds) },
    });
    const crMap = new Map(counselRequests.map((cr) => [cr.id, cr]));

    return {
      records: records.map((r) => {
        const cr = crMap.get(r.counselRequestId);
        const childName = cr?.formData?.basicInfo?.childInfo?.name || '알 수 없음';
        return {
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
          feedbackToGuardian: r.feedbackToGuardian,
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
        };
      }),
      total,
    };
  }
}
