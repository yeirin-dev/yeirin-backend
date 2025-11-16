import { Result } from '@domain/shared/result';
import { ValueObject } from '@domain/shared/value-object';

interface RatingProps {
  value: number;
}

/**
 * 리뷰 별점 Value Object
 * - 1-5점 범위의 정수
 */
export class Rating extends ValueObject<RatingProps> {
  private constructor(props: RatingProps) {
    super(props);
  }

  get value(): number {
    return this.props.value;
  }

  public static create(value: number): Result<Rating> {
    // 정수 검증
    if (!Number.isInteger(value)) {
      return Result.fail('별점은 정수여야 합니다');
    }

    // 범위 검증
    if (value < 1 || value > 5) {
      return Result.fail('별점은 1-5 사이여야 합니다');
    }

    return Result.ok(new Rating({ value }));
  }
}
