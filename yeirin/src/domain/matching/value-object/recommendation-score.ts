import { Result } from '@domain/shared/result';

/**
 * 추천 점수 Value Object
 * 0.0 ~ 1.0 사이의 값
 */
export class RecommendationScore {
  private static readonly MIN_SCORE = 0.0;
  private static readonly MAX_SCORE = 1.0;

  private constructor(private readonly _value: number) {
    Object.freeze(this);
  }

  get value(): number {
    return this._value;
  }

  static create(score: number): Result<RecommendationScore> {
    if (score < this.MIN_SCORE || score > this.MAX_SCORE) {
      return Result.fail('추천 점수는 0.0에서 1.0 사이여야 합니다');
    }

    return Result.ok(new RecommendationScore(score));
  }

  /**
   * 백분율로 변환 (0-100)
   */
  toPercentage(): number {
    return Math.round(this._value * 100);
  }

  equals(other: RecommendationScore): boolean {
    if (!other) {
      return false;
    }
    return Math.abs(this._value - other._value) < 0.0001;
  }
}
