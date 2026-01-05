import { ChildName } from './child-name.vo';

describe('ChildName Value Object', () => {
  describe('생성', () => {
    it('올바른 아동 이름으로 ChildName을 생성한다', () => {
      // Given
      const validName = '김철수';

      // When
      const result = ChildName.create(validName);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(validName);
    });

    it('2-30자 범위의 이름을 허용한다', () => {
      // Given
      const shortName = '김수'; // 2자
      const longName = '김' + '가'.repeat(29); // 30자

      // When
      const shortResult = ChildName.create(shortName);
      const longResult = ChildName.create(longName);

      // Then
      expect(shortResult.isSuccess).toBe(true);
      expect(longResult.isSuccess).toBe(true);
    });

    it('앞뒤 공백을 자동으로 제거한다', () => {
      // Given
      const nameWithSpaces = '  김철수  ';

      // When
      const result = ChildName.create(nameWithSpaces);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe('김철수');
    });
  });

  describe('검증 실패', () => {
    it('빈 문자열이면 실패한다', () => {
      // When
      const result = ChildName.create('');

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('이름');
    });

    it('공백만 있으면 실패한다', () => {
      // When
      const result = ChildName.create('   ');

      // Then
      expect(result.isFailure).toBe(true);
    });

    it('2자 미만이면 실패한다', () => {
      // When
      const result = ChildName.create('김');

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('2자 이상');
    });

    it('30자 초과면 실패한다', () => {
      // Given
      const tooLongName = '김' + '가'.repeat(30); // 31자

      // When
      const result = ChildName.create(tooLongName);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('30자 이하');
    });
  });

  describe('동등성', () => {
    it('같은 이름이면 동등하다', () => {
      // Given
      const name1 = ChildName.create('김철수').getValue();
      const name2 = ChildName.create('김철수').getValue();

      // When & Then
      expect(name1.equals(name2)).toBe(true);
    });

    it('다른 이름이면 동등하지 않다', () => {
      // Given
      const name1 = ChildName.create('김철수').getValue();
      const name2 = ChildName.create('이영희').getValue();

      // When & Then
      expect(name1.equals(name2)).toBe(false);
    });
  });
});
