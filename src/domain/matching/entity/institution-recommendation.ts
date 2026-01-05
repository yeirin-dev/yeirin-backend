import { Result } from '@domain/shared/result';
import { InstitutionId } from '../value-object/institution-id';
import { RecommendationScore } from '../value-object/recommendation-score';

interface InstitutionRecommendationProps {
  institutionId: InstitutionId;
  score: RecommendationScore;
  reason: string;
}

/**
 * 상담기관 추천 결과 Entity
 * 단일 상담기관에 대한 추천 정보를 표현
 */
export class InstitutionRecommendation {
  private static readonly MAX_REASON_LENGTH = 1000;
  private static readonly HIGH_SCORE_THRESHOLD = 0.7;

  private constructor(
    private readonly _institutionId: InstitutionId,
    private readonly _score: RecommendationScore,
    private readonly _reason: string,
  ) {
    Object.freeze(this);
  }

  get institutionId(): InstitutionId {
    return this._institutionId;
  }

  get score(): RecommendationScore {
    return this._score;
  }

  get reason(): string {
    return this._reason;
  }

  static create(props: InstitutionRecommendationProps): Result<InstitutionRecommendation> {
    const { institutionId, score, reason } = props;

    if (!reason || reason.trim().length === 0) {
      return Result.fail('추천 이유는 필수입니다');
    }

    if (reason.length > this.MAX_REASON_LENGTH) {
      return Result.fail(`추천 이유는 최대 ${this.MAX_REASON_LENGTH}자까지 가능합니다`);
    }

    return Result.ok(new InstitutionRecommendation(institutionId, score, reason.trim()));
  }

  /**
   * 높은 점수의 추천인지 판별 (0.7 이상)
   */
  isHighScore(): boolean {
    return this._score.value >= InstitutionRecommendation.HIGH_SCORE_THRESHOLD;
  }
}
