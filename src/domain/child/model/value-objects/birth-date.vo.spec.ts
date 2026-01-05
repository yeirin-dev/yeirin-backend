import { BirthDate } from './birth-date.vo';

describe('BirthDate Value Object', () => {
  describe('생성', () => {
    it('올바른 날짜로 BirthDate를 생성한다', () => {
      // Given
      const validDate = new Date('2015-05-10');

      // When
      const result = BirthDate.create(validDate);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toEqual(validDate);
    });

    it('오늘 날짜도 허용한다 (오늘 태어난 아기)', () => {
      // Given
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // When
      const result = BirthDate.create(today);

      // Then
      expect(result.isSuccess).toBe(true);
    });
  });

  describe('검증 실패', () => {
    it('null이면 실패한다', () => {
      // When
      const result = BirthDate.create(null as any);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('필수');
    });

    it('undefined면 실패한다', () => {
      // When
      const result = BirthDate.create(undefined as any);

      // Then
      expect(result.isFailure).toBe(true);
    });

    it('미래 날짜면 실패한다', () => {
      // Given
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      // When
      const result = BirthDate.create(futureDate);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('미래');
    });

    it('150년 이전 날짜면 실패한다', () => {
      // Given
      const tooOld = new Date();
      tooOld.setFullYear(tooOld.getFullYear() - 151);

      // When
      const result = BirthDate.create(tooOld);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('150년');
    });

    it('Invalid Date면 실패한다', () => {
      // Given
      const invalidDate = new Date('invalid');

      // When
      const result = BirthDate.create(invalidDate);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('유효하지 않은');
    });
  });

  describe('나이 계산', () => {
    it('정확한 나이를 계산한다', () => {
      // Given: 10년 전 오늘
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      const birthDate = BirthDate.create(tenYearsAgo).getValue();

      // When
      const age = birthDate.getAge();

      // Then
      expect(age).toBe(10);
    });

    it('생일이 지나지 않았으면 -1살', () => {
      // Given: 10년 전 내일 (생일이 아직 안 지남)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setFullYear(tomorrow.getFullYear() - 10);
      const birthDate = BirthDate.create(tomorrow).getValue();

      // When
      const age = birthDate.getAge();

      // Then
      expect(age).toBe(9); // 생일 전이므로 9살
    });

    it('0살 (올해 태어남)도 정확하게 계산한다', () => {
      // Given
      const today = new Date();
      const birthDate = BirthDate.create(today).getValue();

      // When
      const age = birthDate.getAge();

      // Then
      expect(age).toBe(0);
    });
  });

  describe('동등성', () => {
    it('같은 날짜면 동등하다', () => {
      // Given
      const date1 = BirthDate.create(new Date('2015-05-10')).getValue();
      const date2 = BirthDate.create(new Date('2015-05-10')).getValue();

      // When & Then
      expect(date1.equals(date2)).toBe(true);
    });

    it('다른 날짜면 동등하지 않다', () => {
      // Given
      const date1 = BirthDate.create(new Date('2015-05-10')).getValue();
      const date2 = BirthDate.create(new Date('2016-05-10')).getValue();

      // When & Then
      expect(date1.equals(date2)).toBe(false);
    });
  });
});
