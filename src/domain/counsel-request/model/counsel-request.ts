import { DomainError, Result } from '@domain/common/result';
import { CareType, CounselRequestStatus } from './value-objects/counsel-request-enums';
import { CounselRequestFormData } from './value-objects/counsel-request-form-data';

/**
 * CounselRequest Aggregate Root
 * 상담의뢰지 도메인 모델
 */
export class CounselRequest {
  private constructor(
    private readonly _id: string,
    private readonly _childId: string,
    private readonly _guardianId: string,
    private _status: CounselRequestStatus,
    private _formData: CounselRequestFormData,
    private _centerName: string,
    private _careType: CareType,
    private _requestDate: Date,
    private _matchedInstitutionId?: string,
    private _matchedCounselorId?: string,
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {}

  // ============================================
  // Getters
  // ============================================

  get id(): string {
    return this._id;
  }

  get childId(): string {
    return this._childId;
  }

  get guardianId(): string {
    return this._guardianId;
  }

  get status(): CounselRequestStatus {
    return this._status;
  }

  get formData(): CounselRequestFormData {
    return this._formData;
  }

  get centerName(): string {
    return this._centerName;
  }

  get careType(): CareType {
    return this._careType;
  }

  get requestDate(): Date {
    return this._requestDate;
  }

  get matchedInstitutionId(): string | undefined {
    return this._matchedInstitutionId;
  }

  get matchedCounselorId(): string | undefined {
    return this._matchedCounselorId;
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
   * 새로운 상담의뢰서 생성 (접수)
   */
  static create(props: {
    id: string;
    childId: string;
    guardianId: string;
    formData: CounselRequestFormData;
  }): Result<CounselRequest, DomainError> {
    const { id, childId, guardianId, formData } = props;

    // 유효성 검증
    const validationResult = this.validate(formData);
    if (validationResult.isFailure) {
      return Result.fail(validationResult.getError());
    }

    // 검색용 필드 추출
    const centerName = formData.coverInfo.centerName;
    const careType = formData.basicInfo.careType;
    const requestDate = new Date(
      formData.coverInfo.requestDate.year,
      formData.coverInfo.requestDate.month - 1,
      formData.coverInfo.requestDate.day,
    );

    return Result.ok(
      new CounselRequest(
        id,
        childId,
        guardianId,
        CounselRequestStatus.PENDING,
        formData,
        centerName,
        careType,
        requestDate,
      ),
    );
  }

  /**
   * DB에서 복원 (모든 필드 포함)
   */
  static restore(props: {
    id: string;
    childId: string;
    guardianId: string;
    status: CounselRequestStatus;
    formData: CounselRequestFormData;
    centerName: string;
    careType: CareType;
    requestDate: Date;
    matchedInstitutionId?: string;
    matchedCounselorId?: string;
    createdAt: Date;
    updatedAt: Date;
  }): CounselRequest {
    return new CounselRequest(
      props.id,
      props.childId,
      props.guardianId,
      props.status,
      props.formData,
      props.centerName,
      props.careType,
      props.requestDate,
      props.matchedInstitutionId,
      props.matchedCounselorId,
      props.createdAt,
      props.updatedAt,
    );
  }

  // ============================================
  // Business Logic
  // ============================================

  /**
   * 양식 데이터 유효성 검증
   */
  private static validate(formData: CounselRequestFormData): Result<void, DomainError> {
    // 필수 필드 검증
    if (!formData.coverInfo?.centerName) {
      return Result.fail(new DomainError('센터명은 필수입니다'));
    }

    if (!formData.coverInfo?.counselorName) {
      return Result.fail(new DomainError('담당자 이름은 필수입니다'));
    }

    if (!formData.basicInfo?.childInfo?.name) {
      return Result.fail(new DomainError('아동 이름은 필수입니다'));
    }

    // 의뢰 일자 유효성 검증
    const { year, month, day } = formData.coverInfo.requestDate;
    if (month < 1 || month > 12) {
      return Result.fail(new DomainError('월은 1-12 사이여야 합니다'));
    }
    if (day < 1 || day > 31) {
      return Result.fail(new DomainError('일은 1-31 사이여야 합니다'));
    }

    // 우선돌봄 아동인 경우 세부 사유 필수
    if (formData.basicInfo.careType === CareType.PRIORITY && !formData.basicInfo.priorityReason) {
      return Result.fail(new DomainError('우선돌봄 아동은 세부 사유를 선택해야 합니다'));
    }

    return Result.ok(undefined);
  }

  /**
   * AI 추천 완료로 상태 변경
   * PENDING → RECOMMENDED
   */
  markAsRecommended(): Result<void, DomainError> {
    if (this._status !== CounselRequestStatus.PENDING) {
      return Result.fail(new DomainError('AI 추천은 접수 대기 상태에서만 가능합니다'));
    }

    this._status = CounselRequestStatus.RECOMMENDED;
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * 추천된 기관 중 하나 선택
   * RECOMMENDED → MATCHED
   */
  selectInstitution(institutionId: string): Result<void, DomainError> {
    if (this._status !== CounselRequestStatus.RECOMMENDED) {
      return Result.fail(new DomainError('기관 선택은 AI 추천 완료 상태에서만 가능합니다'));
    }

    if (!institutionId || institutionId.trim().length === 0) {
      return Result.fail(new DomainError('기관 ID는 필수입니다'));
    }

    this._status = CounselRequestStatus.MATCHED;
    this._matchedInstitutionId = institutionId;
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * 매칭 완료 (기관 + 상담사)
   * @deprecated 새로운 추천 플로우에서는 selectInstitution() 사용
   */
  matchWith(institutionId: string, counselorId: string): Result<void, DomainError> {
    if (this._status !== CounselRequestStatus.PENDING) {
      return Result.fail(new DomainError('접수 대기 상태에서만 매칭할 수 있습니다'));
    }

    this._status = CounselRequestStatus.MATCHED;
    this._matchedInstitutionId = institutionId;
    this._matchedCounselorId = counselorId;
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * 상담 시작
   */
  startCounseling(): Result<void, DomainError> {
    if (this._status !== CounselRequestStatus.MATCHED) {
      return Result.fail(new DomainError('매칭 완료 상태에서만 상담을 시작할 수 있습니다'));
    }

    this._status = CounselRequestStatus.IN_PROGRESS;
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * 상담 완료
   */
  completeCounseling(): Result<void, DomainError> {
    if (this._status !== CounselRequestStatus.IN_PROGRESS) {
      return Result.fail(new DomainError('상담 진행 중 상태에서만 완료할 수 있습니다'));
    }

    this._status = CounselRequestStatus.COMPLETED;
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * 매칭 거부
   */
  reject(reason?: string): Result<void, DomainError> {
    if (this._status === CounselRequestStatus.COMPLETED) {
      return Result.fail(new DomainError('완료된 상담의뢰는 거부할 수 없습니다'));
    }

    this._status = CounselRequestStatus.REJECTED;
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * 양식 데이터 수정 (접수 대기 상태에서만)
   */
  updateFormData(formData: CounselRequestFormData): Result<void, DomainError> {
    if (this._status !== CounselRequestStatus.PENDING) {
      return Result.fail(new DomainError('접수 대기 상태에서만 수정할 수 있습니다'));
    }

    // 유효성 검증
    const validationResult = CounselRequest.validate(formData);
    if (validationResult.isFailure) {
      return validationResult;
    }

    // 검색용 필드 업데이트
    this._formData = formData;
    this._centerName = formData.coverInfo.centerName;
    this._careType = formData.basicInfo.careType;
    this._requestDate = new Date(
      formData.coverInfo.requestDate.year,
      formData.coverInfo.requestDate.month - 1,
      formData.coverInfo.requestDate.day,
    );
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * Admin 상태 강제 변경
   * - COMPLETED 상태인 상담의뢰는 변경 불가
   * - COMPLETED 상태로의 변경 불가
   * - 사유 필수
   */
  adminForceStatus(newStatus: CounselRequestStatus, reason: string): Result<void, DomainError> {
    // COMPLETED 상태인 경우 변경 불가
    if (this._status === CounselRequestStatus.COMPLETED) {
      return Result.fail(new DomainError('완료된 상담의뢰는 상태를 변경할 수 없습니다'));
    }

    // COMPLETED 상태로 직접 변경 불가
    if (newStatus === CounselRequestStatus.COMPLETED) {
      return Result.fail(
        new DomainError(
          '관리자가 직접 완료 상태로 변경할 수 없습니다. 정상적인 상담 완료 플로우를 사용해주세요.',
        ),
      );
    }

    // 사유 필수
    if (!reason || reason.trim().length < 10) {
      return Result.fail(new DomainError('변경 사유는 최소 10자 이상이어야 합니다'));
    }

    // 동일 상태로의 변경 방지
    if (this._status === newStatus) {
      return Result.fail(new DomainError('현재 상태와 동일한 상태로는 변경할 수 없습니다'));
    }

    // 상태 변경 (모든 상태 전환 허용 - Admin 권한)
    this._status = newStatus;
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }
}
