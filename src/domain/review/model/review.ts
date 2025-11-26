import { AggregateRoot } from '@domain/shared/aggregate-root';
import { Result } from '@domain/shared/result';
import { Rating } from './value-objects/rating.vo';
import { ReviewContent } from './value-objects/review-content.vo';

interface ReviewProps {
  institutionId: string;
  userId: string;
  rating: Rating;
  content: ReviewContent;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateReviewProps {
  institutionId: string;
  userId: string;
  rating: Rating;
  content: ReviewContent;
}

/**
 * 리뷰 Aggregate Root
 *
 * 비즈니스 규칙:
 * 1. 리뷰는 바우처 기관을 이용한 사용자만 작성 가능 (Use Case에서 검증)
 * 2. 별점은 1-5점 범위 (Rating VO에서 검증)
 * 3. 리뷰 내용은 10-1000자 (ReviewContent VO에서 검증)
 * 4. 본인이 작성한 리뷰만 수정/삭제 가능
 */
export class Review extends AggregateRoot<ReviewProps> {
  private constructor(props: ReviewProps, id?: string) {
    super(props, id);
  }

  // Getters
  get institutionId(): string {
    return this.props.institutionId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get rating(): Rating {
    return this.props.rating;
  }

  get content(): ReviewContent {
    return this.props.content;
  }

  get helpfulCount(): number {
    return this.props.helpfulCount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * 새 리뷰 생성 (정적 팩토리 메서드)
   */
  public static create(props: CreateReviewProps): Result<Review> {
    // 기관 ID 검증
    if (!props.institutionId || props.institutionId.trim().length === 0) {
      return Result.fail('기관 ID는 필수입니다');
    }

    // 사용자 ID 검증
    if (!props.userId || props.userId.trim().length === 0) {
      return Result.fail('사용자 ID는 필수입니다');
    }

    const now = new Date();

    const review = new Review({
      institutionId: props.institutionId,
      userId: props.userId,
      rating: props.rating,
      content: props.content,
      helpfulCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(review);
  }

  /**
   * DB에서 복원 (ID 포함)
   */
  public static restore(props: ReviewProps & { id: string }): Review {
    return new Review(
      {
        institutionId: props.institutionId,
        userId: props.userId,
        rating: props.rating,
        content: props.content,
        helpfulCount: props.helpfulCount,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
      props.id,
    );
  }

  /**
   * 리뷰 내용 수정
   */
  public updateContent(newContent: ReviewContent): Result<void> {
    this.props.content = newContent;
    this.props.updatedAt = new Date();
    return Result.ok();
  }

  /**
   * 별점 수정
   */
  public updateRating(newRating: Rating): Result<void> {
    this.props.rating = newRating;
    this.props.updatedAt = new Date();
    return Result.ok();
  }

  /**
   * 도움이 됨 카운트 증가
   */
  public incrementHelpful(): void {
    this.props.helpfulCount += 1;
    this.props.updatedAt = new Date();
  }

  /**
   * 수정 권한 검증
   * @param userId 수정을 시도하는 사용자 ID
   */
  public canModify(userId: string): boolean {
    return this.props.userId === userId;
  }

  /**
   * 삭제 권한 검증
   * @param userId 삭제를 시도하는 사용자 ID
   */
  public canDelete(userId: string): boolean {
    return this.props.userId === userId;
  }
}
