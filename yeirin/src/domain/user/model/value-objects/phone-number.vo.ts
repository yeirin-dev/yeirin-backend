import { Result, DomainError } from '@domain/common/result';

/**
 * PhoneNumber Value Object
 * - 한국 휴대폰 번호 (010-xxxx-xxxx)
 * - 자동 정규화 (하이픈 형식)
 * - 개인정보 보호 (마스킹)
 */
export class PhoneNumber {
  private static readonly PHONE_REGEX = /^010\d{8}$/; // 숫자만 (정규화 후)

  private constructor(private readonly _value: string) {
    Object.freeze(this);
  }

  /**
   * 정적 팩토리 메서드
   */
  static create(phoneNumber: string): Result<PhoneNumber, DomainError> {
    // 1. Null/Empty 검증
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      return Result.fail(new DomainError('전화번호는 필수입니다'));
    }

    // 2. 숫자만 추출 (정규화)
    const digitsOnly = phoneNumber.replace(/\D/g, '');

    // 3. 형식 검증
    if (!this.PHONE_REGEX.test(digitsOnly)) {
      return Result.fail(new DomainError('올바른 전화번호 형식이 아닙니다 (010-xxxx-xxxx)'));
    }

    // 4. 하이픈 형식으로 변환
    const formatted = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7)}`;

    return Result.ok(new PhoneNumber(formatted));
  }

  /**
   * 값 접근자
   */
  get value(): string {
    return this._value;
  }

  /**
   * 숫자만 반환
   */
  get digitsOnly(): string {
    return this._value.replace(/\D/g, '');
  }

  /**
   * 마스킹 (개인정보 보호)
   */
  mask(): string {
    const parts = this._value.split('-');
    return `${parts[0]}-****-${parts[2]}`;
  }

  /**
   * 동등성 비교
   */
  equals(other: PhoneNumber): boolean {
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
