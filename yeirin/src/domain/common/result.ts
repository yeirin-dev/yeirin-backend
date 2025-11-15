/**
 * Result 타입: Railway-Oriented Programming
 * 에러를 예외가 아닌 값으로 처리 (Functional Programming)
 */

export class Result<T, E = Error> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E,
  ) {}

  /**
   * 성공 Result 생성
   */
  static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined);
  }

  /**
   * 실패 Result 생성
   */
  static fail<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  /**
   * 성공 여부 확인
   */
  get isSuccess(): boolean {
    return this._isSuccess;
  }

  /**
   * 실패 여부 확인
   */
  get isFailure(): boolean {
    return !this._isSuccess;
  }

  /**
   * 값 가져오기 (성공 시)
   */
  getValue(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot get value from failed Result');
    }
    return this._value as T;
  }

  /**
   * 에러 가져오기 (실패 시)
   */
  getError(): E {
    if (this._isSuccess) {
      throw new Error('Cannot get error from successful Result');
    }
    return this._error as E;
  }

  /**
   * Map: 값 변환 (성공 시에만)
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isFailure) {
      return Result.fail(this._error as E);
    }
    return Result.ok(fn(this._value as T));
  }

  /**
   * FlatMap: Result를 반환하는 함수 적용
   */
  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isFailure) {
      return Result.fail(this._error as E);
    }
    return fn(this._value as T);
  }

  /**
   * Match: 패턴 매칭 (Railway Pattern)
   */
  match<U>(patterns: { ok: (value: T) => U; fail: (error: E) => U }): U {
    return this._isSuccess ? patterns.ok(this._value as T) : patterns.fail(this._error as E);
  }
}

/**
 * Domain Error 기본 클래스
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
