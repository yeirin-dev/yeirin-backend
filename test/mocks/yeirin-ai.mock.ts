/**
 * Yeirin-AI 추천 서비스 Mock
 *
 * 실제 AI 추천 서비스 대신 테스트용 응답 반환
 */

/**
 * AI 추천 기관 응답 인터페이스
 */
export interface AiRecommendation {
  institutionId: string;
  institutionName: string;
  score: number;
  matchReasons: string[];
  specialties: string[];
  distance?: number;
}

/**
 * AI 추천 응답 인터페이스
 */
export interface AiRecommendationResponse {
  success: boolean;
  recommendations: AiRecommendation[];
  analysisId?: string;
  processingTime?: number;
}

/**
 * Mock 추천 기관 데이터
 */
export const mockRecommendations: AiRecommendation[] = [
  {
    institutionId: 'institution-uuid-001',
    institutionName: '마음치유 상담센터',
    score: 95,
    matchReasons: ['아동 심리 전문', '트라우마 치료 경험', '지역 접근성 우수'],
    specialties: ['아동상담', '놀이치료', 'PTSD'],
    distance: 2.5,
  },
  {
    institutionId: 'institution-uuid-002',
    institutionName: '행복나눔 심리상담소',
    score: 88,
    matchReasons: ['학교적응 문제 전문', '또래관계 상담 경험'],
    specialties: ['학교상담', '사회성발달', '정서조절'],
    distance: 3.8,
  },
  {
    institutionId: 'institution-uuid-003',
    institutionName: '희망의 빛 상담센터',
    score: 82,
    matchReasons: ['우울증 상담 전문', '청소년 상담 경력'],
    specialties: ['청소년상담', '우울증', '불안장애'],
    distance: 5.2,
  },
  {
    institutionId: 'institution-uuid-004',
    institutionName: '새싹 심리발달센터',
    score: 78,
    matchReasons: ['발달장애 전문', '가족상담 제공'],
    specialties: ['발달상담', '가족치료', '부모교육'],
    distance: 4.1,
  },
  {
    institutionId: 'institution-uuid-005',
    institutionName: '푸른하늘 상담원',
    score: 72,
    matchReasons: ['위기개입 전문', '24시간 상담 가능'],
    specialties: ['위기상담', '자살예방', '긴급개입'],
    distance: 6.0,
  },
];

/**
 * Yeirin-AI Mock 서비스
 */
export class YeirinAiMock {
  private shouldFail = false;
  private customResponse: AiRecommendationResponse | null = null;
  private delay = 0;
  private callCount = 0;
  private lastRequestPayload: unknown = null;

  /**
   * 추천 요청 Mock
   */
  async requestRecommendation(
    counselRequestText: string,
    options?: {
      maxRecommendations?: number;
      minScore?: number;
    },
  ): Promise<AiRecommendationResponse> {
    this.callCount++;
    this.lastRequestPayload = { counselRequestText, options };

    // 인위적 지연
    if (this.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delay));
    }

    // 실패 시뮬레이션
    if (this.shouldFail) {
      throw new Error('AI 추천 서비스 연결 실패');
    }

    // 커스텀 응답
    if (this.customResponse) {
      return this.customResponse;
    }

    // 기본 성공 응답
    let recommendations = [...mockRecommendations];

    // 최대 개수 제한
    if (options?.maxRecommendations) {
      recommendations = recommendations.slice(0, options.maxRecommendations);
    }

    // 최소 점수 필터
    if (options?.minScore) {
      recommendations = recommendations.filter((r) => r.score >= options.minScore!);
    }

    return {
      success: true,
      recommendations,
      analysisId: `analysis-${Date.now()}`,
      processingTime: Math.random() * 1000 + 500, // 500-1500ms
    };
  }

  /**
   * 실패 설정
   */
  setFail(shouldFail: boolean): this {
    this.shouldFail = shouldFail;
    return this;
  }

  /**
   * 커스텀 응답 설정
   */
  setResponse(response: AiRecommendationResponse): this {
    this.customResponse = response;
    return this;
  }

  /**
   * 빈 추천 응답 설정
   */
  setEmptyResponse(): this {
    this.customResponse = {
      success: true,
      recommendations: [],
      analysisId: `analysis-empty-${Date.now()}`,
    };
    return this;
  }

  /**
   * 지연 설정 (ms)
   */
  setDelay(ms: number): this {
    this.delay = ms;
    return this;
  }

  /**
   * 호출 횟수 조회
   */
  getCallCount(): number {
    return this.callCount;
  }

  /**
   * 마지막 요청 페이로드 조회
   */
  getLastRequestPayload(): unknown {
    return this.lastRequestPayload;
  }

  /**
   * Mock 상태 리셋
   */
  reset(): void {
    this.shouldFail = false;
    this.customResponse = null;
    this.delay = 0;
    this.callCount = 0;
    this.lastRequestPayload = null;
  }
}

/**
 * 전역 Mock 인스턴스
 */
export const yeirinAiMock = new YeirinAiMock();

/**
 * Jest Mock Factory
 *
 * 사용 예시:
 * ```typescript
 * jest.mock('@infrastructure/external/yeirin-ai', () => ({
 *   YeirinAiService: jest.fn().mockImplementation(() => createYeirinAiMock()),
 * }));
 * ```
 */
export function createYeirinAiMock() {
  return {
    requestRecommendation: jest
      .fn()
      .mockImplementation((text: string, options?: { maxRecommendations?: number }) =>
        yeirinAiMock.requestRecommendation(text, options),
      ),
  };
}

/**
 * NestJS Provider Mock
 *
 * 사용 예시:
 * ```typescript
 * const module = await Test.createTestingModule({
 *   providers: [
 *     YeirinAiMockProvider,
 *   ],
 * }).compile();
 * ```
 */
export const YeirinAiMockProvider = {
  provide: 'YeirinAiService',
  useValue: {
    requestRecommendation: (text: string, options?: { maxRecommendations?: number }) =>
      yeirinAiMock.requestRecommendation(text, options),
  },
};

/**
 * 특정 케이스용 Mock 응답 생성 헬퍼
 */
export const mockResponseFactories = {
  /**
   * 성공 응답 (기본 5개)
   */
  success: (count = 5): AiRecommendationResponse => ({
    success: true,
    recommendations: mockRecommendations.slice(0, count),
    analysisId: `analysis-success-${Date.now()}`,
    processingTime: 800,
  }),

  /**
   * 빈 응답
   */
  empty: (): AiRecommendationResponse => ({
    success: true,
    recommendations: [],
    analysisId: `analysis-empty-${Date.now()}`,
    processingTime: 500,
  }),

  /**
   * 단일 추천
   */
  single: (): AiRecommendationResponse => ({
    success: true,
    recommendations: [mockRecommendations[0]],
    analysisId: `analysis-single-${Date.now()}`,
    processingTime: 600,
  }),

  /**
   * 고득점만
   */
  highScoreOnly: (minScore = 85): AiRecommendationResponse => ({
    success: true,
    recommendations: mockRecommendations.filter((r) => r.score >= minScore),
    analysisId: `analysis-high-${Date.now()}`,
    processingTime: 700,
  }),
};
