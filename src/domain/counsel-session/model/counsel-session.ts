import { Result, DomainError } from '@domain/common/result';
import { SessionType, SessionStatus } from './value-objects/session-enums';

export interface CounselSessionProps {
  id: string;
  voucherLinkageId: string;
  counselRequestId: string;
  childId: string;
  bImpactInstitutionId: string;
  sessionNumber: number;
  scheduledDate: Date;
  scheduledStartTime: string;
  scheduledEndTime: string;
  sessionType: SessionType;
  status: SessionStatus;
  cancelReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CounselSession {
  private constructor(
    private readonly _id: string,
    private readonly _voucherLinkageId: string,
    private readonly _counselRequestId: string,
    private readonly _childId: string,
    private readonly _bImpactInstitutionId: string,
    private readonly _sessionNumber: number,
    private _scheduledDate: Date,
    private _scheduledStartTime: string,
    private _scheduledEndTime: string,
    private _sessionType: SessionType,
    private _status: SessionStatus,
    private _cancelReason: string | undefined,
    private _notes: string | undefined,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  // ============================================
  // Getters
  // ============================================

  get id(): string {
    return this._id;
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

  get scheduledDate(): Date {
    return this._scheduledDate;
  }

  get scheduledStartTime(): string {
    return this._scheduledStartTime;
  }

  get scheduledEndTime(): string {
    return this._scheduledEndTime;
  }

  get sessionType(): SessionType {
    return this._sessionType;
  }

  get status(): SessionStatus {
    return this._status;
  }

  get cancelReason(): string | undefined {
    return this._cancelReason;
  }

  get notes(): string | undefined {
    return this._notes;
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
    voucherLinkageId: string;
    counselRequestId: string;
    childId: string;
    bImpactInstitutionId: string;
    sessionNumber: number;
    scheduledDate: Date;
    scheduledStartTime: string;
    scheduledEndTime: string;
    sessionType: SessionType;
    notes?: string;
  }): Result<CounselSession, DomainError> {
    if (!props.id || props.id.trim().length === 0) {
      return Result.fail(new DomainError('상담 세션 ID는 필수입니다', 'INVALID_SESSION_ID'));
    }

    if (!props.voucherLinkageId || props.voucherLinkageId.trim().length === 0) {
      return Result.fail(
        new DomainError('바우처 연계 ID는 필수입니다', 'INVALID_LINKAGE_ID'),
      );
    }

    if (!props.scheduledStartTime || !props.scheduledEndTime) {
      return Result.fail(
        new DomainError('상담 시작/종료 시간은 필수입니다', 'INVALID_TIME'),
      );
    }

    return Result.ok(
      new CounselSession(
        props.id,
        props.voucherLinkageId,
        props.counselRequestId,
        props.childId,
        props.bImpactInstitutionId,
        props.sessionNumber,
        props.scheduledDate,
        props.scheduledStartTime,
        props.scheduledEndTime,
        props.sessionType,
        SessionStatus.SCHEDULED,
        undefined,
        props.notes,
        new Date(),
        new Date(),
      ),
    );
  }

  static restore(props: CounselSessionProps): CounselSession {
    return new CounselSession(
      props.id,
      props.voucherLinkageId,
      props.counselRequestId,
      props.childId,
      props.bImpactInstitutionId,
      props.sessionNumber,
      props.scheduledDate,
      props.scheduledStartTime,
      props.scheduledEndTime,
      props.sessionType,
      props.status,
      props.cancelReason,
      props.notes,
      props.createdAt,
      props.updatedAt,
    );
  }

  // ============================================
  // Business Logic
  // ============================================

  updateSchedule(updates: {
    scheduledDate?: Date;
    scheduledStartTime?: string;
    scheduledEndTime?: string;
    sessionType?: SessionType;
    notes?: string;
  }): Result<void, DomainError> {
    if (this._status !== SessionStatus.SCHEDULED) {
      return Result.fail(
        new DomainError('예정 상태의 세션만 수정할 수 있습니다', 'INVALID_STATUS'),
      );
    }

    if (updates.scheduledDate !== undefined) this._scheduledDate = updates.scheduledDate;
    if (updates.scheduledStartTime !== undefined)
      this._scheduledStartTime = updates.scheduledStartTime;
    if (updates.scheduledEndTime !== undefined)
      this._scheduledEndTime = updates.scheduledEndTime;
    if (updates.sessionType !== undefined) this._sessionType = updates.sessionType;
    if (updates.notes !== undefined) this._notes = updates.notes;
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  complete(): Result<void, DomainError> {
    if (this._status !== SessionStatus.SCHEDULED) {
      return Result.fail(
        new DomainError('예정 상태의 세션만 완료 처리할 수 있습니다', 'INVALID_STATUS'),
      );
    }

    this._status = SessionStatus.COMPLETED;
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  cancel(reason: string): Result<void, DomainError> {
    if (this._status !== SessionStatus.SCHEDULED) {
      return Result.fail(
        new DomainError('예정 상태의 세션만 취소할 수 있습니다', 'INVALID_STATUS'),
      );
    }

    if (!reason || reason.trim().length === 0) {
      return Result.fail(new DomainError('취소 사유는 필수입니다', 'CANCEL_REASON_REQUIRED'));
    }

    this._status = SessionStatus.CANCELLED;
    this._cancelReason = reason;
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  markNoShow(): Result<void, DomainError> {
    if (this._status !== SessionStatus.SCHEDULED) {
      return Result.fail(
        new DomainError('예정 상태의 세션만 불참 처리할 수 있습니다', 'INVALID_STATUS'),
      );
    }

    this._status = SessionStatus.NO_SHOW;
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }
}
