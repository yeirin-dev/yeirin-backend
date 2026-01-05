import { MatchingRecommendation } from '../entity/matching-recommendation';
import { CounselRequestText } from '../value-object/counsel-request-text';

/**
 * 추천 Repository 인터페이스
 * Domain 계층에서 정의, Infrastructure 계층에서 구현
 */
export interface RecommendationRepository {
  /**
   * AI MSA를 통해 상담기관 추천 요청
   */
  requestRecommendation(counselRequestText: CounselRequestText): Promise<MatchingRecommendation>;
}
