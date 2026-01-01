import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * 검사소견 요약 (통합 보고서용)
 * KPRC, CRTES-R, SDQ-A 공통
 */
export interface AssessmentSummaryDto {
  summaryLines?: string[];
  expertOpinion?: string;
  keyFindings?: string[];
  recommendations?: string[];
  confidenceScore?: number;
}

/**
 * @deprecated IntegratedReportKprcSummary 대신 AssessmentSummaryDto 사용
 */
export type IntegratedReportKprcSummary = AssessmentSummaryDto;

/**
 * 첨부된 검사 결과 DTO
 * KPRC, CRTES-R, SDQ-A 등 모든 심리검사 결과
 */
export interface AttachedAssessmentDto {
  assessmentType: string; // 'KPRC_CO_SG_E' | 'CRTES_R' | 'SDQ_A'
  assessmentName: string;
  reportS3Key?: string; // KPRC만 있음 (Inpsyt PDF), CRTES-R/SDQ-A는 없음
  resultId: string;
  totalScore?: number | null;
  maxScore?: number | null;
  overallLevel?: 'normal' | 'caution' | 'clinical' | null;
  scoredAt?: string | null;
  summary?: AssessmentSummaryDto;
}

/**
 * 생년월일 (사회서비스 이용 추천서용)
 */
export interface BirthDate {
  year: number;
  month: number;
  day: number;
}

/**
 * 보호자 정보 (사회서비스 이용 추천서용)
 */
export interface GuardianInfo {
  name: string;
  phoneNumber: string;
  homePhone?: string;
  address: string;
  addressDetail?: string;
  relationToChild: string;
}

/**
 * 기관/작성자 정보 (사회서비스 이용 추천서용)
 */
export interface InstitutionInfo {
  institutionName: string;
  phoneNumber: string;
  address: string;
  addressDetail?: string;
  writerPosition: string;
  writerName: string;
  relationToChild: string;
}

/**
 * 통합 보고서 생성 요청 DTO
 */
export interface IntegratedReportRequestDto {
  counsel_request_id: string;
  child_id: string;
  child_name: string;
  cover_info: {
    requestDate: { year: number; month: number; day: number };
    centerName: string;
    counselorName: string;
  };
  basic_info: {
    childInfo: {
      name: string;
      gender: string;
      age: number;
      grade: string;
      birthDate?: BirthDate; // 사회서비스 이용 추천서용
    };
    careType: string;
    priorityReason?: string;
  };
  psychological_info: {
    medicalHistory: string;
    specialNotes: string;
  };
  request_motivation: {
    motivation: string;
    goals: string;
  };

  // 첨부된 검사 결과들 (KPRC, CRTES-R, SDQ-A)
  // 새 방식: attached_assessments 사용 권장
  attached_assessments?: AttachedAssessmentDto[];

  // ⚠️ 하위 호환성: 기존 필드 유지 (deprecated)
  // KPRC만 있는 경우 또는 legacy 호환용
  /** @deprecated Use attached_assessments instead */
  kprc_summary?: IntegratedReportKprcSummary;
  /** @deprecated Use attached_assessments instead */
  assessment_report_s3_key?: string;

  // 사회서비스 이용 추천서 (Government Doc) 데이터 - Optional
  guardian_info?: GuardianInfo;
  institution_info?: InstitutionInfo;
}

/**
 * 통합 보고서 생성 응답 DTO
 */
export interface IntegratedReportAcceptedResponse {
  status: 'accepted';
  counsel_request_id: string;
  message: string;
}

/**
 * Yeirin-AI MSA 클라이언트
 * 통합 보고서 생성을 위한 HTTP 통신
 */
@Injectable()
export class YeirinAIClient {
  private readonly logger = new Logger(YeirinAIClient.name);
  private readonly client: AxiosInstance;
  private readonly serviceUrl: string;
  private readonly internalApiSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.serviceUrl =
      this.configService.get<string>('AI_RECOMMENDATION_SERVICE_URL') || 'http://localhost:8001';
    this.internalApiSecret =
      this.configService.get<string>('INTERNAL_API_SECRET') || 'yeirin-internal-secret';

    this.client = axios.create({
      baseURL: this.serviceUrl,
      timeout: 10000, // 10초 (fire-and-forget이므로 짧게)
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Api-Key': this.internalApiSecret,
      },
    });

    this.logger.log(`YeirinAI Client initialized: ${this.serviceUrl}`);
  }

  /**
   * 통합 보고서 생성을 요청합니다.
   *
   * Fire-and-forget 패턴:
   * - 202 Accepted 응답만 받고 반환
   * - 실제 처리는 yeirin-ai에서 백그라운드로 진행
   * - 완료 후 웹훅으로 결과 수신
   *
   * @param dto 통합 보고서 생성 요청 데이터
   */
  async requestIntegratedReport(dto: IntegratedReportRequestDto): Promise<void> {
    this.logger.log(
      `통합 보고서 생성 요청 - counselRequestId: ${dto.counsel_request_id}, childName: ${dto.child_name}`,
    );

    try {
      const response = await this.client.post<IntegratedReportAcceptedResponse>(
        '/api/v1/integrated-reports',
        dto,
      );

      if (response.status === 202) {
        this.logger.log(
          `통합 보고서 생성 요청 수락됨 - counselRequestId: ${dto.counsel_request_id}`,
        );
      } else {
        this.logger.warn(
          `예상치 못한 응답 상태 - status: ${response.status}, counselRequestId: ${dto.counsel_request_id}`,
        );
      }
    } catch (error) {
      // Fire-and-forget 패턴이므로 에러 로깅만 하고 throw하지 않음
      // 상담의뢰지 생성 자체는 실패하지 않아야 함
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `통합 보고서 생성 요청 실패 - status: ${error.response?.status}, message: ${error.message}, counselRequestId: ${dto.counsel_request_id}`,
        );
      } else {
        this.logger.error(
          `통합 보고서 생성 요청 예상치 못한 에러 - counselRequestId: ${dto.counsel_request_id}`,
          error,
        );
      }
    }
  }
}
