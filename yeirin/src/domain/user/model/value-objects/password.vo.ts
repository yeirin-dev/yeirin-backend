import { Result, DomainError } from '@domain/common/result';
import * as bcrypt from 'bcrypt';

/**
 * Password Value Object
 * - 평문/해시 모두 지원
 * - 생성 시 강도 검증
 * - bcrypt 해시화 지원
 */
export class Password {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 100;
  private static readonly BCRYPT_ROUNDS = 10;

  // 정규식: 영문, 숫자, 특수문자 각 1개 이상
  private static readonly REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/;

  // 약한 비밀번호 패턴
  private static readonly WEAK_PATTERNS = [
    /password/i,
    /123456/,
    /qwerty/i,
    /admin/i,
    /letmein/i,
    /(.)\1{2,}/, // 같은 문자 3번 이상 반복
  ];

  private constructor(
    private readonly _value: string,
    private readonly _isHashed: boolean = false,
  ) {
    Object.freeze(this);
  }

  /**
   * 평문 비밀번호로 생성 (유저 입력)
   */
  static create(
    password: string,
    options?: { checkStrength?: boolean },
  ): Result<Password, DomainError> {
    // 1. Null/Empty 검증
    if (!password || password.trim().length === 0) {
      return Result.fail(new DomainError('비밀번호는 필수입니다'));
    }

    const trimmed = password.trim();

    // 2. 길이 검증
    if (trimmed.length < this.MIN_LENGTH) {
      return Result.fail(
        new DomainError(`비밀번호는 ${this.MIN_LENGTH}자 이상이어야 합니다`),
      );
    }

    if (trimmed.length > this.MAX_LENGTH) {
      return Result.fail(
        new DomainError(`비밀번호는 ${this.MAX_LENGTH}자를 초과할 수 없습니다`),
      );
    }

    // 3. 복잡도 검증 (영문, 숫자, 특수문자)
    if (!this.REGEX.test(trimmed)) {
      return Result.fail(
        new DomainError('비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다'),
      );
    }

    // 4. 강도 검증 (선택적)
    if (options?.checkStrength && this.isWeak(trimmed)) {
      return Result.fail(new DomainError('약한 비밀번호입니다. 더 강력한 비밀번호를 사용하세요'));
    }

    return Result.ok(new Password(trimmed, false));
  }

  /**
   * 해시된 비밀번호로 복원 (DB에서 조회)
   */
  static fromHash(hash: string): Password {
    return new Password(hash, true);
  }

  /**
   * 약한 비밀번호 검증
   */
  private static isWeak(password: string): boolean {
    return this.WEAK_PATTERNS.some((pattern) => pattern.test(password));
  }

  /**
   * 비밀번호 해시화
   */
  async hash(): Promise<Password> {
    if (this._isHashed) {
      return this; // 이미 해시된 경우 그대로 반환
    }

    const hashed = await bcrypt.hash(this._value, Password.BCRYPT_ROUNDS);
    return new Password(hashed, true);
  }

  /**
   * 평문과 해시 비교
   */
  async compare(plainPassword: string): Promise<boolean> {
    if (!this._isHashed) {
      throw new Error('해시된 비밀번호만 비교할 수 있습니다');
    }

    return await bcrypt.compare(plainPassword, this._value);
  }

  /**
   * 값 접근자
   */
  get value(): string {
    return this._value;
  }

  /**
   * 해시 여부 확인
   */
  get isHashed(): boolean {
    return this._isHashed;
  }
}
