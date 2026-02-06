import { Result, DomainError } from '@domain/common/result';

/**
 * 바우처 연계 상태
 */
export enum VoucherLinkageStatus {
  /** 연계대기 - 바우처 추천대상이나 아직 연계되지 않음 */
  PENDING = 'PENDING',

  /** 연계완료 - 바우처 기관에 연계됨 */
  COMPLETED = 'COMPLETED',
}

export interface VoucherLinkageProps {
  id: string;
  counselRequestId: string;
  status: VoucherLinkageStatus;
  linkedInstitutionName?: string;
  linkedInstitutionPhone?: string;
  linkedInstitutionAddress?: string;
  linkedCounselorName?: string;
  linkedAt?: Date;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * VoucherLinkage Entity
 * 바우처 추천대상 아동의 기관 연계 상태 추적
 */
export class VoucherLinkage {
  private constructor(
    private readonly _id: string,
    private readonly _counselRequestId: string,
    private _status: VoucherLinkageStatus,
    private _linkedInstitutionName?: string,
    private _linkedInstitutionPhone?: string,
    private _linkedInstitutionAddress?: string,
    private _linkedCounselorName?: string,
    private _linkedAt?: Date,
    private _notes?: string,
    private _createdBy?: string,
    private _updatedBy?: string,
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {}

  // ============================================
  // Getters
  // ============================================

  get id(): string {
    return this._id;
  }

  get counselRequestId(): string {
    return this._counselRequestId;
  }

  get status(): VoucherLinkageStatus {
    return this._status;
  }

  get linkedInstitutionName(): string | undefined {
    return this._linkedInstitutionName;
  }

  get linkedInstitutionPhone(): string | undefined {
    return this._linkedInstitutionPhone;
  }

  get linkedInstitutionAddress(): string | undefined {
    return this._linkedInstitutionAddress;
  }

  get linkedCounselorName(): string | undefined {
    return this._linkedCounselorName;
  }

  get linkedAt(): Date | undefined {
    return this._linkedAt;
  }

  get notes(): string | undefined {
    return this._notes;
  }

  get createdBy(): string | undefined {
    return this._createdBy;
  }

  get updatedBy(): string | undefined {
    return this._updatedBy;
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

  /**
   * 새로운 바우처 연계현황 생성 (연계대기 상태로 시작)
   */
  static create(props: {
    id: string;
    counselRequestId: string;
    createdBy?: string;
    notes?: string;
  }): Result<VoucherLinkage, DomainError> {
    const { id, counselRequestId, createdBy, notes } = props;

    if (!id || id.trim().length === 0) {
      return Result.fail(new DomainError('바우처 연계 ID는 필수입니다'));
    }

    if (!counselRequestId || counselRequestId.trim().length === 0) {
      return Result.fail(new DomainError('상담의뢰지 ID는 필수입니다'));
    }

    return Result.ok(
      new VoucherLinkage(
        id,
        counselRequestId,
        VoucherLinkageStatus.PENDING,
        undefined, // linkedInstitutionName
        undefined, // linkedInstitutionPhone
        undefined, // linkedInstitutionAddress
        undefined, // linkedCounselorName
        undefined, // linkedAt
        notes,
        createdBy,
        undefined, // updatedBy
        new Date(),
        new Date(),
      ),
    );
  }

  /**
   * DB에서 복원
   */
  static restore(props: VoucherLinkageProps): VoucherLinkage {
    return new VoucherLinkage(
      props.id,
      props.counselRequestId,
      props.status,
      props.linkedInstitutionName,
      props.linkedInstitutionPhone,
      props.linkedInstitutionAddress,
      props.linkedCounselorName,
      props.linkedAt,
      props.notes,
      props.createdBy,
      props.updatedBy,
      props.createdAt,
      props.updatedAt,
    );
  }

  // ============================================
  // Business Logic
  // ============================================

  /**
   * 연계 완료 처리
   */
  completeLinkage(props: {
    linkedInstitutionName: string;
    linkedInstitutionPhone?: string;
    linkedInstitutionAddress?: string;
    linkedCounselorName?: string;
    linkedAt?: Date;
    notes?: string;
    updatedBy?: string;
  }): Result<void, DomainError> {
    if (!props.linkedInstitutionName || props.linkedInstitutionName.trim().length === 0) {
      return Result.fail(new DomainError('연계 기관명은 필수입니다'));
    }

    this._status = VoucherLinkageStatus.COMPLETED;
    this._linkedInstitutionName = props.linkedInstitutionName;
    this._linkedInstitutionPhone = props.linkedInstitutionPhone;
    this._linkedInstitutionAddress = props.linkedInstitutionAddress;
    this._linkedCounselorName = props.linkedCounselorName;
    this._linkedAt = props.linkedAt ?? new Date();
    this._notes = props.notes ?? this._notes;
    this._updatedBy = props.updatedBy;
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * 연계 정보 수정
   */
  update(props: {
    linkedInstitutionName?: string;
    linkedInstitutionPhone?: string;
    linkedInstitutionAddress?: string;
    linkedCounselorName?: string;
    linkedAt?: Date;
    notes?: string;
    updatedBy?: string;
  }): Result<void, DomainError> {
    if (props.linkedInstitutionName !== undefined) {
      this._linkedInstitutionName = props.linkedInstitutionName;
    }
    if (props.linkedInstitutionPhone !== undefined) {
      this._linkedInstitutionPhone = props.linkedInstitutionPhone;
    }
    if (props.linkedInstitutionAddress !== undefined) {
      this._linkedInstitutionAddress = props.linkedInstitutionAddress;
    }
    if (props.linkedCounselorName !== undefined) {
      this._linkedCounselorName = props.linkedCounselorName;
    }
    if (props.linkedAt !== undefined) {
      this._linkedAt = props.linkedAt;
    }
    if (props.notes !== undefined) {
      this._notes = props.notes;
    }
    if (props.updatedBy !== undefined) {
      this._updatedBy = props.updatedBy;
    }

    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * 상태 변경
   */
  changeStatus(status: VoucherLinkageStatus, updatedBy?: string): Result<void, DomainError> {
    // 연계완료로 변경 시 기관 정보 필수
    if (status === VoucherLinkageStatus.COMPLETED && !this._linkedInstitutionName) {
      return Result.fail(new DomainError('연계 완료 시 기관 정보가 필요합니다'));
    }

    this._status = status;
    this._updatedBy = updatedBy;
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * 연계 완료 상태인지 확인
   */
  isCompleted(): boolean {
    return this._status === VoucherLinkageStatus.COMPLETED;
  }

  /**
   * 연계 대기 상태인지 확인
   */
  isPending(): boolean {
    return this._status === VoucherLinkageStatus.PENDING;
  }
}
