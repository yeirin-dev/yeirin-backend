/**
 * Result 패턴 구현
 * 성공/실패를 명시적으로 표현하여 에러 핸들링을 타입 안전하게 처리
 */
export class Result<T> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _error?: string,
    private readonly _value?: T,
  ) {
    Object.freeze(this);
  }

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  get isFailure(): boolean {
    return !this._isSuccess;
  }

  get error(): string {
    if (this._isSuccess) {
      throw new Error('성공한 Result에서는 error를 가져올 수 없습니다');
    }
    return this._error!;
  }

  get value(): T {
    if (!this._isSuccess) {
      throw new Error('실패한 Result에서는 value를 가져올 수 없습니다');
    }
    return this._value!;
  }

  static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error);
  }

  static combine(results: Result<unknown>[]): Result<unknown> {
    for (const result of results) {
      if (result.isFailure) {
        return result;
      }
    }
    return Result.ok();
  }
}
