import { DomainError, Result } from '@domain/common/result';

/**
 * Email Value Object
 * - 불변 (Immutable)
 * - 값으로 동등성 비교
 * - 생성 시 검증 (항상 유효한 상태 보장)
 */
export class Email {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly MAX_LENGTH = 100;

  private constructor(private readonly _value: string) {
    Object.freeze(this); // 불변성 강제
  }

  /**
   * 정적 팩토리 메서드 (생성자 대신 사용)
   */
  static create(
    email: string,
    options?: { allowedDomains?: string[] },
  ): Result<Email, DomainError> {
    // 1. Null/Empty 검증
    if (!email || email.trim().length === 0) {
      return Result.fail(new DomainError('이메일은 필수입니다'));
    }

    // 2. 소문자로 정규화
    const normalized = email.trim().toLowerCase();

    // 3. 길이 검증
    if (normalized.length > this.MAX_LENGTH) {
      return Result.fail(new DomainError(`이메일은 ${this.MAX_LENGTH}자를 초과할 수 없습니다`));
    }

    // 4. 형식 검증
    if (!this.EMAIL_REGEX.test(normalized)) {
      return Result.fail(new DomainError('올바른 이메일 형식이 아닙니다'));
    }

    // 5. 도메인 화이트리스트 검증 (선택적)
    if (options?.allowedDomains) {
      const domain = normalized.split('@')[1];
      if (!options.allowedDomains.includes(domain)) {
        return Result.fail(new DomainError(`허용되지 않은 도메인입니다: ${domain}`));
      }
    }

    return Result.ok(new Email(normalized));
  }

  /**
   * 값 접근자 (Getter)
   */
  get value(): string {
    return this._value;
  }

  /**
   * 도메인 추출
   */
  get domain(): string {
    return this._value.split('@')[1];
  }

  /**
   * 동등성 비교 (Value Object 특성)
   */
  equals(other: Email): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  /**
   * 문자열 변환
   */
  toString(): string {
    return this._value;
  }
}
