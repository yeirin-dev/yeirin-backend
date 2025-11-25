import { Result, DomainError } from '@domain/common/result';

export interface CounselRequestRecommendationProps {
  id: string;
  counselRequestId: string;
  institutionId: string;
  score: number;
  reason: string;
  rank: number;
  selected: boolean;
  createdAt: Date;
}

/**
 * CounselRequestRecommendation Entity
 * 상담의뢰지에 대한 AI 추천 결과 (최대 5개)
 */
export class CounselRequestRecommendation {
  private static readonly MIN_SCORE = 0;
  private static readonly MAX_SCORE = 1;
  private static readonly MIN_RANK = 1;
  private static readonly MAX_RANK = 5;
  private static readonly MAX_REASON_LENGTH = 1000;

  private constructor(
    private readonly _id: string,
    private readonly _counselRequestId: string,
    private readonly _institutionId: string,
    private readonly _score: number,
    private readonly _reason: string,
    private readonly _rank: number,
    private _selected: boolean,
    private readonly _createdAt: Date,
  ) {}

  // Getters
  get id(): string {
    return this._id;
  }

  get counselRequestId(): string {
    return this._counselRequestId;
  }

  get institutionId(): string {
    return this._institutionId;
  }

  get score(): number {
    return this._score;
  }

  get reason(): string {
    return this._reason;
  }

  get rank(): number {
    return this._rank;
  }

  get selected(): boolean {
    return this._selected;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * 새로운 추천 생성 (정적 팩토리 메서드)
   */
  static create(props: {
    id: string;
    counselRequestId: string;
    institutionId: string;
    score: number;
    reason: string;
    rank: number;
  }): Result<CounselRequestRecommendation, DomainError> {
    const { id, counselRequestId, institutionId, score, reason, rank } = props;

    // ID 검증
    if (!id || id.trim().length === 0) {
      return Result.fail(new DomainError('추천 ID는 필수입니다'));
    }

    if (!counselRequestId || counselRequestId.trim().length === 0) {
      return Result.fail(new DomainError('상담의뢰지 ID는 필수입니다'));
    }

    if (!institutionId || institutionId.trim().length === 0) {
      return Result.fail(new DomainError('기관 ID는 필수입니다'));
    }

    // Score 검증
    if (score < this.MIN_SCORE || score > this.MAX_SCORE) {
      return Result.fail(
        new DomainError(`추천 점수는 ${this.MIN_SCORE}~${this.MAX_SCORE} 사이여야 합니다`),
      );
    }

    // Reason 검증
    if (!reason || reason.trim().length === 0) {
      return Result.fail(new DomainError('추천 이유는 필수입니다'));
    }

    if (reason.length > this.MAX_REASON_LENGTH) {
      return Result.fail(
        new DomainError(`추천 이유는 최대 ${this.MAX_REASON_LENGTH}자까지 가능합니다`),
      );
    }

    // Rank 검증
    if (rank < this.MIN_RANK || rank > this.MAX_RANK) {
      return Result.fail(
        new DomainError(`순위는 ${this.MIN_RANK}~${this.MAX_RANK} 사이여야 합니다`),
      );
    }

    return Result.ok(
      new CounselRequestRecommendation(
        id,
        counselRequestId,
        institutionId,
        score,
        reason.trim(),
        rank,
        false, // 초기에는 선택되지 않음
        new Date(),
      ),
    );
  }

  /**
   * DB에서 복원 (정적 팩토리 메서드)
   */
  static restore(props: CounselRequestRecommendationProps): CounselRequestRecommendation {
    return new CounselRequestRecommendation(
      props.id,
      props.counselRequestId,
      props.institutionId,
      props.score,
      props.reason,
      props.rank,
      props.selected,
      props.createdAt,
    );
  }

  /**
   * 이 추천을 선택 처리
   */
  select(): Result<void, DomainError> {
    if (this._selected) {
      return Result.fail(new DomainError('이미 선택된 추천입니다'));
    }

    this._selected = true;
    return Result.ok(undefined);
  }

  /**
   * 높은 점수의 추천인지 판별 (0.7 이상)
   */
  isHighScore(): boolean {
    return this._score >= 0.7;
  }

  /**
   * 선택된 추천인지 확인
   */
  isSelected(): boolean {
    return this._selected;
  }
}
