import { RecordStatus } from '@domain/counsel-record/model/value-objects/record-status';

export class CreateCounselRecordDto {
  counselSessionId: string;
  counselContent: string;
  childObservation?: string;
  counselorOpinion?: string;
  nextSessionPlan?: string;
  additionalCounselingNeeded?: boolean;
  attachmentUrls?: string[];
}

export class UpdateCounselRecordDto {
  counselContent?: string;
  childObservation?: string;
  counselorOpinion?: string;
  nextSessionPlan?: string;
  additionalCounselingNeeded?: boolean;
  attachmentUrls?: string[];
}

export class CounselRecordResponseDto {
  id: string;
  counselSessionId: string;
  voucherLinkageId: string;
  counselRequestId: string;
  childId: string;
  childName: string;
  bImpactInstitutionId: string;
  sessionNumber: number;
  recordDate: string;
  counselContent: string;
  childObservation?: string;
  counselorOpinion?: string;
  nextSessionPlan?: string;
  additionalCounselingNeeded: boolean;
  attachmentUrls: string[];
  status: RecordStatus;
  aiSummary?: string;
  aiSummaryForGuardian?: string;
  aiSummarizedAt?: string;
  sharedAt?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}
