import { InstitutionName } from './institution-name.vo';

describe('InstitutionName Value Object', () => {
  describe('생성', () => {
    it('유효한 기관명이면 InstitutionName을 생성한다', () => {
      // Given
      const validName = '해피양육시설';

      // When
      const result = InstitutionName.create(validName);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(validName);
    });

    it('기관명 앞뒤 공백을 제거한다', () => {
      // Given
      const nameWithSpaces = '  해피양육시설  ';

      // When
      const result = InstitutionName.create(nameWithSpaces);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe('해피양육시설');
    });

    it('빈 문자열이면 실패한다', () => {
      // Given
      const emptyName = '';

      // When
      const result = InstitutionName.create(emptyName);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('필수');
    });

    it('공백만 있으면 실패한다', () => {
      // Given
      const whitespaceOnly = '   ';

      // When
      const result = InstitutionName.create(whitespaceOnly);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('필수');
    });

    it('2자 미만이면 실패한다', () => {
      // Given
      const shortName = '가';

      // When
      const result = InstitutionName.create(shortName);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('최소 2자');
    });

    it('100자 초과면 실패한다', () => {
      // Given
      const longName = '가'.repeat(101);

      // When
      const result = InstitutionName.create(longName);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('최대 100자');
    });

    it('100자 이하면 성공한다', () => {
      // Given
      const maxLengthName = '가'.repeat(100);

      // When
      const result = InstitutionName.create(maxLengthName);

      // Then
      expect(result.isSuccess).toBe(true);
    });
  });

  describe('restore', () => {
    it('검증 없이 InstitutionName을 복원한다', () => {
      // Given
      const name = '해피양육시설';

      // When
      const institutionName = InstitutionName.restore(name);

      // Then
      expect(institutionName.value).toBe(name);
    });
  });

  describe('equals', () => {
    it('같은 값이면 true를 반환한다', () => {
      // Given
      const name1 = InstitutionName.create('해피양육시설').getValue();
      const name2 = InstitutionName.create('해피양육시설').getValue();

      // When & Then
      expect(name1.equals(name2)).toBe(true);
    });

    it('다른 값이면 false를 반환한다', () => {
      // Given
      const name1 = InstitutionName.create('해피양육시설').getValue();
      const name2 = InstitutionName.create('사랑양육시설').getValue();

      // When & Then
      expect(name1.equals(name2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('문자열 값을 반환한다', () => {
      // Given
      const name = InstitutionName.create('해피양육시설').getValue();

      // When & Then
      expect(name.toString()).toBe('해피양육시설');
    });
  });
});
