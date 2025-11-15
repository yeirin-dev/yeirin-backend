import { User, UserProps } from './user';
import { Email } from './value-objects/email.vo';
import { Password } from './value-objects/password.vo';
import { UserRole } from './value-objects/user-role.vo';
import { PhoneNumber } from './value-objects/phone-number.vo';
import { RealName } from './value-objects/real-name.vo';

describe('User Aggregate Root', () => {
  const createValidUserProps = async (): Promise<UserProps> => {
    return {
      email: Email.create('user@example.com').getValue(),
      password: await Password.create('Test1234!@#').getValue().hash(),
      realName: RealName.create('홍길동').getValue(),
      phoneNumber: PhoneNumber.create('010-1234-5678').getValue(),
      role: UserRole.create('GUARDIAN').getValue(),
    };
  };

  describe('생성', () => {
    it('유효한 정보로 User를 생성한다', async () => {
      // Given
      const props = await createValidUserProps();

      // When
      const result = User.create(props);

      // Then
      expect(result.isSuccess).toBe(true);
      const user = result.getValue();
      expect(user.id).toBeDefined();
      expect(user.email.value).toBe('user@example.com');
      expect(user.realName.value).toBe('홍길동');
    });

    it('생성 시 UserRegistered 이벤트가 발생한다', async () => {
      // Given
      const props = await createValidUserProps();

      // When
      const user = User.create(props).getValue();

      // Then
      const events = user.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('UserRegistered');
    });

    it('생성 시 기본값이 설정된다', async () => {
      // Given
      const props = await createValidUserProps();

      // When
      const user = User.create(props).getValue();

      // Then
      expect(user.isEmailVerified).toBe(false);
      expect(user.isActive).toBe(true);
      expect(user.lastLoginAt).toBeNull();
      expect(user.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('이메일 인증', () => {
    it('이메일을 인증할 수 있다', async () => {
      // Given
      const props = await createValidUserProps();
      const user = User.create(props).getValue();

      // When
      user.verifyEmail();

      // Then
      expect(user.isEmailVerified).toBe(true);
    });

    it('이미 인증된 이메일은 다시 인증할 수 없다', async () => {
      // Given
      const props = await createValidUserProps();
      const user = User.create(props).getValue();
      user.verifyEmail();

      // When
      const result = user.verifyEmail();

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('이미 인증');
    });

    it('이메일 인증 시 EmailVerified 이벤트가 발생한다', async () => {
      // Given
      const props = await createValidUserProps();
      const user = User.create(props).getValue();
      user.clearDomainEvents(); // 생성 이벤트 클리어

      // When
      user.verifyEmail();

      // Then
      const events = user.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('EmailVerified');
    });
  });

  describe('비밀번호 변경', () => {
    it('비밀번호를 변경할 수 있다', async () => {
      // Given
      const props = await createValidUserProps();
      const user = User.create(props).getValue();
      const oldPasswordHash = user.password.value;
      const newPassword = await Password.create('NewPass123!').getValue().hash();

      // When
      user.changePassword(newPassword);

      // Then
      expect(user.password.value).not.toBe(oldPasswordHash);
      expect(user.password.value).toBe(newPassword.value);
    });

    it('같은 비밀번호로 변경할 수 없다', async () => {
      // Given
      const props = await createValidUserProps();
      const user = User.create(props).getValue();
      const samePassword = props.password;

      // When
      const result = user.changePassword(samePassword);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('동일한 비밀번호');
    });
  });

  describe('계정 활성화/비활성화', () => {
    it('계정을 비활성화할 수 있다', async () => {
      // Given
      const props = await createValidUserProps();
      const user = User.create(props).getValue();

      // When
      user.deactivate();

      // Then
      expect(user.isActive).toBe(false);
    });

    it('계정을 재활성화할 수 있다', async () => {
      // Given
      const props = await createValidUserProps();
      const user = User.create(props).getValue();
      user.deactivate();

      // When
      user.activate();

      // Then
      expect(user.isActive).toBe(true);
    });

    it('비활성 계정은 로그인할 수 없다', async () => {
      // Given
      const props = await createValidUserProps();
      const user = User.create(props).getValue();
      user.deactivate();

      // When
      const result = user.recordLogin();

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('비활성화된 계정');
    });
  });

  describe('로그인 기록', () => {
    it('로그인을 기록할 수 있다', async () => {
      // Given
      const props = await createValidUserProps();
      const user = User.create(props).getValue();

      // When
      const result = user.recordLogin();

      // Then
      expect(result.isSuccess).toBe(true);
      expect(user.lastLoginAt).toBeInstanceOf(Date);
    });
  });

  describe('권한 검증', () => {
    it('사용자의 권한을 확인할 수 있다', async () => {
      // Given
      const props = await createValidUserProps();
      const user = User.create(props).getValue();

      // When & Then
      expect(user.hasPermission('view:own-children')).toBe(true);
      expect(user.hasPermission('manage:institution')).toBe(false);
    });

    it('ADMIN은 모든 권한을 가진다', async () => {
      // Given
      const props = await createValidUserProps();
      props.role = UserRole.create('ADMIN').getValue();
      const user = User.create(props).getValue();

      // When & Then
      expect(user.hasPermission('*')).toBe(true);
      expect(user.hasPermission('manage:users')).toBe(true);
    });
  });

  describe('불변성', () => {
    it('User 객체는 불변이다 (Value Objects만 변경 가능)', async () => {
      // Given
      const props = await createValidUserProps();
      const user = User.create(props).getValue();

      // When & Then
      expect(() => {
        (user as any).email = Email.create('hacker@evil.com').getValue();
      }).toThrow();
    });
  });
});
