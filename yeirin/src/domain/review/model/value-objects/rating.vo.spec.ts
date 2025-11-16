import { Result } from '@domain/shared/result';
import { Rating } from './rating.vo';

describe('Rating Value Object', () => {
  describe('생성', () => {
    it('유효한 별점(1-5)이면 Rating을 생성한다', () => {
      // Given
      const validRatings = [1, 2, 3, 4, 5];

      // When & Then
      validRatings.forEach((value) => {
        const result = Rating.create(value);
        expect(result.isSuccess).toBe(true);
        expect(result.value.value).toBe(value);
      });
    });

    it('별점이 1보다 작으면 실패한다', () => {
      // Given
      const invalidRating = 0;

      // When
      const result = Rating.create(invalidRating);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('별점은 1-5 사이여야 합니다');
    });

    it('별점이 5보다 크면 실패한다', () => {
      // Given
      const invalidRating = 6;

      // When
      const result = Rating.create(invalidRating);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('별점은 1-5 사이여야 합니다');
    });

    it('별점이 정수가 아니면 실패한다', () => {
      // Given
      const invalidRating = 3.5;

      // When
      const result = Rating.create(invalidRating);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('별점은 정수여야 합니다');
    });
  });

  describe('동등성', () => {
    it('같은 값을 가진 Rating은 동일하다', () => {
      // Given
      const rating1 = Rating.create(5).value;
      const rating2 = Rating.create(5).value;

      // When & Then
      expect(rating1.equals(rating2)).toBe(true);
    });

    it('다른 값을 가진 Rating은 다르다', () => {
      // Given
      const rating1 = Rating.create(5).value;
      const rating2 = Rating.create(4).value;

      // When & Then
      expect(rating1.equals(rating2)).toBe(false);
    });
  });
});
