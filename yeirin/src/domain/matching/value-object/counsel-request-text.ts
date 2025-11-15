import { Result } from '@domain/shared/result';

/**
 * 상담의뢰지 텍스트 Value Object
 * 불변 객체로 상담의뢰지의 텍스트 내용을 표현
 */
export class CounselRequestText {
  private static readonly MIN_LENGTH = 10;
  private static readonly MAX_LENGTH = 5000;

  private constructor(private readonly _value: string) {
    Object.freeze(this);
  }

  get value(): string {
    return this._value;
  }

  static create(text: string): Result<CounselRequestText> {
    const trimmed = text?.trim() ?? '';

    if (trimmed.length === 0) {
      return Result.fail('상담의뢰지 텍스트는 비어있을 수 없습니다');
    }

    if (trimmed.length < this.MIN_LENGTH) {
      return Result.fail(`상담의뢰지 텍스트는 최소 ${this.MIN_LENGTH}자 이상이어야 합니다`);
    }

    if (trimmed.length > this.MAX_LENGTH) {
      return Result.fail(`상담의뢰지 텍스트는 최대 ${this.MAX_LENGTH}자를 초과할 수 없습니다`);
    }

    return Result.ok(new CounselRequestText(trimmed));
  }

  equals(other: CounselRequestText): boolean {
    if (!other) {
      return false;
    }
    return this._value === other._value;
  }
}
