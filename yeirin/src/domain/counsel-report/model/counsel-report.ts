import { Result, DomainError } from '@domain/common/result';
import { ReportStatus, canTransitionTo, isCounselorEditable } from './value-objects/report-status';

/**
 * 면담결과지 Aggregate Root
 *
 * @description
 * 바우처 연계 후 매 회차 상담마다 상담사가 작성하는 면담 결과 보고서
 * - 하나의 상담의뢰지(CounselRequest)에 여러 회차의 면담결과지가 작성됨
 * - 상담사가 작성 → 제출 → 보호자 확인 → 보호자 피드백 흐름
 */
export interface CounselReportProps {
  counselRequestId: string; // 상담의뢰지 ID
  childId: string; // 아동 ID
  counselorId: string; // 상담사 ID
  institutionId: string; // 기관 ID
  sessionNumber: number; // 회차 (1, 2, 3, ...)
  reportDate: Date; // 의뢰(작성)일자
  centerName: string; // 센터명
  counselorSignature: string | null; // 담당자 서명 (이미지 URL)
  counselReason: string; // 상담 사유
  counselContent: string; // 상담 내용
  centerFeedback: string | null; // 센터에 전하는 피드백
  homeFeedback: string | null; // 가정에 전하는 피드백
  attachmentUrls: string[]; // 첨부 파일 URL 목록
  status: ReportStatus; // 상태
  submittedAt: Date | null; // 제출 시각
  reviewedAt: Date | null; // 보호자 확인 시각
  guardianFeedback: string | null; // 보호자 피드백
  createdAt: Date;
  updatedAt: Date;
}

export interface FullCounselReportProps extends CounselReportProps {
  id: string;
}

export type CreateCounselReportProps = Omit<
  CounselReportProps,
  'status' | 'submittedAt' | 'reviewedAt' | 'guardianFeedback' | 'createdAt' | 'updatedAt'
>;

