import { PhoneNumber } from './phone-number.vo';

describe('PhoneNumber Value Object', () => {
  describe('생성', () => {
    it('올바른 한국 전화번호 형식이면 PhoneNumber를 생성한다', () => {
      // Given
      const validNumbers = ['010-1234-5678', '01012345678', '010 1234 5678'];

      validNumbers.forEach((number) => {
        // When
        const result = PhoneNumber.create(number);

        // Then
        expect(result.isSuccess).toBe(true);
      });
    });

    it('전화번호는 하이픈 형식으로 정규화된다', () => {
      // Given
      const rawNumber = '01012345678';

      // When
      const result = PhoneNumber.create(rawNumber);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe('010-1234-5678');
    });

    it('010으로 시작하지 않으면 실패한다', () => {
      // Given
      const invalidNumber = '011-1234-5678';

      // When
      const result = PhoneNumber.create(invalidNumber);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('010');
    });

    it('11자리가 아니면 실패한다', () => {
      // Given
      const invalidNumbers = ['010-123-5678', '010-12345-5678'];

      invalidNumbers.forEach((number) => {
        // When
        const result = PhoneNumber.create(number);

        // Then
        expect(result.isFailure).toBe(true);
      });
    });

    it('빈 문자열이면 실패한다', () => {
      // Given
      const emptyNumber = '';

      // When
      const result = PhoneNumber.create(emptyNumber);

      // Then
      expect(result.isFailure).toBe(true);
    });
  });

  describe('동등성', () => {
    it('같은 전화번호면 동등하다', () => {
      // Given
      const phone1 = PhoneNumber.create('010-1234-5678').getValue();
      const phone2 = PhoneNumber.create('01012345678').getValue(); // 정규화 후 같음

      // When & Then
      expect(phone1.equals(phone2)).toBe(true);
    });
  });

  describe('마스킹', () => {
    it('전화번호를 마스킹할 수 있다 (개인정보 보호)', () => {
      // Given
      const phone = PhoneNumber.create('010-1234-5678').getValue();

      // When
      const masked = phone.mask();

      // Then
      expect(masked).toBe('010-****-5678');
    });
  });
});
