import { DomainError, Result } from '@domain/common/result';

/**
 * 기관명 Value Object
 * - 양육시설, 지역아동센터 등 기관의 이름
 * - 2자 이상, 100자 이하
 */
export class InstitutionName {
  private static readonly MIN_LENGTH = 2;
  private static readonly MAX_LENGTH = 100;

  private constructor(private readonly _value: string) {}

  /**
   * 기관명 생성 (정적 팩토리 메서드)
   */
  static create(name: string): Result<InstitutionName, DomainError> {
    const trimmed = name?.trim();

    if (!trimmed) {
      return Result.fail(new DomainError('기관명은 필수입니다'));
    }

    if (trimmed.length < InstitutionName.MIN_LENGTH) {
      return Result.fail(
        new DomainError(`기관명은 최소 ${InstitutionName.MIN_LENGTH}자 이상이어야 합니다`),
      );
    }

    if (trimmed.length > InstitutionName.MAX_LENGTH) {
      return Result.fail(
        new DomainError(`기관명은 최대 ${InstitutionName.MAX_LENGTH}자까지 가능합니다`),
      );
    }

    return Result.ok(new InstitutionName(trimmed));
  }

  /**
   * DB 복원용 (검증 없이 생성)
   */
  static restore(name: string): InstitutionName {
    return new InstitutionName(name);
  }

  get value(): string {
    return this._value;
  }

  equals(other: InstitutionName): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
