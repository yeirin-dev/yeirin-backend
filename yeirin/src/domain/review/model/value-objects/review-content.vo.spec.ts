import { ReviewContent } from './review-content.vo';

describe('ReviewContent Value Object', () => {
  describe('생성', () => {
    it('유효한 리뷰 내용(10-1000자)이면 ReviewContent를 생성한다', () => {
      // Given
      const validContent = '정말 좋은 상담 기관입니다. 상담사 선생님이 친절하시고 아이도 좋아합니다.';

      // When
      const result = ReviewContent.create(validContent);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe(validContent);
    });

    it('리뷰 내용이 10자 미만이면 실패한다', () => {
      // Given
      const shortContent = '좋아요';

      // When
      const result = ReviewContent.create(shortContent);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('리뷰 내용은 최소 10자 이상이어야 합니다');
    });

    it('리뷰 내용이 1000자를 초과하면 실패한다', () => {
      // Given
      const longContent = 'a'.repeat(1001);

      // When
      const result = ReviewContent.create(longContent);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('리뷰 내용은 최대 1000자까지 가능합니다');
    });

    it('리뷰 내용이 빈 문자열이면 실패한다', () => {
      // Given
      const emptyContent = '';

      // When
      const result = ReviewContent.create(emptyContent);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('리뷰 내용은 필수입니다');
    });

    it('리뷰 내용이 공백만 있으면 실패한다', () => {
      // Given
      const whitespaceContent = '          ';

      // When
      const result = ReviewContent.create(whitespaceContent);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('리뷰 내용은 필수입니다');
    });

    it('앞뒤 공백은 제거된다', () => {
      // Given
      const contentWithSpaces = '  좋은 상담 기관입니다  ';

      // When
      const result = ReviewContent.create(contentWithSpaces);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('좋은 상담 기관입니다');
    });
  });

  describe('동등성', () => {
    it('같은 내용을 가진 ReviewContent는 동일하다', () => {
      // Given
      const content1 = ReviewContent.create('좋은 상담 기관입니다').value;
      const content2 = ReviewContent.create('좋은 상담 기관입니다').value;

      // When & Then
      expect(content1.equals(content2)).toBe(true);
    });

    it('다른 내용을 가진 ReviewContent는 다르다', () => {
      // Given
      const content1 = ReviewContent.create('좋은 상담 기관입니다').value;
      const content2 = ReviewContent.create('별로입니다. 추천하지 않습니다').value;

      // When & Then
      expect(content1.equals(content2)).toBe(false);
    });
  });
});
