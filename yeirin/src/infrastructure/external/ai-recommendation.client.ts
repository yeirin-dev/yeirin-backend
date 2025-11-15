import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * AI 추천 서비스 응답 인터페이스
 */
export interface AIRecommendationResponse {
  recommendations: Array<{
    institution_id: string;
    center_name: string;
    score: number;
    reasoning: string;
    address: string;
    average_rating: number;
  }>;
  total_institutions: number;
  request_text: string;
}

/**
 * AI 추천 MSA 클라이언트
 * FastAPI yeirin-ai 서비스와 HTTP 통신
 */
@Injectable()
export class AIRecommendationClient {
  private readonly logger = new Logger(AIRecommendationClient.name);
  private readonly client: AxiosInstance;
  private readonly serviceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.serviceUrl =
      this.configService.get<string>('AI_RECOMMENDATION_SERVICE_URL') || 'http://localhost:8001';

    const timeout = this.configService.get<number>('AI_RECOMMENDATION_API_TIMEOUT') || 30000;

    this.client = axios.create({
      baseURL: this.serviceUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(`AI Recommendation Client initialized: ${this.serviceUrl}`);
  }

  /**
   * 상담의뢰지 텍스트를 AI MSA에 전송하여 추천 결과 요청
   */
  async requestRecommendation(counselRequestText: string): Promise<AIRecommendationResponse> {
    this.logger.log(
      `AI 추천 요청 - URL: ${this.serviceUrl}, 텍스트 길이: ${counselRequestText.length}자`,
    );

    try {
      const response = await this.client.post<AIRecommendationResponse>('/api/v1/recommendations', {
        counsel_request_text: counselRequestText,
      });

      this.logger.log(`AI 추천 성공 - ${response.data.recommendations.length}개 기관 추천됨`);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
        const message =
          (axiosError.response?.data as any)?.detail ||
          axiosError.message ||
          'AI recommendation service failed';

        this.logger.error(`AI 추천 실패 - Status: ${status}, Message: ${message}`);

        throw new HttpException(
          {
            statusCode: status,
            message,
            service: 'ai-recommendation',
          },
          status,
        );
      }

      this.logger.error(`AI 추천 예상치 못한 에러`, error);

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Unexpected error calling AI service',
          service: 'ai-recommendation',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * AI 서비스 헬스 체크
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/v1/health');
      const isHealthy = response.status === 200 && response.data?.status === 'healthy';
      this.logger.log(`AI 서비스 헬스 체크: ${isHealthy ? '정상' : '비정상'}`);
      return isHealthy;
    } catch (error) {
      this.logger.warn(`AI 서비스 헬스 체크 실패`, error);
      return false;
    }
  }
}
