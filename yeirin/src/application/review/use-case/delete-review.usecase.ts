import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ReviewRepository } from '@domain/review/repository/review.repository';

/**
 * 리뷰 삭제 유스케이스
 */
@Injectable()
export class DeleteReviewUseCase {
  constructor(
    @Inject('ReviewRepository')
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async execute(id: string): Promise<void> {
    // 리뷰 존재 확인
    const existing = await this.reviewRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`리뷰를 찾을 수 없습니다 (ID: ${id})`);
    }

    await this.reviewRepository.delete(id);
  }
}
