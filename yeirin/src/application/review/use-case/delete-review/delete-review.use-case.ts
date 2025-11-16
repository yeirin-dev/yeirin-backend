import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReviewRepository } from '@domain/review/repository/review.repository.interface';

/**
 * 리뷰 삭제 Use Case
 *
 * 비즈니스 규칙:
 * 1. 작성자 본인만 삭제 가능
 */
@Injectable()
export class DeleteReviewUseCase {
  constructor(
    @Inject('ReviewRepository')
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async execute(reviewId: string, userId: string): Promise<void> {
    // 1. 리뷰 조회
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('리뷰를 찾을 수 없습니다');
    }

    // 2. 권한 검증
    if (!review.canDelete(userId)) {
      throw new ForbiddenException('본인이 작성한 리뷰만 삭제할 수 있습니다');
    }

    // 3. 삭제
    await this.reviewRepository.delete(reviewId);
  }
}
