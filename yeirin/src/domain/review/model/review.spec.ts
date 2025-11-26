import { Review } from './review';
import { Rating } from './value-objects/rating.vo';
import { ReviewContent } from './value-objects/review-content.vo';

describe('Review Aggregate Root', () => {
  describe('생성', () => {
    it('유효한 데이터로 리뷰를 생성한다', () => {
      // Given
      const props = {
        institutionId: 'inst-123',
        userId: 'user-456',
        rating: Rating.create(5).value,
        content: ReviewContent.create(
          '정말 좋은 상담 기관입니다. 상담사 선생님들이 매우 친절하십니다.',
        ).value,
      };

      // When
      const result = Review.create(props);

      // Then
      expect(result.isSuccess).toBe(true);
      const review = result.value;
      expect(review.institutionId).toBe('inst-123');
      expect(review.userId).toBe('user-456');
      expect(review.rating.value).toBe(5);
      expect(review.helpfulCount).toBe(0);
    });

    it('기관 ID가 없으면 실패한다', () => {
      // Given
      const props = {
        institutionId: '',
        userId: 'user-456',
        rating: Rating.create(5).value,
        content: ReviewContent.create('좋은 상담 기관입니다').value,
      };

      // When
      const result = Review.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('기관 ID는 필수입니다');
    });

    it('사용자 ID가 없으면 실패한다', () => {
      // Given
      const props = {
        institutionId: 'inst-123',
        userId: '',
        rating: Rating.create(5).value,
        content: ReviewContent.create('좋은 상담 기관입니다').value,
      };

      // When
      const result = Review.create(props);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('사용자 ID는 필수입니다');
    });
  });

  describe('복원', () => {
    it('DB에서 가져온 데이터로 리뷰를 복원한다', () => {
      // Given
      const props = {
        id: 'review-123',
        institutionId: 'inst-123',
        userId: 'user-456',
        rating: Rating.create(5).value,
        content: ReviewContent.create('좋은 상담 기관입니다').value,
        helpfulCount: 10,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      };

      // When
      const review = Review.restore(props);

      // Then
      expect(review.id).toBe('review-123');
      expect(review.helpfulCount).toBe(10);
      expect(review.createdAt).toEqual(new Date('2025-01-01'));
      expect(review.updatedAt).toEqual(new Date('2025-01-02'));
    });
  });

  describe('수정', () => {
    it('리뷰 내용을 수정한다', () => {
      // Given
      const review = Review.create({
        institutionId: 'inst-123',
        userId: 'user-456',
        rating: Rating.create(5).value,
        content: ReviewContent.create('좋은 상담 기관입니다').value,
      }).value;

      const newContent = ReviewContent.create(
        '매우 만족스러운 상담이었습니다. 강력 추천합니다!',
      ).value;

      // When
      const result = review.updateContent(newContent);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(review.content.value).toBe('매우 만족스러운 상담이었습니다. 강력 추천합니다!');
    });

    it('별점을 수정한다', () => {
      // Given
      const review = Review.create({
        institutionId: 'inst-123',
        userId: 'user-456',
        rating: Rating.create(3).value,
        content: ReviewContent.create('좋은 상담 기관입니다').value,
      }).value;

      const newRating = Rating.create(5).value;

      // When
      const result = review.updateRating(newRating);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(review.rating.value).toBe(5);
    });
  });

  describe('도움이 됨', () => {
    it('도움이 됨 카운트를 증가시킨다', () => {
      // Given
      const review = Review.create({
        institutionId: 'inst-123',
        userId: 'user-456',
        rating: Rating.create(5).value,
        content: ReviewContent.create('좋은 상담 기관입니다').value,
      }).value;

      // When
      review.incrementHelpful();

      // Then
      expect(review.helpfulCount).toBe(1);
    });

    it('여러 번 증가시킬 수 있다', () => {
      // Given
      const review = Review.create({
        institutionId: 'inst-123',
        userId: 'user-456',
        rating: Rating.create(5).value,
        content: ReviewContent.create('좋은 상담 기관입니다').value,
      }).value;

      // When
      review.incrementHelpful();
      review.incrementHelpful();
      review.incrementHelpful();

      // Then
      expect(review.helpfulCount).toBe(3);
    });
  });

  describe('권한 검증', () => {
    it('작성자 본인이면 수정 권한이 있다', () => {
      // Given
      const review = Review.create({
        institutionId: 'inst-123',
        userId: 'user-456',
        rating: Rating.create(5).value,
        content: ReviewContent.create('좋은 상담 기관입니다').value,
      }).value;

      // When & Then
      expect(review.canModify('user-456')).toBe(true);
    });

    it('작성자가 아니면 수정 권한이 없다', () => {
      // Given
      const review = Review.create({
        institutionId: 'inst-123',
        userId: 'user-456',
        rating: Rating.create(5).value,
        content: ReviewContent.create('좋은 상담 기관입니다').value,
      }).value;

      // When & Then
      expect(review.canModify('other-user')).toBe(false);
    });
  });
});
