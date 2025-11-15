import { Result } from '@domain/shared/result';
import { CounselRequestText } from '../value-object/counsel-request-text';
import { InstitutionRecommendation } from './institution-recommendation';

interface MatchingRecommendationProps {
  counselRequestText: CounselRequestText;
  recommendations: InstitutionRecommendation[];
}

/**
 * 매칭 추천 Aggregate Root
 * 하나의 상담의뢰지에 대한 전체 추천 결과를 관리
 */
export class MatchingRecommendation {
  private static readonly MIN_RECOMMENDATIONS = 1;
  private static readonly MAX_RECOMMENDATIONS = 10;

  private constructor(
    private readonly _counselRequestText: CounselRequestText,
    private readonly _recommendations: InstitutionRecommendation[],
    private readonly _createdAt: Date,
  ) {
    Object.freeze(this);
  }

  get counselRequestText(): CounselRequestText {
    return this._counselRequestText;
  }

  get recommendations(): InstitutionRecommendation[] {
    return [...this._recommendations];
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  static create(props: MatchingRecommendationProps): Result<MatchingRecommendation> {
    const { counselRequestText, recommendations } = props;

    if (recommendations.length < this.MIN_RECOMMENDATIONS) {
      return Result.fail('최소 1개 이상의 추천 결과가 필요합니다');
    }

    if (recommendations.length > this.MAX_RECOMMENDATIONS) {
      return Result.fail(`추천 결과는 최대 ${this.MAX_RECOMMENDATIONS}개까지 가능합니다`);
    }

    return Result.ok(
      new MatchingRecommendation(counselRequestText, recommendations, new Date()),
    );
  }

  /**
   * 점수 기준 내림차순 정렬
   */
  getSortedByScore(): InstitutionRecommendation[] {
    return [...this._recommendations].sort((a, b) => b.score.value - a.score.value);
  }

  /**
   * 최고 점수 추천 반환
   */
  getTopRecommendation(): InstitutionRecommendation {
    return this.getSortedByScore()[0];
  }

  /**
   * 높은 점수(0.7 이상)의 추천만 필터링
   */
  getHighScoredRecommendations(): InstitutionRecommendation[] {
    return this._recommendations.filter((rec) => rec.isHighScore());
  }
}
