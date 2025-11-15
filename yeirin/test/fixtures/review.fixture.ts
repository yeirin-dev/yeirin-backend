import { ReviewEntity } from '@infrastructure/persistence/typeorm/entity/review.entity';
import { VoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/voucher-institution.entity';

/**
 * 리뷰 테스트 픽스처
 * 테스트에서 사용할 더미 데이터 생성
 */
export class ReviewFixture {
  /**
   * 기본 리뷰 데이터 생성
   */
  static createReviewData(
    overrides?: Partial<ReviewEntity>,
  ): Omit<ReviewEntity, 'id' | 'createdAt' | 'updatedAt' | 'institution'> {
    return {
      institutionId: overrides?.institutionId || 'test-institution-id',
      userId: overrides?.userId !== undefined ? overrides.userId : 'test-user-id',
      authorNickname: overrides?.authorNickname || '테스트사용자',
      rating: overrides?.rating || 5,
      content: overrides?.content || '매우 만족스러운 상담이었습니다.',
      helpfulCount: overrides?.helpfulCount || 0,
    };
  }

  /**
   * 여러 리뷰 데이터 생성
   */
  static createMultipleReviewData(
    count: number,
    overrides?: Partial<ReviewEntity>,
  ): Array<Omit<ReviewEntity, 'id' | 'createdAt' | 'updatedAt' | 'institution'>> {
    return Array.from({ length: count }, (_, index) => ({
      ...this.createReviewData(overrides),
      authorNickname: `테스트사용자${index + 1}`,
      rating: ((index % 5) + 1) as 1 | 2 | 3 | 4 | 5,
    }));
  }

  /**
   * 완전한 리뷰 엔티티 생성 (ID 포함)
   */
  static createReviewEntity(overrides?: Partial<ReviewEntity>): ReviewEntity {
    const now = new Date();
    return {
      id: overrides?.id || 'test-review-id',
      institutionId: overrides?.institutionId || 'test-institution-id',
      userId: overrides?.userId !== undefined ? overrides.userId : 'test-user-id',
      authorNickname: overrides?.authorNickname || '테스트사용자',
      rating: overrides?.rating || 5,
      content: overrides?.content || '매우 만족스러운 상담이었습니다.',
      helpfulCount: overrides?.helpfulCount || 0,
      createdAt: overrides?.createdAt || now,
      updatedAt: overrides?.updatedAt || now,
      institution: overrides?.institution || this.createInstitutionEntity(),
    };
  }

  /**
   * 기관 엔티티 생성 (리뷰 관계용)
   */
  static createInstitutionEntity(
    overrides?: Partial<VoucherInstitutionEntity>,
  ): VoucherInstitutionEntity {
    const now = new Date();
    return {
      id: overrides?.id || 'test-institution-id',
      userId: overrides?.userId || 'test-institution-admin-user-id',
      user: overrides?.user as any,
      centerName: overrides?.centerName || '테스트 상담센터',
      representativeName: '대표자명',
      address: '서울시 강남구 테스트로 123',
      establishedDate: new Date('2020-01-01'),
      operatingVouchers: [],
      isQualityCertified: false,
      maxCapacity: 50,
      introduction: '테스트 상담센터입니다',
      counselorCount: 5,
      counselorCertifications: ['임상심리사', '상담심리사'],
      primaryTargetGroup: '아동/청소년',
      secondaryTargetGroup: '성인',
      canProvideComprehensiveTest: true,
      providedServices: [],
      specialTreatments: [],
      canProvideParentCounseling: true,
      averageRating: 4.5,
      reviewCount: 10,
      counselorProfiles: [],
      reviews: [],
      createdAt: overrides?.createdAt || now,
      updatedAt: overrides?.updatedAt || now,
    };
  }

  /**
   * 평점별 리뷰 데이터 생성
   */
  static createReviewsByRating(
    rating: 1 | 2 | 3 | 4 | 5,
    count: number = 1,
  ): Array<Omit<ReviewEntity, 'id' | 'createdAt' | 'updatedAt' | 'institution'>> {
    return Array.from({ length: count }, (_, index) => ({
      ...this.createReviewData({ rating }),
      authorNickname: `평점${rating}점_사용자${index + 1}`,
    }));
  }

  /**
   * 도움이 됨 카운트가 높은 리뷰 생성
   */
  static createPopularReview(
    helpfulCount: number = 100,
  ): Omit<ReviewEntity, 'id' | 'createdAt' | 'updatedAt' | 'institution'> {
    return this.createReviewData({
      helpfulCount,
      content: '많은 분들께 도움이 된 리뷰입니다.',
    });
  }
}
