import { DomainError, Result } from '@domain/common/result';

/**
 * 아동 이름 Value Object
 * - 불변성: 생성 후 변경 불가
 * - 자기 검증: 항상 유효한 상태 보장
 */
export class ChildName {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  /**
   * 아동 이름 생성 (정적 팩토리 메서드)
   * @param name 아동 이름 (2-30자)
   */
  public static create(name: string): Result<ChildName, DomainError> {
    // 1. null/undefined 체크
    if (!name) {
      return Result.fail(new DomainError('아동 이름은 필수입니다'));
    }

    // 2. 공백 제거
    const trimmedName = name.trim();

    // 3. 빈 문자열 체크
    if (trimmedName.length === 0) {
      return Result.fail(new DomainError('아동 이름은 공백일 수 없습니다'));
    }

    // 4. 길이 검증 (2-30자)
    if (trimmedName.length < 2) {
      return Result.fail(new DomainError('아동 이름은 2자 이상이어야 합니다'));
    }

    if (trimmedName.length > 30) {
      return Result.fail(new DomainError('아동 이름은 30자 이하여야 합니다'));
    }

    return Result.ok(new ChildName(trimmedName));
  }

  /**
   * Value Object 동등성 비교
   */
  public equals(other: ChildName): boolean {
    if (!other) {
      return false;
    }
    return this._value === other._value;
  }
}
