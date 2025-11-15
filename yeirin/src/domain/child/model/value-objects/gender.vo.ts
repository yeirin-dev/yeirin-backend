import { Result, DomainError } from '@domain/common/result';

/**
 * 성별 enum
 */
export enum GenderType {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

/**
 * 성별 Value Object
 */
export class Gender {
  private readonly _value: GenderType;

  private constructor(value: GenderType) {
    this._value = value;
  }

  get value(): GenderType {
    return this._value;
  }

  /**
   * 성별 생성
   */
  public static create(gender: GenderType): Result<Gender, DomainError> {
    if (!gender) {
      return Result.fail(new DomainError('성별은 필수입니다'));
    }

    if (!Object.values(GenderType).includes(gender)) {
      return Result.fail(new DomainError('유효하지 않은 성별입니다'));
    }

    return Result.ok(new Gender(gender));
  }

  /**
   * Value Object 동등성 비교
   */
  public equals(other: Gender): boolean {
    if (!other) {
      return false;
    }
    return this._value === other._value;
  }
}
