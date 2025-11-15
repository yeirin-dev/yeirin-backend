import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ReviewRepository } from '@domain/review/repository/review.repository';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { ReviewResponseDto } from '../dto/review-response.dto';

/**
 * 리뷰 수정 유스케이스
 */
@Injectable()
export class UpdateReviewUseCase {
  constructor(
    @Inject('ReviewRepository')
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async execute(id: string, dto: UpdateReviewDto): Promise<ReviewResponseDto> {
    // 리뷰 존재 확인
    const existing = await this.reviewRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`리뷰를 찾을 수 없습니다 (ID: ${id})`);
    }

    // 업데이트 데이터 준비
    const updateData: any = {};
    if (dto.rating !== undefined) updateData.rating = dto.rating;
    if (dto.content !== undefined) updateData.content = dto.content;

    const updated = await this.reviewRepository.update(id, updateData);

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
