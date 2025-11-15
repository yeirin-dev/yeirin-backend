import { RealName } from './real-name.vo';

describe('RealName Value Object', () => {
  describe('생성', () => {
    it('올바른 이름 형식이면 RealName을 생성한다', () => {
      // Given
      const validNames = ['홍길동', '김영희', '이철수'];

      validNames.forEach((name) => {
        // When
        const result = RealName.create(name);

        // Then
        expect(result.isSuccess).toBe(true);
        expect(result.getValue().value).toBe(name);
      });
    });

    it('2자 미만이면 실패한다', () => {
      // Given
      const shortName = '김';

      // When
      const result = RealName.create(shortName);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('2자 이상');
    });

    it('50자를 초과하면 실패한다', () => {
      // Given
      const longName = '가'.repeat(51);

      // When
      const result = RealName.create(longName);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('50자');
    });

    it('빈 문자열이면 실패한다', () => {
      // Given
      const emptyName = '';

      // When
      const result = RealName.create(emptyName);

      // Then
      expect(result.isFailure).toBe(true);
    });

    it('특수문자가 포함되면 실패한다', () => {
      // Given
      const invalidNames = ['홍길동!', '김@영희', '이#철수'];

      invalidNames.forEach((name) => {
        // When
        const result = RealName.create(name);

        // Then
        expect(result.isFailure).toBe(true);
        expect(result.getError().message).toContain('특수문자');
      });
    });

    it('공백은 제거된다', () => {
      // Given
      const nameWithSpaces = '  홍길동  ';

      // When
      const result = RealName.create(nameWithSpaces);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe('홍길동');
    });
  });

  describe('동등성', () => {
    it('같은 이름이면 동등하다', () => {
      // Given
      const name1 = RealName.create('홍길동').getValue();
      const name2 = RealName.create('홍길동').getValue();

      // When & Then
      expect(name1.equals(name2)).toBe(true);
    });

    it('다른 이름이면 동등하지 않다', () => {
      // Given
      const name1 = RealName.create('홍길동').getValue();
      const name2 = RealName.create('김영희').getValue();

      // When & Then
      expect(name1.equals(name2)).toBe(false);
    });
  });

  describe('마스킹', () => {
    it('이름을 마스킹할 수 있다 (개인정보 보호)', () => {
      // Given
      const name = RealName.create('홍길동').getValue();

      // When
      const masked = name.mask();

      // Then
      expect(masked).toBe('홍*동');
    });

    it('2자 이름도 마스킹할 수 있다', () => {
      // Given
      const name = RealName.create('홍길').getValue();

      // When
      const masked = name.mask();

      // Then
      expect(masked).toBe('홍*');
    });
  });
});
