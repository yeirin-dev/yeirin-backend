import { CounselRequestRecommendation } from '../model/counsel-request-recommendation';

/**
 * CounselRequestRecommendation Repository Interface
 * (도메인 계층 - 프레임워크 독립)
 */
export interface CounselRequestRecommendationRepository {
  /**
   * 추천 저장 (단일)
   */
  save(recommendation: CounselRequestRecommendation): Promise<CounselRequestRecommendation>;

  /**
   * 추천 목록 저장 (벌크)
   */
  saveAll(
    recommendations: CounselRequestRecommendation[],
  ): Promise<CounselRequestRecommendation[]>;

  /**
   * 상담의뢰지 ID로 추천 목록 조회 (rank 순)
   */
  findByCounselRequestId(counselRequestId: string): Promise<CounselRequestRecommendation[]>;

  /**
   * ID로 추천 단건 조회
   */
  findById(id: string): Promise<CounselRequestRecommendation | null>;

  /**
   * 상담의뢰지의 선택된 추천 조회
   */
  findSelectedByCounselRequestId(
    counselRequestId: string,
  ): Promise<CounselRequestRecommendation | null>;

  /**
   * 삭제 (상담의뢰지 삭제 시 CASCADE)
   */
  deleteByCounselRequestId(counselRequestId: string): Promise<void>;
}
