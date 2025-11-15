import { Result } from '@domain/shared/result';

/**
 * 상담기관 ID Value Object
 */
export class InstitutionId {
  private constructor(private readonly _value: string) {
    Object.freeze(this);
  }

  get value(): string {
    return this._value;
  }

  static create(id: string): Result<InstitutionId> {
    if (!id || id.trim().length === 0) {
      return Result.fail('상담기관 ID는 비어있을 수 없습니다');
    }

    return Result.ok(new InstitutionId(id.trim()));
  }

  equals(other: InstitutionId): boolean {
    if (!other) {
      return false;
    }
    return this._value === other._value;
  }
}
