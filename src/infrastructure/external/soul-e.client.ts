import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosInstance } from 'axios';

/**
 * 보호자 동의 링크 생성 요청 인터페이스
 */
export interface GenerateGuardianConsentLinkRequest {
  child_id: string;
  child_name: string;
  child_birth_date: string; // YYYY-MM-DD 형식
  institution_name: string;
  guardian_phone: string;
  expiry_days?: number;
}

/**
 * 보호자 동의 링크 생성 응답 인터페이스
 */
export interface GenerateGuardianConsentLinkResponse {
  token: string;
  consent_url: string;
  expires_at: string;
  child_id: string;
  child_name: string;
}

/**
 * KPRC 전문가 소견 요약 인터페이스
 * yeirin-ai가 생성한 요약 정보
 */
export interface KprcSummary {
  overall_assessment: string; // 전반적인 평가
  key_findings: string[]; // 주요 발견사항
  recommendations: string[]; // 권고사항
  risk_areas: string[]; // 위험 영역
  strengths: string[]; // 강점 영역
  confidence_score: number; // 신뢰도 점수 (0-1)
}

/**
 * KPRC T점수 인터페이스
 */
export interface KprcTScores {
  ers_t_score: number | null; // 자아탄력성 (≤30T가 위험)
  icn_t_score: number | null; // 비일관성 (≥65T가 위험)
  f_t_score: number | null; // 저빈도 (≥65T가 위험)
  vdl_t_score: number | null; // 긍정왜곡 (≥65T가 위험)
  pdl_t_score: number | null; // 부정왜곡 (≥65T가 위험)
  anx_t_score: number | null; // 불안 (≥65T가 위험)
  dep_t_score: number | null; // 우울 (≥65T가 위험)
  som_t_score: number | null; // 신체화 (≥65T가 위험)
  dlq_t_score: number | null; // 비행 (≥65T가 위험)
  hpr_t_score: number | null; // 과잉행동 (≥65T가 위험)
  fam_t_score: number | null; // 가족관계 (≥65T가 위험)
  soc_t_score: number | null; // 사회관계 (≥65T가 위험)
  psy_t_score: number | null; // 정신증 (≥65T가 위험)
}

/**
 * CRTES-R 검사 결과 상세
 */
export interface CrtesRResultDetail {
  result_id: string;
  total_score: number | null;
  severity_level: number | null; // 1: 정상, 2: 경계, 3: 중증도, 4: 중증
  severity_label: string | null;
}

/**
 * SDQ-A 검사 결과 상세
 */
export interface SdqAResultDetail {
  result_id: string;
  total_score: number | null;
  strength_level: number | null; // 1: 정상, 2: 경계선, 3: 위험군
  difficulty_level: number | null; // 1: 정상, 2: 경계선, 3: 위험군
}

/**
 * KPRC 검사 결과 상세
 */
export interface KprcResultDetail {
  result_id: string;
  t_score_extraction_status: string; // PENDING, PROCESSING, COMPLETED, FAILED, NOT_REQUESTED
  t_scores: KprcTScores | null;
  meets_voucher_criteria: boolean | null;
  voucher_criteria_details: Record<string, unknown> | null;
}

/**
 * 아동 검사 요약 응답
 * 바우처 대상 판별에 필요한 3가지 검사 결과
 */
export interface ChildAssessmentSummary {
  child_id: string;

  // 검사 완료 여부
  has_crtes_r: boolean;
  has_sdq_a: boolean;
  has_kprc: boolean;
  has_all_required: boolean;

  // 검사 결과 상세
  crtes_r: CrtesRResultDetail | null;
  sdq_a: SdqAResultDetail | null;
  kprc: KprcResultDetail | null;

