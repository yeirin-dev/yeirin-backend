import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CounselRequestStatus } from '@domain/counsel-request/model/value-objects/counsel-request-enums';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { CounselRequestRecommendation } from '@domain/counsel-request-recommendation/model/counsel-request-recommendation';
import { CounselRequestRecommendationRepository } from '@domain/counsel-request-recommendation/repository/counsel-request-recommendation.repository';
import { RequestCounselorRecommendationUseCase } from '@application/matching/use-case/request-counselor-recommendation.usecase';
import { formDataToText } from '../helpers/form-data-to-text.helper';

/**
 * 상담의뢰지 AI 추천 요청 Use Case
 *
 * 비즈니스 플로우:
 * 1. 상담의뢰지 조회 및 PENDING 상태 검증
 * 2. formData를 텍스트로 변환
 * 3. Matching Domain Service를 통해 AI 추천 요청 (DDD 패턴)
 * 4. 추천 결과를 CounselRequestRecommendation 엔티티로 저장 (최대 5개)
 * 5. 상담의뢰지 상태 → RECOMMENDED
 *
 * DDD 패턴:
 * - Matching Domain Service에 AI 추천 책임 위임 (SRP)
 * - CounselRequest Domain은 추천 결과 관리에만 집중
 */
@Injectable()
export class RequestCounselRequestRecommendationUseCase {
  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
    @Inject('CounselRequestRecommendationRepository')
    private readonly recommendationRepository: CounselRequestRecommendationRepository,
    private readonly matchingService: RequestCounselorRecommendationUseCase,
  ) {}

  async execute(counselRequestId: string): Promise<{
    counselRequestId: string;
    recommendations: Array<{
      id: string;
      institutionId: string;
      score: number;
      reason: string;
      rank: number;
    }>;
  }> {
    // 1. 상담의뢰지 조회
    const counselRequest = await this.counselRequestRepository.findById(counselRequestId);
    if (!counselRequest) {
      throw new NotFoundException(`상담의뢰지 ID ${counselRequestId}를 찾을 수 없습니다`);
    }

    // 2. PENDING 상태 검증
    if (counselRequest.status !== CounselRequestStatus.PENDING) {
      throw new BadRequestException(
        `추천 요청은 PENDING 상태에서만 가능합니다 (현재: ${counselRequest.status})`,
      );
    }

    // 3. formData를 텍스트로 변환
    const counselRequestText = formDataToText(counselRequest.formData);
    if (!counselRequestText || counselRequestText.length < 10) {
      throw new BadRequestException('상담의뢰지 정보가 불충분하여 추천을 요청할 수 없습니다');
    }

    // 4. Matching Domain Service를 통해 AI 추천 요청 (DDD 패턴)
    const matchingResponse = await this.matchingService.execute({
      counselRequestText,
    });

    // 5. CounselRequestRecommendation 엔티티 생성
    const recommendations: CounselRequestRecommendation[] = [];
    for (let i = 0; i < matchingResponse.recommendations.length && i < 5; i++) {
      const rec = matchingResponse.recommendations[i];

      const recommendationResult = CounselRequestRecommendation.create({
        id: uuidv4(),
        counselRequestId: counselRequest.id,
        institutionId: rec.institutionId,
        score: rec.score,
        reason: rec.reason,
        rank: i + 1, // 1부터 시작
      });

      if (recommendationResult.isFailure) {
        throw new Error(recommendationResult.getError().message);
      }

      recommendations.push(recommendationResult.getValue());
    }

    // 6. 추천 저장 (벌크)
    const savedRecommendations = await this.recommendationRepository.saveAll(recommendations);

    // 7. 상담의뢰지 상태 변경 → RECOMMENDED
    const markResult = counselRequest.markAsRecommended();
    if (markResult.isFailure) {
      throw new BadRequestException(markResult.getError().message);
    }
    await this.counselRequestRepository.save(counselRequest);

    // 8. 응답 DTO 변환
    return {
      counselRequestId: counselRequest.id,
      recommendations: savedRecommendations.map((rec) => ({
        id: rec.id,
        institutionId: rec.institutionId,
        score: rec.score,
        reason: rec.reason,
        rank: rec.rank,
      })),
    };
  }
}
