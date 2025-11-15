import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ReviewRepository } from '@domain/review/repository/review.repository';
import { ReviewResponseDto } from '../dto/review-response.dto';

/**
 * 리뷰 단건 조회 유스케이스
 */
@Injectable()
export class GetReviewUseCase {
  constructor(
    @Inject('ReviewRepository')
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async execute(id: string): Promise<ReviewResponseDto> {
    const review = await this.reviewRepository.findById(id);

    if (!review) {
      throw new NotFoundException(`리뷰를 찾을 수 없습니다 (ID: ${id})`);
    }

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
