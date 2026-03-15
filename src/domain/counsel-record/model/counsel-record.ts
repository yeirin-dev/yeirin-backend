import { Result, DomainError } from '@domain/common/result';
import { RecordStatus } from './value-objects/record-status';

export interface CounselRecordProps {
  id: string;
  counselSessionId: string;
  voucherLinkageId: string;
  counselRequestId: string;
  childId: string;
  bImpactInstitutionId: string;
  sessionNumber: number;
  recordDate: Date;
  counselContent: string;
  childObservation?: string;
  counselorOpinion?: string;
  nextSessionPlan?: string;
  additionalCounselingNeeded: boolean;
  attachmentUrls: string[];
  status: RecordStatus;
  aiSummary?: string;
  aiSummaryForGuardian?: string;
  aiSummarizedAt?: Date;
  sharedAt?: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class CounselRecord {
  private constructor(
    private readonly _id: string,
    private readonly _counselSessionId: string,
    private readonly _voucherLinkageId: string,
    private readonly _counselRequestId: string,
    private readonly _childId: string,
    private readonly _bImpactInstitutionId: string,
    private readonly _sessionNumber: number,
    private _recordDate: Date,
    private _counselContent: string,
    private _childObservation: string | undefined,
    private _counselorOpinion: string | undefined,
    private _nextSessionPlan: string | undefined,
    private _additionalCounselingNeeded: boolean,
    private _attachmentUrls: string[],
    private _status: RecordStatus,
    private _aiSummary: string | undefined,
    private _aiSummaryForGuardian: string | undefined,
    private _aiSummarizedAt: Date | undefined,
    private _sharedAt: Date | undefined,
    private _submittedAt: Date | undefined,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  // ============================================
  // Getters
  // ============================================

  get id(): string {
    return this._id;
  }

  get counselSessionId(): string {
    return this._counselSessionId;
  }

  get voucherLinkageId(): string {
    return this._voucherLinkageId;
  }

  get counselRequestId(): string {
    return this._counselRequestId;
  }

  get childId(): string {
    return this._childId;
  }

  get bImpactInstitutionId(): string {
    return this._bImpactInstitutionId;
  }

  get sessionNumber(): number {
    return this._sessionNumber;
  }

  get recordDate(): Date {
    return this._recordDate;
  }

  get counselContent(): string {
    return this._counselContent;
  }

  get childObservation(): string | undefined {
    return this._childObservation;
  }

  get counselorOpinion(): string | undefined {
    return this._counselorOpinion;
  }

  get nextSessionPlan(): string | undefined {
    return this._nextSessionPlan;
  }

  get additionalCounselingNeeded(): boolean {
    return this._additionalCounselingNeeded;
  }

  get attachmentUrls(): string[] {
    return this._attachmentUrls;
  }

  get status(): RecordStatus {
    return this._status;
  }

  get aiSummary(): string | undefined {
    return this._aiSummary;
  }

  get aiSummaryForGuardian(): string | undefined {
    return this._aiSummaryForGuardian;
  }

  get aiSummarizedAt(): Date | undefined {
    return this._aiSummarizedAt;
  }

  get sharedAt(): Date | undefined {
    return this._sharedAt;
  }

  get submittedAt(): Date | undefined {
    return this._submittedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ============================================
  // Factory Methods
  // ============================================

  static create(props: {
    id: string;
    counselSessionId: string;
    voucherLinkageId: string;
    counselRequestId: string;
    childId: string;
    bImpactInstitutionId: string;
    sessionNumber: number;
    recordDate: Date;
    counselContent: string;
    childObservation?: string;
    counselorOpinion?: string;
    nextSessionPlan?: string;
    additionalCounselingNeeded?: boolean;
    attachmentUrls?: string[];
  }): Result<CounselRecord, DomainError> {
    if (!props.id || props.id.trim().length === 0) {
      return Result.fail(new DomainError('상담 기록 ID는 필수입니다', 'INVALID_RECORD_ID'));
    }

    if (!props.counselContent || props.counselContent.trim().length === 0) {
      return Result.fail(
        new DomainError('상담 내용은 필수입니다', 'COUNSEL_CONTENT_REQUIRED'),
      );
    }

    return Result.ok(
      new CounselRecord(
        props.id,
        props.counselSessionId,
        props.voucherLinkageId,
        props.counselRequestId,
        props.childId,
        props.bImpactInstitutionId,
        props.sessionNumber,
        props.recordDate,
        props.counselContent,
        props.childObservation,
        props.counselorOpinion,
        props.nextSessionPlan,
        props.additionalCounselingNeeded ?? false,
        props.attachmentUrls ?? [],
        RecordStatus.DRAFT,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      ),
    );
  }

  static restore(props: CounselRecordProps): CounselRecord {
    return new CounselRecord(
      props.id,
      props.counselSessionId,
      props.voucherLinkageId,
      props.counselRequestId,
      props.childId,
      props.bImpactInstitutionId,
      props.sessionNumber,
      props.recordDate,
      props.counselContent,
      props.childObservation,
      props.counselorOpinion,
      props.nextSessionPlan,
      props.additionalCounselingNeeded,
      props.attachmentUrls,
      props.status,
      props.aiSummary,
      props.aiSummaryForGuardian,
      props.aiSummarizedAt,
      props.sharedAt,
      props.submittedAt,
      props.createdAt,
      props.updatedAt,
    );
  }

  // ============================================
  // Business Logic
  // ============================================

  update(updates: {
    counselContent?: string;
    childObservation?: string;
    counselorOpinion?: string;
    nextSessionPlan?: string;
    additionalCounselingNeeded?: boolean;
    attachmentUrls?: string[];
  }): Result<void, DomainError> {
    if (this._status !== RecordStatus.DRAFT) {
      return Result.fail(
        new DomainError('작성중 상태의 기록만 수정할 수 있습니다', 'INVALID_STATUS'),
      );
    }

    if (updates.counselContent !== undefined) this._counselContent = updates.counselContent;
    if (updates.childObservation !== undefined)
      this._childObservation = updates.childObservation;
    if (updates.counselorOpinion !== undefined)
      this._counselorOpinion = updates.counselorOpinion;
    if (updates.nextSessionPlan !== undefined)
      this._nextSessionPlan = updates.nextSessionPlan;
    if (updates.additionalCounselingNeeded !== undefined)
      this._additionalCounselingNeeded = updates.additionalCounselingNeeded;
    if (updates.attachmentUrls !== undefined) this._attachmentUrls = updates.attachmentUrls;
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  submit(): Result<void, DomainError> {
    if (this._status !== RecordStatus.DRAFT) {
      return Result.fail(
        new DomainError('작성중 상태의 기록만 제출할 수 있습니다', 'INVALID_STATUS'),
      );
    }

    if (!this._counselContent || this._counselContent.trim().length === 0) {
      return Result.fail(
        new DomainError('상담 내용은 필수입니다', 'COUNSEL_CONTENT_REQUIRED'),
      );
    }

    this._status = RecordStatus.SUBMITTED;
    this._submittedAt = new Date();
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  markSummarized(summary: string, guardianSummary: string): Result<void, DomainError> {
    if (this._status !== RecordStatus.SUBMITTED) {
      return Result.fail(
        new DomainError('제출된 기록만 요약 처리할 수 있습니다', 'INVALID_STATUS'),
      );
    }

    this._aiSummary = summary;
    this._aiSummaryForGuardian = guardianSummary;
    this._aiSummarizedAt = new Date();
    this._status = RecordStatus.SUMMARIZED;
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  share(): Result<void, DomainError> {
    if (this._status !== RecordStatus.SUMMARIZED) {
      return Result.fail(
        new DomainError('AI 요약 완료된 기록만 공유할 수 있습니다', 'INVALID_STATUS'),
      );
    }

    this._status = RecordStatus.SHARED;
    this._sharedAt = new Date();
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }
}
