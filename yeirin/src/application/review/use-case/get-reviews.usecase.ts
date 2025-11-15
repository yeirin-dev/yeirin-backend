import { Inject, Injectable } from '@nestjs/common';
import { ReviewRepository } from '@domain/review/repository/review.repository';
import { ReviewListResponseDto, ReviewResponseDto } from '../dto/review-response.dto';

/**
 * 리뷰 목록 조회 유스케이스
 */
@Injectable()
export class GetReviewsUseCase {
  constructor(
    @Inject('ReviewRepository')
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async execute(page: number = 1, limit: number = 10): Promise<ReviewListResponseDto> {
    const [reviews, total] = await this.reviewRepository.findAll(page, limit);

    const reviewDtos: ReviewResponseDto[] = reviews.map((review) => ({
      id: review.id,
      institutionId: review.institutionId,
      institutionName: review.institution?.centerName || '',
      userId: review.userId,
      authorNickname: review.authorNickname,
      rating: review.rating,
      content: review.content,
      helpfulCount: review.helpfulCount,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    }));

    return {
      reviews: reviewDtos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
