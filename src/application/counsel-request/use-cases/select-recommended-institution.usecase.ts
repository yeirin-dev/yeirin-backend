import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { CounselRequestRecommendationRepository } from '@domain/counsel-request-recommendation/repository/counsel-request-recommendation.repository';
import { CounselRequestResponseDto } from '../dto/counsel-request-response.dto';

/**
 * 추천된 기관 중 하나 선택 Use Case
 *
 * 비즈니스 플로우:
 * 1. 상담의뢰지 조회 및 RECOMMENDED 상태 검증
 * 2. 추천 목록 조회
 * 3. 선택한 기관이 추천 목록에 있는지 확인
 * 4. 선택한 추천에 selected = true 표시
 * 5. 상담의뢰지의 기관 선택 (상태 → MATCHED)
 */
@Injectable()
export class SelectRecommendedInstitutionUseCase {
  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
    @Inject('CounselRequestRecommendationRepository')
    private readonly recommendationRepository: CounselRequestRecommendationRepository,
  ) {}

  async execute(
    counselRequestId: string,
    institutionId: string,
  ): Promise<CounselRequestResponseDto> {
    // 1. 상담의뢰지 조회
    const counselRequest = await this.counselRequestRepository.findById(counselRequestId);
    if (!counselRequest) {
      throw new NotFoundException(`상담의뢰지 ID ${counselRequestId}를 찾을 수 없습니다`);
    }

    // 2. 추천 목록 조회
    const recommendations =
      await this.recommendationRepository.findByCounselRequestId(counselRequestId);
    if (recommendations.length === 0) {
      throw new BadRequestException('추천 목록이 없습니다. 먼저 추천을 요청하세요');
    }

    // 3. 선택한 기관이 추천 목록에 있는지 확인
    const selectedRecommendation = recommendations.find(
      (rec) => rec.institutionId === institutionId,
    );
    if (!selectedRecommendation) {
      throw new BadRequestException('선택한 기관이 추천 목록에 없습니다');
    }

    // 4. 선택한 추천에 selected = true 표시
    const selectResult = selectedRecommendation.select();
    if (selectResult.isFailure) {
      throw new BadRequestException(selectResult.getError().message);
    }
    await this.recommendationRepository.save(selectedRecommendation);

    // 5. 상담의뢰지의 기관 선택 (상태 → MATCHED)
    const matchResult = counselRequest.selectInstitution(institutionId);
    if (matchResult.isFailure) {
      throw new BadRequestException(matchResult.getError().message);
    }
    const updated = await this.counselRequestRepository.save(counselRequest);

    // 6. 응답 DTO 변환
    return this.toResponseDto(updated);
  }

  private toResponseDto(counselRequest: CounselRequest): CounselRequestResponseDto {
    return {
      id: counselRequest.id,
      childId: counselRequest.childId,
      guardianId: counselRequest.guardianId,
      status: counselRequest.status,
      formData: counselRequest.formData,
      centerName: counselRequest.centerName,
      careType: counselRequest.careType,
      requestDate: counselRequest.requestDate,
      matchedInstitutionId: counselRequest.matchedInstitutionId,
      matchedCounselorId: counselRequest.matchedCounselorId,
      createdAt: counselRequest.createdAt,
      updatedAt: counselRequest.updatedAt,
    };
  }
}
