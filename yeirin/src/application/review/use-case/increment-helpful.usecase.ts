import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ReviewRepository } from '@domain/review/repository/review.repository';
import { ReviewResponseDto } from '../dto/review-response.dto';

/**
 * 리뷰 도움이 됨 증가 유스케이스
 */
@Injectable()
export class IncrementHelpfulUseCase {
  constructor(
    @Inject('ReviewRepository')
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async execute(id: string): Promise<ReviewResponseDto> {
    // 리뷰 존재 확인
    const existing = await this.reviewRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`리뷰를 찾을 수 없습니다 (ID: ${id})`);
    }

    const updated = await this.reviewRepository.incrementHelpfulCount(id);

    return {
      id: updated.id,
      institutionId: updated.institutionId,
      institutionName: updated.institution?.centerName || '',
      userId: updated.userId,
      authorNickname: updated.authorNickname,
      rating: updated.rating,
      content: updated.content,
      helpfulCount: updated.helpfulCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
