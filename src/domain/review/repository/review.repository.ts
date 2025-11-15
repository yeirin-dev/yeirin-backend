import { ReviewEntity } from '@infrastructure/persistence/typeorm/entity/review.entity';

/**
 * 리뷰 Repository 인터페이스
 */
export interface ReviewRepository {
  /**
   * 리뷰 ID로 조회
   */
  findById(id: string): Promise<ReviewEntity | null>;

  /**
   * 모든 리뷰 조회 (페이지네이션)
   */
  findAll(page: number, limit: number): Promise<[ReviewEntity[], number]>;

  /**
   * 기관 ID로 리뷰 조회
   */
  findByInstitutionId(institutionId: string): Promise<ReviewEntity[]>;

  /**
   * 리뷰 생성
   */
  create(review: Omit<ReviewEntity, 'id' | 'createdAt' | 'updatedAt' | 'institution'>): Promise<ReviewEntity>;

  /**
   * 리뷰 수정
   */
  update(id: string, review: Partial<ReviewEntity>): Promise<ReviewEntity>;

  /**
   * 리뷰 삭제
   */
  delete(id: string): Promise<void>;

  /**
   * 특정 별점 이상의 리뷰 조회
   */
  findByMinRating(minRating: number): Promise<ReviewEntity[]>;

  /**
   * 도움이 됨 증가
   */
  incrementHelpfulCount(id: string): Promise<ReviewEntity>;
}
