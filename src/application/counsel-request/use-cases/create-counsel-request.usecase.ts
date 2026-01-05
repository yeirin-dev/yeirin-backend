import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { SoulEClient } from '@infrastructure/external/soul-e.client';
import {
  YeirinAIClient,
  IntegratedReportKprcSummary,
  AttachedAssessmentDto as YeirinAIAttachedAssessmentDto,
} from '@infrastructure/external/yeirin-ai.client';
import { CounselRequestResponseDto } from '../dto/counsel-request-response.dto';
import {
  CreateCounselRequestDto,
  KprcAssessmentSummaryDto,
  AttachedAssessmentDto,
} from '../dto/create-counsel-request.dto';

@Injectable()
export class CreateCounselRequestUseCase {
  private readonly logger = new Logger(CreateCounselRequestUseCase.name);

  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
    private readonly yeirinAIClient: YeirinAIClient,
    private readonly soulEClient: SoulEClient,
  ) {}

  async execute(dto: CreateCounselRequestDto): Promise<CounselRequestResponseDto> {
    // FormData 구성
    const formData = {
      coverInfo: dto.coverInfo,
      basicInfo: dto.basicInfo,
      psychologicalInfo: dto.psychologicalInfo,
      requestMotivation: dto.requestMotivation,
      testResults: dto.testResults,
      consent: dto.consent,
    };

    // CounselRequest 도메인 생성
    const result = CounselRequest.create({
      id: uuidv4(),
      childId: dto.childId,
      guardianId: dto.guardianId,
      formData,
    });

    if (result.isFailure) {
      throw new Error(result.getError().message);
    }

    const counselRequest = result.getValue();

    // 저장
    const saved = await this.counselRequestRepository.save(counselRequest);

    this.logger.log(`✅ 상담의뢰지 생성 완료 - ID: ${saved.id}`);

    // =========================================================================
    // 통합 보고서 자동 생성 (MSA 연동)
    // =========================================================================
    await this.requestIntegratedReportGeneration(saved.id, dto);

    // Response DTO 변환
    return this.toResponseDto(saved);
  }

  /**
   * 통합 보고서 생성 요청 (Fire-and-forget)
   * 검사 결과가 있으면 yeirin-ai에 통합 보고서 생성 요청
   * - KPRC, CRTES-R, SDQ-A 중 하나라도 있으면 생성
   */
  private async requestIntegratedReportGeneration(
    counselRequestId: string,
    dto: CreateCounselRequestDto,
  ): Promise<void> {
    // 1. 첨부된 검사 결과 수집 (새 방식: attachedAssessments)
    const attachedAssessments: AttachedAssessmentDto[] = dto.testResults?.attachedAssessments ?? [];

    // 2. Legacy 필드 처리 (하위 호환성)
    const legacyKprcSummary: KprcAssessmentSummaryDto | undefined = dto.testResults?.kprcSummary;
    const legacyAssessmentReportS3Key: string | undefined = dto.testResults?.assessmentReportS3Key;

    // 3. attachedAssessments가 없고 legacy 필드도 없으면 Soul-E에서 조회 시도
    const hasAnyAttachedAssessment = attachedAssessments.length > 0;
    const hasLegacyKprc = legacyKprcSummary && legacyAssessmentReportS3Key;

    if (!hasAnyAttachedAssessment && !hasLegacyKprc) {
      this.logger.log(`🔍 Soul-E에서 KPRC 검사 결과 조회 시도 - childId: ${dto.childId}`);

      try {
        const latestResult = await this.soulEClient.getLatestAssessmentResult(dto.childId);

        if (latestResult?.summary && latestResult?.s3_report_url) {
          // Soul-E 결과를 attachedAssessments 형식으로 추가
          attachedAssessments.push({
            assessmentType: 'KPRC_CO_SG_E',
            assessmentName: 'KPRC 인성평정척도',
            reportS3Key: latestResult.s3_report_url,
            resultId: latestResult.result_id,
            summary: {
              summaryLines: latestResult.summary.key_findings || [],
              expertOpinion: latestResult.summary.overall_assessment || '',
              keyFindings: latestResult.summary.key_findings || [],
              recommendations: latestResult.summary.recommendations || [],
              confidenceScore: latestResult.summary.confidence_score || 0,
            },
          });
          this.logger.log(`✅ Soul-E에서 KPRC 검사 결과 조회 성공`);
        }
      } catch (error) {
        this.logger.warn(`⚠️ Soul-E 검사 결과 조회 실패`, error);
      }
    }

    // 4. 검사 결과 유무 확인 (attachedAssessments 또는 legacy 필드)
    const hasAssessments = attachedAssessments.length > 0 || hasLegacyKprc;
    if (!hasAssessments) {
      this.logger.log(
        `⚠️ 첨부된 검사 결과 없음 - 통합 보고서 생성 건너뜀 - childId: ${dto.childId}`,
      );
      return;
    }

    this.logger.log(
      `📋 통합 보고서 생성 요청 시작 - counselRequestId: ${counselRequestId}, ` +
        `검사 수: ${attachedAssessments.length}개 ` +
        `(${attachedAssessments.map((a) => a.assessmentType).join(', ') || 'legacy KPRC'})`,
    );

    // 5. attached_assessments를 yeirin-ai 형식으로 변환
    const attachedAssessmentsForReport: YeirinAIAttachedAssessmentDto[] = attachedAssessments.map(
      (a) => ({
        assessmentType: a.assessmentType,
        assessmentName: a.assessmentName,
        reportS3Key: a.reportS3Key,
        resultId: a.resultId,
        totalScore: a.totalScore,
        maxScore: a.maxScore,
        overallLevel: a.overallLevel,
        scoredAt: a.scoredAt,
        summary: a.summary
          ? {
              summaryLines: a.summary.summaryLines,
              expertOpinion: a.summary.expertOpinion,
              keyFindings: a.summary.keyFindings,
              recommendations: a.summary.recommendations,
              confidenceScore: a.summary.confidenceScore,
            }
          : undefined,
      }),
    );

    // 6. Legacy 필드 처리 (하위 호환성을 위해 KPRC 정보 추출)
    const kprcAssessment = attachedAssessments.find((a) => a.assessmentType === 'KPRC_CO_SG_E');
    const kprcSummaryForReport: IntegratedReportKprcSummary | undefined = kprcAssessment?.summary
      ? {
          summaryLines: kprcAssessment.summary.summaryLines || [],
          expertOpinion: kprcAssessment.summary.expertOpinion || '',
          keyFindings: kprcAssessment.summary.keyFindings || [],
          recommendations: kprcAssessment.summary.recommendations || [],
          confidenceScore: kprcAssessment.summary.confidenceScore || 0,
        }
      : legacyKprcSummary
        ? {
            summaryLines: legacyKprcSummary.summaryLines || [],
            expertOpinion: legacyKprcSummary.expertOpinion || '',
            keyFindings: legacyKprcSummary.keyFindings || [],
            recommendations: legacyKprcSummary.recommendations || [],
            confidenceScore: legacyKprcSummary.confidenceScore || 0,
          }
        : undefined;

    const assessmentReportS3KeyForReport =
      kprcAssessment?.reportS3Key || legacyAssessmentReportS3Key;

    // Fire-and-forget: 통합 보고서 생성 요청
    // 실패해도 상담의뢰지 생성은 성공 처리
    try {
      await this.yeirinAIClient.requestIntegratedReport({
        counsel_request_id: counselRequestId,
        child_id: dto.childId,
        child_name: dto.basicInfo.childInfo.name,
        cover_info: {
          requestDate: dto.coverInfo.requestDate,
          centerName: dto.coverInfo.centerName,
          counselorName: dto.coverInfo.counselorName,
        },
        basic_info: {
          childInfo: {
            name: dto.basicInfo.childInfo.name,
            gender: dto.basicInfo.childInfo.gender,
            age: dto.basicInfo.childInfo.age,
            grade: dto.basicInfo.childInfo.grade,
            birthDate: dto.basicInfo.childInfo.birthDate, // 사회서비스 이용 추천서용
          },
          careType: dto.basicInfo.careType,
          priorityReason: dto.basicInfo.priorityReason,
          protectedChildInfo: dto.basicInfo.protectedChildInfo, // 보호대상 아동 정보
        },
        psychological_info: {
          medicalHistory: dto.psychologicalInfo.medicalHistory,
          specialNotes: dto.psychologicalInfo.specialNotes,
        },
        request_motivation: {
          motivation: dto.requestMotivation.motivation,
          goals: dto.requestMotivation.goals,
        },
        // 새 방식: attached_assessments (KPRC, CRTES-R, SDQ-A 모두 포함)
        attached_assessments: attachedAssessmentsForReport,
        // 하위 호환성: legacy 필드 (KPRC가 있는 경우만)
        kprc_summary: kprcSummaryForReport,
        assessment_report_s3_key: assessmentReportS3KeyForReport,
        // 사회서비스 이용 추천서 (Government Doc) 데이터
        guardian_info: dto.guardianInfo,
        institution_info: dto.institutionInfo,
      });

      this.logger.log(`📋 통합 보고서 생성 요청 완료 - counselRequestId: ${counselRequestId}`);
    } catch (error) {
      this.logger.error(
        `❌ 통합 보고서 생성 요청 실패 - counselRequestId: ${counselRequestId}`,
        error,
      );
      // Fire-and-forget: 실패해도 상담의뢰지 생성은 성공
    }
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
