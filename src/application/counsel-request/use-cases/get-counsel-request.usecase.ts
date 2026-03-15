import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ChildRepository } from '@domain/child/repository/child.repository';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';
import { CounselRequestFormData } from '@domain/counsel-request/model/value-objects/counsel-request-form-data';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { SoulEClient } from '@infrastructure/external/soul-e.client';
import { S3Service } from '@infrastructure/storage/s3.service';
import { CounselRequestResponseDto } from '../dto/counsel-request-response.dto';

export interface CounselRequestAuthContext {
  institutionId: string;
  facilityType: 'CARE_FACILITY' | 'COMMUNITY_CENTER' | 'EDUCATION_WELFARE_SCHOOL' | 'B_IMPACT_INSTITUTION';
}

@Injectable()
export class GetCounselRequestUseCase {
  private readonly logger = new Logger(GetCounselRequestUseCase.name);

  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
    @Inject('ChildRepository')
    private readonly childRepository: ChildRepository,
    private readonly s3Service: S3Service,
    private readonly soulEClient: SoulEClient,
  ) {}

  async execute(
    id: string,
    authContext: CounselRequestAuthContext,
  ): Promise<CounselRequestResponseDto> {
    const counselRequest = await this.counselRequestRepository.findById(id);

    if (!counselRequest) {
      throw new NotFoundException(`상담의뢰지를 찾을 수 없습니다 (ID: ${id})`);
    }

    // 권한 검증: 해당 상담의뢰지의 아동이 현재 시설에 속하는지 확인
    await this.validateAccess(counselRequest.childId, authContext);

    return this.toResponseDto(counselRequest);
  }

  /**
   * 상담의뢰지 접근 권한 검증
   * - 상담의뢰지의 아동이 현재 로그인한 시설에 속하는지 확인
   */
  private async validateAccess(
    childId: string,
    authContext: CounselRequestAuthContext,
  ): Promise<void> {
    const child = await this.childRepository.findById(childId);

    if (!child) {
      throw new NotFoundException(`아동을 찾을 수 없습니다 (ID: ${childId})`);
    }

    let hasAccess = false;
    switch (authContext.facilityType) {
      case 'CARE_FACILITY':
        hasAccess = child.careFacilityId === authContext.institutionId;
        break;
      case 'COMMUNITY_CENTER':
        hasAccess = child.communityChildCenterId === authContext.institutionId;
        break;
      case 'EDUCATION_WELFARE_SCHOOL':
        hasAccess = child.educationWelfareSchoolId === authContext.institutionId;
        break;
    }

    if (!hasAccess) {
      throw new ForbiddenException('이 상담의뢰지를 조회할 권한이 없습니다.');
    }
  }

  private async toResponseDto(counselRequest: CounselRequest): Promise<CounselRequestResponseDto> {
    // 통합 보고서 Presigned URL 생성 (S3 key가 있고, 상태가 completed일 때)
    let integratedReportUrl: string | undefined;
    if (
      counselRequest.integratedReportS3Key &&
      counselRequest.integratedReportStatus === 'completed'
    ) {
      try {
        integratedReportUrl = await this.s3Service.getPresignedUrl(
          counselRequest.integratedReportS3Key,
          3600, // 1시간 유효
        );
      } catch (error) {
        this.logger.warn(`통합 보고서 Presigned URL 생성 실패: ${error.message}`, {
          counselRequestId: counselRequest.id,
          s3Key: counselRequest.integratedReportS3Key,
        });
      }
    }

    // SDQ-A scaleScores 보강 (기존 데이터 호환성)
    const enrichedFormData = await this.enrichSdqAScaleScores(
      counselRequest.childId,
      counselRequest.formData,
    );

    return {
      id: counselRequest.id,
      childId: counselRequest.childId,
      status: counselRequest.status,
      formData: enrichedFormData,
      centerName: counselRequest.centerName,
      careType: counselRequest.careType,
      requestDate: counselRequest.requestDate,
      matchedInstitutionId: counselRequest.matchedInstitutionId,
      matchedCounselorId: counselRequest.matchedCounselorId,
      integratedReportStatus: counselRequest.integratedReportStatus,
      integratedReportUrl,
      createdAt: counselRequest.createdAt,
      updatedAt: counselRequest.updatedAt,
    };
  }

  /**
   * SDQ-A 검사 결과에 scaleScores가 없는 경우 Soul-E API에서 조회하여 추가
   * 기존 데이터 호환성을 위한 보강 로직
   */
  private async enrichSdqAScaleScores(
    childId: string,
    formData: CounselRequestFormData,
  ): Promise<CounselRequestFormData> {
    if (!formData?.testResults?.attachedAssessments) {
      return formData;
    }

    // SDQ-A 검사 결과 찾기
    const sdqaIndex = formData.testResults.attachedAssessments.findIndex(
      (a) => a.assessmentType === 'SDQ_A',
    );

    // SDQ-A가 없거나 이미 scaleScores가 있으면 그대로 반환
    if (sdqaIndex === -1 || formData.testResults.attachedAssessments[sdqaIndex].scaleScores) {
      return formData;
    }

    this.logger.log(`🔍 SDQ-A scaleScores 조회 시도 (조회) - childId: ${childId}`);

    try {
      // Soul-E API에서 아동의 검사 결과 목록 조회
      const results = await this.soulEClient.getAssessmentResults(childId);

      // SDQ-A 검사 결과 찾기
      const sdqaResult = results.find((r) => r.assessment_type === 'SDQ_A');

      if (sdqaResult?.scale_scores && 'strengths' in sdqaResult.scale_scores) {
        this.logger.log(`✅ SDQ-A scaleScores 조회 성공 (조회) - childId: ${childId}`);

        // scaleScores 추가
        const enrichedAssessments = [...formData.testResults.attachedAssessments];
        enrichedAssessments[sdqaIndex] = {
          ...enrichedAssessments[sdqaIndex],
          scaleScores: sdqaResult.scale_scores as {
            strengths?: {
              score?: number;
              maxScore?: number;
              level?: number;
              levelDescription?: string;
            };
            difficulties?: {
              score?: number;
              maxScore?: number;
              level?: number;
              levelDescription?: string;
            };
          },
        };

        return {
          ...formData,
          testResults: {
            ...formData.testResults,
            attachedAssessments: enrichedAssessments,
          },
        };
      }
    } catch (error) {
      this.logger.warn(`⚠️ SDQ-A scaleScores 조회 실패 (조회) - childId: ${childId}`, error);
    }

    return formData;
  }
}
