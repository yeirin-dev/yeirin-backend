import { Result } from '@domain/shared/result';
import { ValueObject } from '@domain/shared/value-object';

interface ReviewContentProps {
  value: string;
}

/**
 * 리뷰 내용 Value Object
 * - 10-1000자 범위
 * - 앞뒤 공백 제거
 */
export class ReviewContent extends ValueObject<ReviewContentProps> {
  public static readonly MIN_LENGTH = 10;
  public static readonly MAX_LENGTH = 1000;

  private constructor(props: ReviewContentProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  public static create(content: string): Result<ReviewContent> {
    // null/undefined 검증
    if (!content) {
      return Result.fail('리뷰 내용은 필수입니다');
    }

    // 공백 제거
    const trimmed = content.trim();

    // 빈 문자열 검증
    if (trimmed.length === 0) {
      return Result.fail('리뷰 내용은 필수입니다');
    }

    // 최소 길이 검증
    if (trimmed.length < this.MIN_LENGTH) {
      return Result.fail('리뷰 내용은 최소 10자 이상이어야 합니다');
    }

    // 최대 길이 검증
    if (trimmed.length > this.MAX_LENGTH) {
      return Result.fail('리뷰 내용은 최대 1000자까지 가능합니다');
    }

    return Result.ok(new ReviewContent({ value: trimmed }));
  }
}
