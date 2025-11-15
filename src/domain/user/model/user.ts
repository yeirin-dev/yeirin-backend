import { v4 as uuidv4 } from 'uuid';
import { AggregateRoot } from '@domain/common/domain-event';
import { DomainError, Result } from '@domain/common/result';
import { EmailVerified } from '../events/email-verified.event';
import { UserRegistered } from '../events/user-registered.event';
import { Email } from './value-objects/email.vo';
import { Password } from './value-objects/password.vo';
import { PhoneNumber } from './value-objects/phone-number.vo';
import { RealName } from './value-objects/real-name.vo';
import { UserRole } from './value-objects/user-role.vo';

/**
 * User 생성 Props
 */
export interface UserProps {
  email: Email;
  password: Password; // 해시된 비밀번호
  realName: RealName;
  phoneNumber: PhoneNumber;
  role: UserRole;
}

/**
 * User Aggregate Root
 * - DDD의 핵심 개념: 비즈니스 규칙을 캡슐화
 * - 항상 유효한 상태 보장 (Invariant)
 * - Value Objects 사용으로 타입 안전성 극대화
 */
export class User extends AggregateRoot {
  private readonly _id: string;
  private readonly _email: Email;
  private _password: Password;
  private readonly _realName: RealName;
  private readonly _phoneNumber: PhoneNumber;
  private readonly _role: UserRole;

  // 상태 필드
  private _isEmailVerified: boolean;
  private _isActive: boolean;
  private _lastLoginAt: Date | null;
  private _refreshToken: string | null;

  // 타임스탬프
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: UserProps, id?: string) {
    super();
    this._id = id ?? uuidv4();
    this._email = props.email;
    this._password = props.password;
    this._realName = props.realName;
    this._phoneNumber = props.phoneNumber;
    this._role = props.role;

    // 기본값
    this._isEmailVerified = false;
    this._isActive = true;
    this._lastLoginAt = null;
    this._refreshToken = null;

    this._createdAt = new Date();
    this._updatedAt = new Date();

    // TypeScript readonly로 불변성 보장 (내부에서만 변경 가능)
  }

  /**
   * 정적 팩토리 메서드: 새 User 생성 (회원가입)
   */
  static create(props: UserProps): Result<User, DomainError> {
    // 비밀번호가 해시되지 않았으면 에러
    if (!props.password.isHashed) {
      return Result.fail(new DomainError('비밀번호는 해시된 상태여야 합니다'));
    }

    const user = new User(props);

    // Domain Event 발행
    user.addDomainEvent(new UserRegistered(user._id, user._email.value, user._role.value));

    return Result.ok(user);
  }

  /**
   * 정적 팩토리 메서드: 기존 User 복원 (DB에서 조회)
   */
  static restore(
    props: UserProps & {
      id: string;
      isEmailVerified: boolean;
      isActive: boolean;
      lastLoginAt: Date | null;
      refreshToken: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
  ): User {
    const user = new User(
      {
        email: props.email,
        password: props.password,
        realName: props.realName,
        phoneNumber: props.phoneNumber,
        role: props.role,
      },
      props.id,
    );

    // 상태 복원
    (user as any)._isEmailVerified = props.isEmailVerified;
    (user as any)._isActive = props.isActive;
    (user as any)._lastLoginAt = props.lastLoginAt;
    (user as any)._refreshToken = props.refreshToken;
    (user as any)._createdAt = props.createdAt;
    (user as any)._updatedAt = props.updatedAt;

    return user;
  }

  /**
   * 이메일 인증
   */
  verifyEmail(): Result<void, DomainError> {
    if (this._isEmailVerified) {
      return Result.fail(new DomainError('이미 인증된 이메일입니다'));
    }

    (this as any)._isEmailVerified = true;
    (this as any)._updatedAt = new Date();

    // Domain Event 발행
    this.addDomainEvent(new EmailVerified(this._id, this._email.value));

    return Result.ok(undefined);
  }

  /**
   * 비밀번호 변경
   */
  changePassword(newPassword: Password): Result<void, DomainError> {
    if (newPassword.value === this._password.value) {
      return Result.fail(new DomainError('동일한 비밀번호로 변경할 수 없습니다'));
    }

    if (!newPassword.isHashed) {
      return Result.fail(new DomainError('새 비밀번호는 해시된 상태여야 합니다'));
    }

    (this as any)._password = newPassword;
    (this as any)._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * 계정 활성화
   */
  activate(): void {
    (this as any)._isActive = true;
    (this as any)._updatedAt = new Date();
  }

  /**
   * 계정 비활성화
   */
  deactivate(): void {
    (this as any)._isActive = false;
    (this as any)._updatedAt = new Date();
  }

  /**
   * 로그인 기록
   */
  recordLogin(): Result<void, DomainError> {
    if (!this._isActive) {
      return Result.fail(new DomainError('비활성화된 계정입니다'));
    }

    (this as any)._lastLoginAt = new Date();
    (this as any)._updatedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * Refresh Token 저장
   */
  updateRefreshToken(token: string | null): void {
    (this as any)._refreshToken = token;
    (this as any)._updatedAt = new Date();
  }

  /**
   * 권한 확인
   */
  hasPermission(permission: string): boolean {
    return this._role.hasPermission(permission);
  }

  // ========== Getters ==========

  get id(): string {
    return this._id;
  }

  get email(): Email {
    return this._email;
  }

  get password(): Password {
    return this._password;
  }

  get realName(): RealName {
    return this._realName;
  }

  get phoneNumber(): PhoneNumber {
    return this._phoneNumber;
  }

  get role(): UserRole {
    return this._role;
  }

  get isEmailVerified(): boolean {
    return this._isEmailVerified;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get lastLoginAt(): Date | null {
    return this._lastLoginAt;
  }

  get refreshToken(): string | null {
    return this._refreshToken;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
