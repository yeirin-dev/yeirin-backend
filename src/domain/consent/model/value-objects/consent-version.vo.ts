import { DomainError, Result } from '@domain/common/result';

/**
 * 동의서 버전 Value Object
 *
 * Semantic Versioning (Major.Minor.Patch) 형식
 * 예: "1.0.0", "1.1.0", "2.0.0"
 */
export class ConsentVersion {
  private static readonly VERSION_REGEX = /^\d+\.\d+\.\d+$/;
  public static readonly CURRENT_VERSION = '1.0.0';

  private constructor(private readonly _value: string) {}

  /**
   * 동의서 버전 생성
   */
  public static create(version: string): Result<ConsentVersion, DomainError> {
    if (!version || !ConsentVersion.VERSION_REGEX.test(version)) {
      return Result.fail(
        new DomainError(
          '동의서 버전은 x.y.z 형식이어야 합니다. (예: 1.0.0)',
          'INVALID_CONSENT_VERSION',
        ),
      );
    }

    return Result.ok(new ConsentVersion(version));
  }

  /**
   * 현재 버전으로 생성
   */
  public static createCurrent(): ConsentVersion {
    return new ConsentVersion(ConsentVersion.CURRENT_VERSION);
  }

  /**
   * DB 복원용 (검증 생략)
   */
  public static restore(version: string): ConsentVersion {
    return new ConsentVersion(version);
  }

  get value(): string {
    return this._value;
  }

  /**
   * 버전 비교 (현재 버전과 동일한지)
   */
  public isCurrent(): boolean {
    return this._value === ConsentVersion.CURRENT_VERSION;
  }

  /**
   * 동등성 비교
   */
  public equals(other: ConsentVersion): boolean {
    return this._value === other._value;
  }
}
