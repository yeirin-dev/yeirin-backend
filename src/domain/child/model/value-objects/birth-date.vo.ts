import { DomainError, Result } from '@domain/common/result';
import { calculateKoreanAge } from '@infrastructure/common/timezone';

/**
 * 생년월일 Value Object
 * - 불변성: 생성 후 변경 불가
 * - 나이 계산 로직 포함 (한국 시간대 기준)
 */
export class BirthDate {
  private readonly _value: Date;

  private constructor(value: Date) {
    this._value = value;
  }

  get value(): Date {
    return new Date(this._value); // 불변성 보장을 위해 새 인스턴스 반환
  }

  /**
   * 생년월일 생성 (정적 팩토리 메서드)
   * @param date 생년월일 (과거 날짜만 가능)
   */
  public static create(date: Date): Result<BirthDate, DomainError> {
    // 1. null/undefined 체크
    if (!date) {
      return Result.fail(new DomainError('생년월일은 필수입니다'));
    }

    // 2. Invalid Date 체크
    if (isNaN(date.getTime())) {
      return Result.fail(new DomainError('유효하지 않은 날짜입니다'));
    }

    // 3. 미래 날짜 체크
    const now = new Date();
    now.setHours(23, 59, 59, 999); // 오늘 끝까지 허용
    if (date.getTime() > now.getTime()) {
      return Result.fail(new DomainError('생년월일은 미래 날짜일 수 없습니다'));
    }

    // 4. 너무 오래된 날짜 체크 (150년 이전)
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 150);
    if (date.getTime() < minDate.getTime()) {
      return Result.fail(new DomainError('생년월일은 150년 이전일 수 없습니다'));
    }

    return Result.ok(new BirthDate(new Date(date)));
  }

  /**
   * 현재 나이 계산 (한국 시간대 기준)
   *
   * Uses Korean date (KST) as reference for accurate age calculation.
   * This is important for legal age verification (만 나이).
   *
   * If the server is in UTC, at 3 AM KST (= 6 PM UTC previous day),
   * new Date() in UTC would return the previous day, causing incorrect
   * age calculation around midnight KST.
   */
  public getAge(): number {
    return calculateKoreanAge(this._value);
  }

  /**
   * Value Object 동등성 비교
   */
  public equals(other: BirthDate): boolean {
    if (!other) {
      return false;
    }
    return this._value.getTime() === other._value.getTime();
  }
}
