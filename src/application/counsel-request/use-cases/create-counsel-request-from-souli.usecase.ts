import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { YeirinAIClient } from '@infrastructure/external/yeirin-ai.client';
import { CounselRequestResponseDto } from '../dto/counsel-request-response.dto';
import { SouliWebhookDto } from '../dto/souli-webhook.dto';

@Injectable()
export class CreateCounselRequestFromSouliUseCase {
  private readonly logger = new Logger(CreateCounselRequestFromSouliUseCase.name);

  constructor(
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
    private readonly yeirinAIClient: YeirinAIClient,
  ) {}

  async execute(dto: SouliWebhookDto): Promise<CounselRequestResponseDto> {
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

    this.logger.log(`✅ 소울이 연동 성공 - Session ID: ${dto.souliSessionId}`);

    // KPRC 검사 결과가 있으면 통합 보고서 생성 요청
    if (dto.testResults?.assessmentReportS3Key && dto.testResults?.kprcSummary) {
      this.logger.log(`📋 통합 보고서 생성 요청 시작 - counselRequestId: ${saved.id}`);

      // Fire-and-forget: 통합 보고서 생성 요청
      // 실패해도 상담의뢰지 생성은 성공 처리
      await this.yeirinAIClient.requestIntegratedReport({
        counsel_request_id: saved.id,
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
        kprc_summary: {
          summaryLines: dto.testResults.kprcSummary.summaryLines,
          expertOpinion: dto.testResults.kprcSummary.expertOpinion,
          keyFindings: dto.testResults.kprcSummary.keyFindings,
          recommendations: dto.testResults.kprcSummary.recommendations,
          confidenceScore: dto.testResults.kprcSummary.confidenceScore,
        },
        assessment_report_s3_key: dto.testResults.assessmentReportS3Key,
      });

      this.logger.log(`📋 통합 보고서 생성 요청 완료 - counselRequestId: ${saved.id}`);
    } else {
      this.logger.log(`⚠️ KPRC 검사 결과 없음 - 통합 보고서 생성 건너뜀`);
    }

    // Response DTO 변환
    return this.toResponseDto(saved);
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
