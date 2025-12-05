import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosInstance } from 'axios';

/**
 * Soul-E 검사 결과 요약 인터페이스
 * Soul-E의 AssessmentResultSummaryOutput 스키마와 동일
 */
export interface SoulEAssessmentResultSummary {
  result_id: string;
  session_id: string;
  child_id: string;
  child_name: string;
  assessment_type: string;
  assessment_name: string;
  total_score: number | null;
  max_score: number | null;
  overall_level: string | null;
  report_url: string | null; // Inpsyt 리포트 URL (만료됨)
  s3_report_url: string | null; // S3 영구 리포트 URL
  scored_at: string | null;
  created_at: string;
}

/**
 * Soul-E MSA 클라이언트
 * FastAPI Soul-E 서비스와 HTTP 통신
 */
@Injectable()
export class SoulEClient {
  private readonly logger = new Logger(SoulEClient.name);
  private readonly client: AxiosInstance;
  private readonly serviceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.serviceUrl =
      this.configService.get<string>('SOUL_E_SERVICE_URL') || 'http://localhost:8000';

    const timeout = this.configService.get<number>('SOUL_E_API_TIMEOUT') || 10000;

    this.client = axios.create({
      baseURL: this.serviceUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(`Soul-E Client initialized: ${this.serviceUrl}`);
  }

  /**
   * 아동의 검사 결과 목록 조회
   * @param childId yeirin 백엔드의 아동 ID
   * @returns 검사 결과 요약 목록
   */
  async getAssessmentResults(childId: string): Promise<SoulEAssessmentResultSummary[]> {
    this.logger.log(`Soul-E 검사 결과 조회 요청 - childId: ${childId}`);

    try {
      const response = await this.client.get<SoulEAssessmentResultSummary[]>(
        `/api/v1/assessment/children/${childId}/results`,
      );

      this.logger.log(`Soul-E 검사 결과 조회 성공 - ${response.data.length}개 결과`);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;

        // 404는 결과가 없는 경우 - 빈 배열 반환
        if (status === 404) {
          this.logger.log(`Soul-E 검사 결과 없음 - childId: ${childId}`);
          return [];
        }

        const message =
          (axiosError.response?.data as { detail?: string })?.detail ||
          axiosError.message ||
          'Soul-E service failed';

        this.logger.error(`Soul-E 검사 결과 조회 실패 - Status: ${status}, Message: ${message}`);

        throw new HttpException(
          {
            statusCode: status,
            message,
            service: 'soul-e',
          },
          status,
        );
      }

      this.logger.error(`Soul-E 예상치 못한 에러`, error);

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Unexpected error calling Soul-E service',
          service: 'soul-e',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Soul-E 서비스 헬스 체크
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      const isHealthy = response.status === 200;
      this.logger.log(`Soul-E 서비스 헬스 체크: ${isHealthy ? '정상' : '비정상'}`);
      return isHealthy;
    } catch (error) {
      this.logger.warn(`Soul-E 서비스 헬스 체크 실패`, error);
      return false;
    }
  }
}
