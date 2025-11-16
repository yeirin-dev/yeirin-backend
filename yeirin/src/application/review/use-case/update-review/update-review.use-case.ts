import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReviewRepository } from '@domain/review/repository/review.repository.interface';
import { Rating } from '@domain/review/model/value-objects/rating.vo';
import { ReviewContent } from '@domain/review/model/value-objects/review-content.vo';
import { UpdateReviewDto } from '../../dto/update-review.dto';
import { ReviewResponseDto } from '../../dto/review-response.dto';

/**
 * 리뷰 수정 Use Case
 *
 * 비즈니스 규칙:
 * 1. 작성자 본인만 수정 가능
 * 2. 별점과 내용 모두 변경 가능
 */
@Injectable()
export class UpdateReviewUseCase {
  constructor(
    @Inject('ReviewRepository')
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async execute(
    reviewId: string,
    userId: string,
    dto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    // 1. 리뷰 조회
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('리뷰를 찾을 수 없습니다');
    }

    // 2. 권한 검증
    if (!review.canModify(userId)) {
      throw new ForbiddenException('본인이 작성한 리뷰만 수정할 수 있습니다');
    }

    // 3. Value Objects 생성 및 검증
    if (dto.rating !== undefined) {
      const ratingResult = Rating.create(dto.rating);
      if (ratingResult.isFailure) {
        throw new BadRequestException(ratingResult.error);
      }
      review.updateRating(ratingResult.value);
    }

    if (dto.content !== undefined) {
      const contentResult = ReviewContent.create(dto.content);
      if (contentResult.isFailure) {
        throw new BadRequestException(contentResult.error);
      }
      review.updateContent(contentResult.value);
    }

    // 4. 저장
    const updated = await this.reviewRepository.save(review);

    // 5. Response DTO 변환
    return {
      id: updated.id,
      institutionId: updated.institutionId,
      institutionName: '',
      userId: updated.userId,
      rating: updated.rating.value,
      content: updated.content.value,
      helpfulCount: updated.helpfulCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
