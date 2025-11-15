import { Result, DomainError } from '@domain/common/result';

/**
 * RealName Value Object
 * - 실명 (한글/영문)
 * - 개인정보 보호 (마스킹)
 */
export class RealName {
  private static readonly MIN_LENGTH = 2;
  private static readonly MAX_LENGTH = 50;
  private static readonly NAME_REGEX = /^[가-힣a-zA-Z\s]+$/; // 한글, 영문, 공백만

  private constructor(private readonly _value: string) {
    Object.freeze(this);
  }

  /**
   * 정적 팩토리 메서드
   */
  static create(name: string): Result<RealName, DomainError> {
    // 1. Null/Empty 검증
    if (!name || name.trim().length === 0) {
      return Result.fail(new DomainError('이름은 필수입니다'));
    }

    const trimmed = name.trim();

    // 2. 길이 검증
    if (trimmed.length < this.MIN_LENGTH) {
      return Result.fail(
        new DomainError(`이름은 ${this.MIN_LENGTH}자 이상이어야 합니다`),
      );
    }

    if (trimmed.length > this.MAX_LENGTH) {
      return Result.fail(
        new DomainError(`이름은 ${this.MAX_LENGTH}자를 초과할 수 없습니다`),
      );
    }

    // 3. 형식 검증 (한글/영문만, 특수문자 불가)
    if (!this.NAME_REGEX.test(trimmed)) {
      return Result.fail(
        new DomainError('이름은 한글 또는 영문만 입력 가능합니다 (특수문자 불가)'),
      );
    }

    return Result.ok(new RealName(trimmed));
  }

  /**
   * 값 접근자
   */
  get value(): string {
    return this._value;
  }

  /**
   * 마스킹 (개인정보 보호)
   * 예: "홍길동" -> "홍*동", "김철수" -> "김*수"
   */
  mask(): string {
    if (this._value.length <= 2) {
      return this._value[0] + '*';
    }

    const first = this._value[0];
    const last = this._value[this._value.length - 1];
    const middle = '*'.repeat(this._value.length - 2);

    return first + middle + last;
  }

  /**
   * 동등성 비교
   */
  equals(other: RealName): boolean {
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
