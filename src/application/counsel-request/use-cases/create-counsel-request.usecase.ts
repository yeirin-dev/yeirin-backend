import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { SoulEClient, KprcSummary } from '@infrastructure/external/soul-e.client';
import {
  YeirinAIClient,
  IntegratedReportKprcSummary,
} from '@infrastructure/external/yeirin-ai.client';
import { CounselRequestResponseDto } from '../dto/counsel-request-response.dto';
import {
  CreateCounselRequestDto,
  KprcAssessmentSummaryDto,
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
   * KPRC 검사 결과가 있으면 yeirin-ai에 통합 보고서 생성 요청
   */
  private async requestIntegratedReportGeneration(
    counselRequestId: string,
    dto: CreateCounselRequestDto,
  ): Promise<void> {
    // 1. dto에서 kprcSummary와 assessmentReportS3Key 확인
    const webhookKprcSummary: KprcAssessmentSummaryDto | undefined = dto.testResults?.kprcSummary;
    let soulEKprcSummary: KprcSummary | null = null;
    let assessmentReportS3Key: string | null = dto.testResults?.assessmentReportS3Key ?? null;

    // 2. Soul-E에서 검사 결과 조회 (MSA 연동)
    if (!webhookKprcSummary || !assessmentReportS3Key) {
      this.logger.log(`🔍 Soul-E에서 KPRC 검사 결과 조회 시도 - childId: ${dto.childId}`);

      try {
        const latestResult = await this.soulEClient.getLatestAssessmentResult(dto.childId);

        if (latestResult) {
          // summary가 있으면 soulEKprcSummary로 사용
          if (latestResult.summary && !webhookKprcSummary) {
            soulEKprcSummary = latestResult.summary;
            this.logger.log(`✅ Soul-E에서 kprcSummary 조회 성공`);
          }

          // s3_report_url이 있으면 assessmentReportS3Key로 사용
          if (latestResult.s3_report_url && !assessmentReportS3Key) {
            assessmentReportS3Key = latestResult.s3_report_url;
            this.logger.log(
              `✅ Soul-E에서 assessmentReportS3Key 조회 성공: ${assessmentReportS3Key}`,
            );
          }
        }
      } catch (error) {
        this.logger.warn(`⚠️ Soul-E 검사 결과 조회 실패 - 통합 보고서 생성 건너뜀`, error);
        return;
      }
    }

    // 3. KPRC 검사 결과가 있으면 통합 보고서 생성 요청
    const hasKprcSummary = webhookKprcSummary || soulEKprcSummary;
    if (assessmentReportS3Key && hasKprcSummary) {
      this.logger.log(`📋 통합 보고서 생성 요청 시작 - counselRequestId: ${counselRequestId}`);

      // kprc_summary 통합 (dto 우선, 없으면 Soul-E API 결과 사용)
      const kprcSummaryForReport: IntegratedReportKprcSummary = webhookKprcSummary
        ? {
            summaryLines: webhookKprcSummary.summaryLines || [],
            expertOpinion: webhookKprcSummary.expertOpinion || '',
            keyFindings: webhookKprcSummary.keyFindings || [],
            recommendations: webhookKprcSummary.recommendations || [],
            confidenceScore: webhookKprcSummary.confidenceScore || 0,
          }
        : {
            summaryLines: soulEKprcSummary!.key_findings || [],
            expertOpinion: soulEKprcSummary!.overall_assessment || '',
            keyFindings: soulEKprcSummary!.key_findings || [],
            recommendations: soulEKprcSummary!.recommendations || [],
            confidenceScore: soulEKprcSummary!.confidence_score || 0,
          };

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
          },
          psychological_info: {
            medicalHistory: dto.psychologicalInfo.medicalHistory,
            specialNotes: dto.psychologicalInfo.specialNotes,
          },
          request_motivation: {
            motivation: dto.requestMotivation.motivation,
            goals: dto.requestMotivation.goals,
          },
          kprc_summary: kprcSummaryForReport,
          assessment_report_s3_key: assessmentReportS3Key,
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
    } else {
      this.logger.log(
        `⚠️ KPRC 검사 결과 없음 - 통합 보고서 생성 건너뜀 ` +
          `(kprcSummary: ${!!hasKprcSummary}, assessmentReportS3Key: ${!!assessmentReportS3Key})`,
      );
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
