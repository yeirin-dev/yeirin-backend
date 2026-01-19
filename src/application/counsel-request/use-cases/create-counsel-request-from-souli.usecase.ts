import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
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
import { KprcAssessmentSummaryDto, AttachedAssessmentDto } from '../dto/create-counsel-request.dto';
import { SouliWebhookDto } from '../dto/souli-webhook.dto';

@Injectable()
export class CreateCounselRequestFromSouliUseCase {
  private readonly logger = new Logger(CreateCounselRequestFromSouliUseCase.name);

  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
    private readonly yeirinAIClient: YeirinAIClient,
    private readonly soulEClient: SoulEClient,
  ) {}

  async execute(dto: SouliWebhookDto): Promise<CounselRequestResponseDto> {
    // SDQ-A scaleScores 보강: webhook에 scaleScores가 없는 경우 Soul-E API에서 조회
    const enrichedTestResults = await this.enrichSdqAScaleScores(dto.childId, dto.testResults);

    // FormData 구성
    const formData = {
      coverInfo: dto.coverInfo,
      basicInfo: dto.basicInfo,
      psychologicalInfo: dto.psychologicalInfo,
      requestMotivation: dto.requestMotivation,
      testResults: enrichedTestResults,
      consent: dto.consent,
    };

    // CounselRequest 도메인 생성
    const result = CounselRequest.create({
      id: uuidv4(),
      childId: dto.childId,
      formData,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.getError().message);
    }

    const counselRequest = result.getValue();

    // 저장
    const saved = await this.counselRequestRepository.save(counselRequest);

    this.logger.log(`✅ 소울이 연동 성공 - Session ID: ${dto.souliSessionId}`);

    // 통합 보고서 생성 요청
    await this.requestIntegratedReportGeneration(saved.id, dto);

    // Response DTO 변환
    return this.toResponseDto(saved);
  }

  /**
   * SDQ-A 검사 결과에 scaleScores가 없는 경우 Soul-E API에서 조회하여 추가
   * webhook에서 scaleScores가 전달되지 않는 경우를 대비한 보강 로직
   */
  private async enrichSdqAScaleScores(
    childId: string,
    testResults: SouliWebhookDto['testResults'],
  ): Promise<SouliWebhookDto['testResults']> {
    if (!testResults?.attachedAssessments) {
      return testResults;
    }

    // SDQ-A 검사 결과 찾기
    const sdqaIndex = testResults.attachedAssessments.findIndex(
      (a) => a.assessmentType === 'SDQ_A',
    );

    // SDQ-A가 없거나 이미 scaleScores가 있으면 그대로 반환
    if (sdqaIndex === -1 || testResults.attachedAssessments[sdqaIndex].scaleScores) {
      return testResults;
    }

    this.logger.log(`🔍 SDQ-A scaleScores 조회 시도 - childId: ${childId}`);

    try {
      // Soul-E API에서 아동의 검사 결과 목록 조회
      const results = await this.soulEClient.getAssessmentResults(childId);

      // SDQ-A 검사 결과 찾기
      const sdqaResult = results.find((r) => r.assessment_type === 'SDQ_A');

      if (sdqaResult?.scale_scores && 'strengths' in sdqaResult.scale_scores) {
        this.logger.log(`✅ SDQ-A scaleScores 조회 성공 - childId: ${childId}`);

        // scaleScores 추가
        const enrichedAssessments = [...testResults.attachedAssessments];
        enrichedAssessments[sdqaIndex] = {
          ...enrichedAssessments[sdqaIndex],
          scaleScores: sdqaResult.scale_scores as {
            strengths?: { score?: number; maxScore?: number; level?: number; levelDescription?: string };
            difficulties?: { score?: number; maxScore?: number; level?: number; levelDescription?: string };
          },
        };

        return {
          ...testResults,
          attachedAssessments: enrichedAssessments,
        };
      }
    } catch (error) {
      this.logger.warn(`⚠️ SDQ-A scaleScores 조회 실패 - childId: ${childId}`, error);
    }

    return testResults;
  }

  /**
   * overallLevel 값을 yeirin-ai 호환 형식으로 변환
   * - 허용 값: 'normal', 'caution', 'clinical'
   * - 그 외 값(SDQ_A: 'strengths_1_difficulties_3', CRTES_R: 'level_3' 등)은 null로 변환
   */
  private normalizeOverallLevel(
    level: string | null | undefined,
  ): 'normal' | 'caution' | 'clinical' | null {
    const validLevels = ['normal', 'caution', 'clinical'];
    if (level && validLevels.includes(level)) {
      return level as 'normal' | 'caution' | 'clinical';
    }
    return null;
  }

  /**
   * 통합 보고서 생성 요청 (Fire-and-forget)
   * 검사 결과가 있으면 yeirin-ai에 통합 보고서 생성 요청
   * - KPRC, CRTES-R, SDQ-A 중 하나라도 있으면 생성
   */
  private async requestIntegratedReportGeneration(
    counselRequestId: string,
    dto: SouliWebhookDto,
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
    // NOTE: Pydantic은 int 타입에 float(예: 85.0)을 허용하지 않으므로 정수로 변환
    const attachedAssessmentsForReport: YeirinAIAttachedAssessmentDto[] = attachedAssessments.map(
      (a) => ({
        assessmentType: a.assessmentType,
        assessmentName: a.assessmentName,
        reportS3Key: a.reportS3Key,
        resultId: a.resultId,
        // Pydantic int 타입 호환성: number → int 변환
        totalScore: a.totalScore != null ? Math.round(a.totalScore) : null,
        maxScore: a.maxScore != null ? Math.round(a.maxScore) : null,
        // overallLevel 정규화: 'normal'|'caution'|'clinical' 외의 값은 null로 변환
        overallLevel: this.normalizeOverallLevel(a.overallLevel),
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
          priorityReasons: dto.basicInfo.priorityReasons,
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
        // conversationAnalysis는 yeirin-ai에서 Soul-E API를 통해 직접 조회
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
