import { Injectable, Inject } from '@nestjs/common';
import { ReviewRepository } from '@domain/review/repository/review.repository';
import { CreateReviewDto } from '../dto/create-review.dto';
import { ReviewResponseDto } from '../dto/review-response.dto';

/**
 * 리뷰 생성 유스케이스
 */
@Injectable()
export class CreateReviewUseCase {
  constructor(
    @Inject('ReviewRepository')
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async execute(dto: CreateReviewDto): Promise<ReviewResponseDto> {
    const review = await this.reviewRepository.create({
      institutionId: dto.institutionId,
      userId: (dto.userId || null) as any,
      authorNickname: dto.authorNickname,
      rating: dto.rating,
      content: dto.content,
      helpfulCount: 0,
    });

    return {
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
    };
  }
}
