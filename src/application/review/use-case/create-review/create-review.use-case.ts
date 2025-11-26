import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Review } from '@domain/review/model/review';
import { Rating } from '@domain/review/model/value-objects/rating.vo';
import { ReviewContent } from '@domain/review/model/value-objects/review-content.vo';
import { ReviewRepository } from '@domain/review/repository/review.repository.interface';
import { CreateReviewDto } from '../../dto/create-review.dto';
import { ReviewResponseDto } from '../../dto/review-response.dto';

/**
 * 리뷰 생성 Use Case
 *
 * 비즈니스 규칙:
 * 1. 한 사용자는 한 기관에 하나의 리뷰만 작성 가능
 * 2. 별점은 1-5점 범위
 * 3. 리뷰 내용은 10-1000자
 */
@Injectable()
export class CreateReviewUseCase {
  constructor(
    @Inject('ReviewRepository')
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async execute(dto: CreateReviewDto): Promise<ReviewResponseDto> {
    // 1. 중복 리뷰 검증
    const alreadyReviewed = await this.reviewRepository.existsByUserIdAndInstitutionId(
      dto.userId,
      dto.institutionId,
    );

    if (alreadyReviewed) {
      throw new BadRequestException('이미 해당 기관에 리뷰를 작성하셨습니다');
    }

    // 2. Value Objects 생성
    const ratingResult = Rating.create(dto.rating);
    if (ratingResult.isFailure) {
      throw new BadRequestException(ratingResult.error);
    }

    const contentResult = ReviewContent.create(dto.content);
    if (contentResult.isFailure) {
      throw new BadRequestException(contentResult.error);
    }

    // 3. Review Aggregate 생성
    const reviewResult = Review.create({
      institutionId: dto.institutionId,
      userId: dto.userId,
      rating: ratingResult.value,
      content: contentResult.value,
    });

    if (reviewResult.isFailure) {
      throw new BadRequestException(reviewResult.error);
    }

    // 4. 저장
    const review = await this.reviewRepository.save(reviewResult.value);

    // 5. Response DTO 변환
    return {
      id: review.id,
      institutionId: review.institutionId,
      institutionName: '', // Controller에서 채움
      userId: review.userId,
      rating: review.rating.value,
      content: review.content.value,
      helpfulCount: review.helpfulCount,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}