export class CounselReport {
  private readonly _id: string;
  private _counselRequestId: string;
  private _childId: string;
  private _counselorId: string;
  private _institutionId: string;
  private _sessionNumber: number;
  private _reportDate: Date;
  private _centerName: string;
  private _counselorSignature: string | null;
  private _counselReason: string;
  private _counselContent: string;
  private _centerFeedback: string | null;
  private _homeFeedback: string | null;
  private _attachmentUrls: string[];
  private _status: ReportStatus;
  private _submittedAt: Date | null;
  private _reviewedAt: Date | null;
  private _guardianFeedback: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: FullCounselReportProps) {
    this._id = props.id;
    this._counselRequestId = props.counselRequestId;
    this._childId = props.childId;
    this._counselorId = props.counselorId;
    this._institutionId = props.institutionId;
    this._sessionNumber = props.sessionNumber;
    this._reportDate = props.reportDate;
    this._centerName = props.centerName;
    this._counselorSignature = props.counselorSignature;
    this._counselReason = props.counselReason;
    this._counselContent = props.counselContent;
    this._centerFeedback = props.centerFeedback;
    this._homeFeedback = props.homeFeedback;
    this._attachmentUrls = props.attachmentUrls;
    this._status = props.status;
    this._submittedAt = props.submittedAt;
    this._reviewedAt = props.reviewedAt;
    this._guardianFeedback = props.guardianFeedback;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // ==================== Getters ====================

  get id(): string {
    return this._id;
  }

  get counselRequestId(): string {
    return this._counselRequestId;
  }

  get childId(): string {
    return this._childId;
  }

  get counselorId(): string {
    return this._counselorId;
  }

  get institutionId(): string {
    return this._institutionId;
  }

  get sessionNumber(): number {
    return this._sessionNumber;
  }

  get reportDate(): Date {
    return this._reportDate;
  }

  get centerName(): string {
    return this._centerName;
  }

  get counselorSignature(): string | null {
    return this._counselorSignature;
  }

  get counselReason(): string {
    return this._counselReason;
  }

  get counselContent(): string {
    return this._counselContent;
  }

  get centerFeedback(): string | null {
    return this._centerFeedback;
  }

  get homeFeedback(): string | null {
    return this._homeFeedback;
  }

  get attachmentUrls(): string[] {
    return this._attachmentUrls;
  }

  get status(): ReportStatus {
    return this._status;
  }

  get submittedAt(): Date | null {
    return this._submittedAt;
  }

  get reviewedAt(): Date | null {
    return this._reviewedAt;
  }

  get guardianFeedback(): string | null {
    return this._guardianFeedback;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ==================== Static Factory Methods ====================

  /**
   * 새로운 면담결과지 생성 (상담사가 작성 시작)
   */
  public static create(
    props: CreateCounselReportProps,
    id?: string,
  ): Result<CounselReport, DomainError> {
    // 검증: 회차는 1 이상
    if (props.sessionNumber < 1) {
      return Result.fail(new DomainError('회차는 1 이상이어야 합니다.', 'INVALID_SESSION_NUMBER'));
    }

    // 검증: 필수 필드
    if (!props.counselRequestId || !props.childId || !props.counselorId || !props.institutionId) {
      return Result.fail(new DomainError('필수 필드가 누락되었습니다.', 'MISSING_REQUIRED_FIELDS'));
    }

    // 검증: 상담 사유와 내용은 비어있을 수 없음
    if (!props.counselReason?.trim() || !props.counselContent?.trim()) {
      return Result.fail(
        new DomainError('상담 사유와 내용은 필수입니다.', 'MISSING_COUNSEL_CONTENT'),
      );
    }

    // 검증: 센터명
    if (!props.centerName?.trim()) {
      return Result.fail(new DomainError('센터명은 필수입니다.', 'MISSING_CENTER_NAME'));
    }

    const now = new Date();
    const counselReport = new CounselReport({
      id: id || crypto.randomUUID(),
      ...props,
      status: ReportStatus.DRAFT,
      submittedAt: null,
      reviewedAt: null,
      guardianFeedback: null,
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(counselReport);
  }

  /**
   * DB에서 복원 (모든 필드 포함)
   */
  public static restore(props: FullCounselReportProps): CounselReport {
    return new CounselReport(props);
  }

  // ==================== Business Logic ====================

  /**
   * 면담결과지 수정 (DRAFT 상태에서만 가능)
   */
  public update(updates: {
    counselReason?: string;
    counselContent?: string;
    centerFeedback?: string;
    homeFeedback?: string;
    counselorSignature?: string;
    attachmentUrls?: string[];
  }): Result<void, DomainError> {
    if (!isCounselorEditable(this._status)) {
      return Result.fail(
        new DomainError('작성 중 상태에서만 수정할 수 있습니다.', 'CANNOT_UPDATE_SUBMITTED_REPORT'),
      );
    }

    // 필수 필드 검증
    if (updates.counselReason !== undefined && !updates.counselReason.trim()) {
      return Result.fail(
        new DomainError('상담 사유는 비어있을 수 없습니다.', 'INVALID_COUNSEL_REASON'),
      );
    }

    if (updates.counselContent !== undefined && !updates.counselContent.trim()) {
      return Result.fail(
        new DomainError('상담 내용은 비어있을 수 없습니다.', 'INVALID_COUNSEL_CONTENT'),
      );
    }

    // 업데이트 적용
    if (updates.counselReason !== undefined) this._counselReason = updates.counselReason;
    if (updates.counselContent !== undefined) this._counselContent = updates.counselContent;
    if (updates.centerFeedback !== undefined) this._centerFeedback = updates.centerFeedback;
    if (updates.homeFeedback !== undefined) this._homeFeedback = updates.homeFeedback;
    if (updates.counselorSignature !== undefined)
      this._counselorSignature = updates.counselorSignature;
    if (updates.attachmentUrls !== undefined) this._attachmentUrls = updates.attachmentUrls;
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * 면담결과지 제출 (상담사 → 플랫폼)
   */
  public submit(): Result<void, DomainError> {
    if (!canTransitionTo(this._status, ReportStatus.SUBMITTED)) {
      return Result.fail(
        new DomainError('현재 상태에서 제출할 수 없습니다.', 'INVALID_STATUS_TRANSITION'),
      );
    }

    // 필수 내용 검증
    if (!this._counselReason.trim() || !this._counselContent.trim()) {
      return Result.fail(
        new DomainError(
          '상담 사유와 내용을 모두 작성해야 제출할 수 있습니다.',
          'INCOMPLETE_REPORT',
        ),
      );
    }

    this._status = ReportStatus.SUBMITTED;
    this._submittedAt = new Date();
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * 보호자 확인 처리
   */
  public markAsReviewed(): Result<void, DomainError> {
    if (!canTransitionTo(this._status, ReportStatus.REVIEWED)) {
      return Result.fail(
        new DomainError('제출된 상태에서만 확인 처리할 수 있습니다.', 'INVALID_STATUS_TRANSITION'),
      );
    }

    this._status = ReportStatus.REVIEWED;
    this._reviewedAt = new Date();
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * 보호자 피드백 작성 및 승인
   */
  public approveWithFeedback(feedback: string): Result<void, DomainError> {
    if (!canTransitionTo(this._status, ReportStatus.APPROVED)) {
      return Result.fail(
        new DomainError('확인된 상태에서만 승인할 수 있습니다.', 'INVALID_STATUS_TRANSITION'),
      );
    }

    if (!feedback.trim()) {
      return Result.fail(new DomainError('피드백은 비어있을 수 없습니다.', 'INVALID_FEEDBACK'));
    }

    this._status = ReportStatus.APPROVED;
    this._guardianFeedback = feedback;
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * 반려 (SUBMITTED → DRAFT)
   */
  public reject(): Result<void, DomainError> {
    if (this._status !== ReportStatus.SUBMITTED) {
      return Result.fail(
        new DomainError('제출된 상태에서만 반려할 수 있습니다.', 'INVALID_STATUS_TRANSITION'),
      );
    }

    this._status = ReportStatus.DRAFT;
    this._submittedAt = null;
    this._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * 상담사가 수정 가능한지 확인
   */
  public canEdit(): boolean {
    return isCounselorEditable(this._status);
  }

  /**
   * 보호자가 조회 가능한지 확인
   */
  public isVisibleToGuardian(): boolean {
    return this._status !== ReportStatus.DRAFT;
  }
}
