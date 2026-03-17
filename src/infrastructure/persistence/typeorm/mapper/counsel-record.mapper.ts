import { CounselRecord } from '@domain/counsel-record/model/counsel-record';
import { CounselRecordEntity } from '../entity/counsel-record.entity';

export class CounselRecordMapper {
  static toDomain(entity: CounselRecordEntity): CounselRecord {
    return CounselRecord.restore({
      id: entity.id,
      counselSessionId: entity.counselSessionId,
      voucherLinkageId: entity.voucherLinkageId,
      counselRequestId: entity.counselRequestId,
      childId: entity.childId,
      bImpactInstitutionId: entity.bImpactInstitutionId,
      sessionNumber: entity.sessionNumber,
      recordDate: entity.recordDate,
      counselContent: entity.counselContent,
      childObservation: entity.childObservation,
      counselorOpinion: entity.counselorOpinion,
      nextSessionPlan: entity.nextSessionPlan,
      feedbackToGuardian: entity.feedbackToGuardian,
      additionalCounselingNeeded: entity.additionalCounselingNeeded,
      attachmentUrls: entity.attachmentUrls,
      status: entity.status,
      aiSummary: entity.aiSummary,
      aiSummaryForGuardian: entity.aiSummaryForGuardian,
      aiSummarizedAt: entity.aiSummarizedAt,
      sharedAt: entity.sharedAt,
      submittedAt: entity.submittedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toEntity(domain: CounselRecord): CounselRecordEntity {
    const entity = new CounselRecordEntity();
    entity.id = domain.id;
    entity.counselSessionId = domain.counselSessionId;
    entity.voucherLinkageId = domain.voucherLinkageId;
    entity.counselRequestId = domain.counselRequestId;
    entity.childId = domain.childId;
    entity.bImpactInstitutionId = domain.bImpactInstitutionId;
    entity.sessionNumber = domain.sessionNumber;
    entity.recordDate = domain.recordDate;
    entity.counselContent = domain.counselContent;
    entity.childObservation = domain.childObservation;
    entity.counselorOpinion = domain.counselorOpinion;
    entity.nextSessionPlan = domain.nextSessionPlan;
    entity.feedbackToGuardian = domain.feedbackToGuardian;
    entity.additionalCounselingNeeded = domain.additionalCounselingNeeded;
    entity.attachmentUrls = domain.attachmentUrls;
    entity.status = domain.status;
    entity.aiSummary = domain.aiSummary;
    entity.aiSummaryForGuardian = domain.aiSummaryForGuardian;
    entity.aiSummarizedAt = domain.aiSummarizedAt;
    entity.sharedAt = domain.sharedAt;
    entity.submittedAt = domain.submittedAt;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
