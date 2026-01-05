import { Email } from './email.vo';

describe('Email Value Object', () => {
  describe('생성', () => {
    it('올바른 이메일 형식이면 Email을 생성한다', () => {
      // Given
      const validEmail = 'user@example.com';

      // When
      const result = Email.create(validEmail);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(validEmail);
    });

    it('이메일 형식이 아니면 실패한다', () => {
      // Given
      const invalidEmails = ['not-an-email', '@example.com', 'user@', 'user example.com'];

      invalidEmails.forEach((invalidEmail) => {
        // When
        const result = Email.create(invalidEmail);

        // Then
        expect(result.isFailure).toBe(true);
        expect(result.getError().message).toContain('올바른 이메일 형식이 아닙니다');
      });
    });

    it('빈 문자열이면 실패한다', () => {
      // Given
      const emptyEmail = '';

      // When
      const result = Email.create(emptyEmail);

      // Then
      expect(result.isFailure).toBe(true);
    });

    it('100자를 초과하면 실패한다', () => {
      // Given
      const longEmail = 'a'.repeat(90) + '@example.com'; // 103자

      // When
      const result = Email.create(longEmail);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('100자');
    });

    it('이메일은 소문자로 정규화된다', () => {
      // Given
      const mixedCaseEmail = 'User@Example.COM';

      // When
      const result = Email.create(mixedCaseEmail);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe('user@example.com');
    });
  });

  describe('동등성', () => {
    it('같은 이메일이면 동등하다 (Value Object 특성)', () => {
      // Given
      const email1 = Email.create('user@example.com').getValue();
      const email2 = Email.create('user@example.com').getValue();

      // When & Then
      expect(email1.equals(email2)).toBe(true);
    });

    it('다른 이메일이면 동등하지 않다', () => {
      // Given
      const email1 = Email.create('user1@example.com').getValue();
      const email2 = Email.create('user2@example.com').getValue();

      // When & Then
      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('도메인 검증', () => {
    it('허용된 도메인만 가입 가능하다 (선택적 제약)', () => {
      // Given
      const allowedDomains = ['example.com', 'company.com'];

      // When
      const result1 = Email.create('user@example.com', { allowedDomains });
      const result2 = Email.create('user@spam.com', { allowedDomains });

      // Then
      expect(result1.isSuccess).toBe(true);
      expect(result2.isFailure).toBe(true);
    });
  });
});