  // 모든 검사 결과 목록 (참조용)
  all_assessments: Array<{
    assessment_type: string;
    session_id: string;
    result_id: string;
    total_score: number | null;
    max_score: number | null;
    scored_at: string | null;
    report_url: string | null;
    t_score_extraction_status: string | null;
    t_scores: KprcTScores | null;
    kprc_meets_voucher_criteria: boolean | null;
  }>;
}

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
  s3_report_url: string | null; // S3 영구 리포트 URL (S3 key)
  summary: KprcSummary | null; // KPRC 전문가 소견 요약 (yeirin-ai 생성)
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
  private readonly internalApiSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.serviceUrl =
      this.configService.get<string>('SOUL_E_SERVICE_URL') || 'http://localhost:8000';
    this.internalApiSecret =
      this.configService.get<string>('INTERNAL_API_SECRET') || 'yeirin-internal-secret';

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
   * 아동의 가장 최근 완료된 검사 결과 조회 (summary 포함)
   * @param childId yeirin 백엔드의 아동 ID
   * @returns 가장 최근 검사 결과 (summary 포함) 또는 null
   */
  async getLatestAssessmentResult(childId: string): Promise<SoulEAssessmentResultSummary | null> {
    this.logger.log(`Soul-E 최신 검사 결과 조회 요청 - childId: ${childId}`);

    try {
      const results = await this.getAssessmentResults(childId);

      if (results.length === 0) {
        this.logger.log(`Soul-E 검사 결과 없음 - childId: ${childId}`);
        return null;
      }

      // 가장 최근 결과 반환 (Soul-E API가 이미 최신순 정렬)
      const latestResult = results[0];

      // summary가 있는지 확인
      if (latestResult.summary) {
        this.logger.log(`Soul-E 최신 검사 결과 조회 성공 - childId: ${childId}, summary 포함`);
      } else {
        this.logger.warn(
          `Soul-E 최신 검사 결과 조회 성공 - childId: ${childId}, summary 없음 (아직 생성 중일 수 있음)`,
        );
      }

      return latestResult;
    } catch (error) {
      this.logger.error(`Soul-E 최신 검사 결과 조회 실패 - childId: ${childId}`, error);
      return null;
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

  /**
   * 아동의 검사 요약 조회 (바우처 대상 판별용)
   * Soul-E의 internal API를 호출하여 CRTES-R, SDQ-A, KPRC 검사 결과를 조회
   * @param childId yeirin 백엔드의 아동 ID
   * @returns 아동 검사 요약 (바우처 대상 판별에 필요한 정보)
   */
  async getChildAssessmentSummary(childId: string): Promise<ChildAssessmentSummary | null> {
    this.logger.log(`Soul-E 아동 검사 요약 조회 요청 - childId: ${childId}`);

    try {
      const response = await this.client.get<ChildAssessmentSummary>(
        `/api/v1/internal/children/${childId}/assessment-summary`,
        {
          headers: {
            'X-Internal-Secret': this.internalApiSecret,
          },
        },
      );

      this.logger.log(
        `Soul-E 아동 검사 요약 조회 성공 - childId: ${childId}, ` +
          `has_all_required: ${response.data.has_all_required}`,
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;

        // 404는 결과가 없는 경우 - null 반환
        if (status === 404) {
          this.logger.log(`Soul-E 아동 검사 결과 없음 - childId: ${childId}`);
          return null;
        }

        const message =
          (axiosError.response?.data as { detail?: string })?.detail ||
          axiosError.message ||
          'Soul-E service failed';

        this.logger.error(
          `Soul-E 아동 검사 요약 조회 실패 - Status: ${status}, Message: ${message}`,
        );

        throw new HttpException(
          {
            statusCode: status,
            message,
            service: 'soul-e',
          },
          status,
        );
      }

      this.logger.error(`Soul-E 아동 검사 요약 조회 예상치 못한 에러`, error);

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
   * 보호자 동의 링크 생성
   * Soul-E의 guardian consent API를 호출하여 JWT 토큰과 동의 페이지 URL을 생성
   * @param request 보호자 동의 링크 생성 요청
   * @returns 생성된 토큰 및 동의 페이지 URL
   */
  async generateGuardianConsentLink(
    request: GenerateGuardianConsentLinkRequest,
  ): Promise<GenerateGuardianConsentLinkResponse> {
    this.logger.log(
      `보호자 동의 링크 생성 요청 - childId: ${request.child_id}, childName: ${request.child_name}`,
    );

    try {
      const response = await this.client.post<GenerateGuardianConsentLinkResponse>(
        '/api/v1/consent/guardian/generate-link',
        request,
        {
          headers: {
            'X-Internal-Secret': this.internalApiSecret,
          },
        },
      );

      this.logger.log(
        `보호자 동의 링크 생성 성공 - childId: ${request.child_id}, url: ${response.data.consent_url}`,
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
        const message =
          (axiosError.response?.data as { detail?: string })?.detail ||
          axiosError.message ||
          'Soul-E service failed';

        this.logger.error(`보호자 동의 링크 생성 실패 - Status: ${status}, Message: ${message}`);

        throw new HttpException(
          {
            statusCode: status,
            message,
            service: 'soul-e',
          },
          status,
        );
      }

      this.logger.error(`보호자 동의 링크 생성 예상치 못한 에러`, error);

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
}
