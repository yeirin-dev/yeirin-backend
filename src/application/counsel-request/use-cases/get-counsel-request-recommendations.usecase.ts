import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { CounselRequestRecommendationRepository } from '@domain/counsel-request-recommendation/repository/counsel-request-recommendation.repository';

export interface RecommendationDto {
  id: string;
  institutionId: string;
  score: number;
  reason: string;
  rank: number;
  selected: boolean;
  isHighScore: boolean;
  createdAt: Date;
}

/**
 * 상담의뢰지 추천 목록 조회 Use Case
 */
@Injectable()
export class GetCounselRequestRecommendationsUseCase {
  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
    @Inject('CounselRequestRecommendationRepository')
    private readonly recommendationRepository: CounselRequestRecommendationRepository,
  ) {}

  async execute(counselRequestId: string): Promise<RecommendationDto[]> {
    // 1. 상담의뢰지 존재 여부 확인
    const counselRequest = await this.counselRequestRepository.findById(counselRequestId);
    if (!counselRequest) {
      throw new NotFoundException(`상담의뢰지 ID ${counselRequestId}를 찾을 수 없습니다`);
    }

    // 2. 추천 목록 조회 (rank 순)
    const recommendations =
      await this.recommendationRepository.findByCounselRequestId(counselRequestId);

    // 3. DTO 변환
    return recommendations.map((rec) => ({
      id: rec.id,
      institutionId: rec.institutionId,
      score: rec.score,
      reason: rec.reason,
      rank: rec.rank,
      selected: rec.selected,
      isHighScore: rec.isHighScore(),
      createdAt: rec.createdAt,
    }));
  }
}
