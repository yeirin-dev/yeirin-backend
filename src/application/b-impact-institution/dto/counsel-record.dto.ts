import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { RecordStatus } from '@domain/counsel-record/model/value-objects/record-status';

export class CreateCounselRecordDto {
  @IsString()
  counselSessionId: string;

  @IsString()
  counselContent: string;

  @IsOptional()
  @IsString()
  childObservation?: string;

  @IsOptional()
  @IsString()
  counselorOpinion?: string;

  @IsOptional()
  @IsString()
  nextSessionPlan?: string;

  @IsOptional()
  @IsBoolean()
  additionalCounselingNeeded?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];
}

export class UpdateCounselRecordDto {
  @IsOptional()
  @IsString()
  counselContent?: string;

  @IsOptional()
  @IsString()
  childObservation?: string;

  @IsOptional()
  @IsString()
  counselorOpinion?: string;

  @IsOptional()
  @IsString()
  nextSessionPlan?: string;

  @IsOptional()
  @IsBoolean()
  additionalCounselingNeeded?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
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
