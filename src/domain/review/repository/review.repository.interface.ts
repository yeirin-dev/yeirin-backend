import { Review } from '../model/review';

/**
 * 리뷰 Repository 인터페이스 (Domain)
 */
export interface ReviewRepository {
  /**
   * 리뷰 저장 (생성 또는 수정)
   */
  save(review: Review): Promise<Review>;

  /**
   * 리뷰 ID로 조회
   */
  findById(id: string): Promise<Review | null>;

  /**
   * 기관 ID로 리뷰 조회
   */
  findByInstitutionId(institutionId: string): Promise<Review[]>;

  /**
   * 사용자 ID로 리뷰 조회
   */
  findByUserId(userId: string): Promise<Review[]>;

  /**
   * 사용자가 특정 기관에 이미 리뷰를 작성했는지 확인
   */
  existsByUserIdAndInstitutionId(userId: string, institutionId: string): Promise<boolean>;

  /**
   * 모든 리뷰 조회 (페이지네이션)
   */
  findAll(page: number, limit: number): Promise<{ reviews: Review[]; total: number }>;

  /**
   * 리뷰 삭제
   */
  delete(id: string): Promise<void>;
}
