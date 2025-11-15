import { Password } from './password.vo';

describe('Password Value Object', () => {
  describe('생성', () => {
    it('올바른 비밀번호 형식이면 Password를 생성한다', () => {
      // Given
      const validPassword = 'Test1234!@#';

      // When
      const result = Password.create(validPassword);

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(validPassword);
    });

    it('8자 미만이면 실패한다', () => {
      // Given
      const shortPassword = 'Test1!';

      // When
      const result = Password.create(shortPassword);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('8자 이상');
    });

    it('100자를 초과하면 실패한다', () => {
      // Given
      const longPassword = 'A1!'.repeat(50); // 150자

      // When
      const result = Password.create(longPassword);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('100자');
    });

    it('영문이 없으면 실패한다', () => {
      // Given
      const noAlphaPassword = '12345678!@#';

      // When
      const result = Password.create(noAlphaPassword);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('영문');
    });

    it('숫자가 없으면 실패한다', () => {
      // Given
      const noDigitPassword = 'Password!@#';

      // When
      const result = Password.create(noDigitPassword);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('숫자');
    });

    it('특수문자가 없으면 실패한다', () => {
      // Given
      const noSpecialPassword = 'Password1234';

      // When
      const result = Password.create(noSpecialPassword);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('특수문자');
    });

    it('빈 문자열이면 실패한다', () => {
      // Given
      const emptyPassword = '';

      // When
      const result = Password.create(emptyPassword);

      // Then
      expect(result.isFailure).toBe(true);
    });
  });

  describe('해시화', () => {
    it('비밀번호를 bcrypt로 해시화한다', async () => {
      // Given
      const plainPassword = 'Test1234!@#';
      const password = Password.create(plainPassword).getValue();

      // When
      const hashed = await password.hash();

      // Then
      expect(hashed.value).not.toBe(plainPassword);
      expect(hashed.value).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt format
    });

    it('같은 비밀번호라도 해시 결과는 다르다 (salt)', async () => {
      // Given
      const plainPassword = 'Test1234!@#';
      const password = Password.create(plainPassword).getValue();

      // When
      const hashed1 = await password.hash();
      const hashed2 = await password.hash();

      // Then
      expect(hashed1.value).not.toBe(hashed2.value);
    });
  });

  describe('비교', () => {
    it('평문 비밀번호와 해시를 비교할 수 있다', async () => {
      // Given
      const plainPassword = 'Test1234!@#';
      const password = Password.create(plainPassword).getValue();
      const hashed = await password.hash();

      // When
      const isMatch = await hashed.compare(plainPassword);

      // Then
      expect(isMatch).toBe(true);
    });

    it('다른 비밀번호와 비교하면 false를 반환한다', async () => {
      // Given
      const password = Password.create('Test1234!@#').getValue();
      const hashed = await password.hash();

      // When
      const isMatch = await hashed.compare('WrongPassword1!');

      // Then
      expect(isMatch).toBe(false);
    });
  });

  describe('강도 검증', () => {
    it('약한 비밀번호를 감지한다', () => {
      // Given
      const weakPasswords = [
        'Password123!', // 흔한 단어
        '12345678aA!', // 연속된 숫자
        'Qwerty123!', // 키보드 패턴
      ];

      weakPasswords.forEach((weak) => {
        // When
        const result = Password.create(weak, { checkStrength: true });

        // Then
        expect(result.isFailure).toBe(true);
        expect(result.getError().message).toContain('약한 비밀번호');
      });
    });
  });
});
