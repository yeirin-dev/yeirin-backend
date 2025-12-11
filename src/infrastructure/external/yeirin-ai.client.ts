import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

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
  kprc_summary: {
    summaryLines?: string[];
    expertOpinion?: string;
    keyFindings?: string[];
    recommendations?: string[];
    confidenceScore?: number;
  };
  assessment_report_s3_key: string;
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
