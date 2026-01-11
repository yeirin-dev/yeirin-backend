/**
 * Soul-E 클라이언트 Mock
 *
 * 동의 URL 생성, 심리상태 업데이트 등 Soul-E 클라이언트 통신 Mock
 */

/**
 * 동의 URL 응답 인터페이스
 */
export interface ConsentUrlResponse {
  url: string;
  token: string;
  expiresAt: Date;
  childId: string;
}

/**
 * 심리상태 업데이트 요청 인터페이스
 */
export interface PsychologicalStatusUpdate {
  childId: string;
  status: 'STABLE' | 'AT_RISK' | 'HIGH_RISK';
  assessmentId?: string;
  summary?: string;
  indicators?: string[];
  updatedAt: Date;
}

/**
 * Webhook 요청 인터페이스
 */
export interface WebhookRequest {
  type: 'CONSENT_URL' | 'PSYCHOLOGICAL_STATUS' | 'SESSION_COMPLETE';
  payload: unknown;
  timestamp: Date;
  signature?: string;
}

/**
 * 세션 완료 알림 인터페이스
 */
export interface SessionCompleteNotification {
  sessionId: string;
  childId: string;
  duration: number;
  summary: string;
  nextSessionRecommended: boolean;
  completedAt: Date;
}

/**
 * Soul-E Mock 서비스
 */
export class SoulEMock {
  private generatedUrls: ConsentUrlResponse[] = [];
  private statusUpdates: PsychologicalStatusUpdate[] = [];
  private webhookRequests: WebhookRequest[] = [];
  private sessionNotifications: SessionCompleteNotification[] = [];
  private shouldFail = false;
  private failOnChildId: string | null = null;
  private customUrlBase = 'https://soul-e.test.yeirin.com';
  private callCount = 0;

  /**
   * 보호자 동의 URL 생성 Mock
   */
  async generateConsentUrl(
    childId: string,
    options?: {
      expiresInMinutes?: number;
      returnUrl?: string;
    },
  ): Promise<ConsentUrlResponse> {
    this.callCount++;

    if (this.shouldFail || this.failOnChildId === childId) {
      throw new Error('Soul-E 동의 URL 생성 실패');
    }

    const token = this.generateToken();
    const expiresInMinutes = options?.expiresInMinutes || 30;

    const response: ConsentUrlResponse = {
      url: `${this.customUrlBase}/consent/${token}`,
      token,
      expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
      childId,
    };

    this.generatedUrls.push(response);
    return response;
  }

  /**
   * 심리상태 업데이트 수신 Mock (Webhook 시뮬레이션)
   */
  async receivePsychologicalStatus(
    update: Omit<PsychologicalStatusUpdate, 'updatedAt'>,
  ): Promise<{ acknowledged: boolean; updateId: string }> {
    this.callCount++;

    if (this.shouldFail) {
      throw new Error('심리상태 업데이트 수신 실패');
    }

    const fullUpdate: PsychologicalStatusUpdate = {
      ...update,
      updatedAt: new Date(),
    };

    this.statusUpdates.push(fullUpdate);

    this.webhookRequests.push({
      type: 'PSYCHOLOGICAL_STATUS',
      payload: fullUpdate,
      timestamp: new Date(),
      signature: this.generateSignature(fullUpdate),
    });

    return {
      acknowledged: true,
      updateId: `update-${Date.now()}`,
    };
  }

  /**
   * 세션 완료 알림 수신 Mock
   */
  async receiveSessionComplete(
    notification: Omit<SessionCompleteNotification, 'completedAt'>,
  ): Promise<{ acknowledged: boolean }> {
    this.callCount++;

    if (this.shouldFail) {
      throw new Error('세션 완료 알림 수신 실패');
    }

    const fullNotification: SessionCompleteNotification = {
      ...notification,
      completedAt: new Date(),
    };

    this.sessionNotifications.push(fullNotification);

    this.webhookRequests.push({
      type: 'SESSION_COMPLETE',
      payload: fullNotification,
      timestamp: new Date(),
      signature: this.generateSignature(fullNotification),
    });

    return { acknowledged: true };
  }

  /**
   * Webhook 서명 검증 Mock
   */
  verifyWebhookSignature(payload: unknown, signature: string): boolean {
    // 테스트용 단순 검증: 'valid-' 접두사가 있으면 유효
    return signature.startsWith('valid-');
  }

  /**
   * 실패 설정
   */
  setFail(shouldFail: boolean): this {
    this.shouldFail = shouldFail;
    return this;
  }

  /**
   * 특정 아동 ID에서만 실패하도록 설정
   */
  setFailOnChildId(childId: string | null): this {
    this.failOnChildId = childId;
    return this;
  }

  /**
   * URL 베이스 설정
   */
  setUrlBase(baseUrl: string): this {
    this.customUrlBase = baseUrl;
    return this;
  }

  /**
   * 생성된 동의 URL 목록 조회
   */
  getGeneratedUrls(): ConsentUrlResponse[] {
    return [...this.generatedUrls];
  }

  /**
   * 특정 아동의 동의 URL 조회
   */
  getUrlsForChild(childId: string): ConsentUrlResponse[] {
    return this.generatedUrls.filter((u) => u.childId === childId);
  }

  /**
   * 마지막 생성된 동의 URL 조회
   */
  getLastGeneratedUrl(): ConsentUrlResponse | undefined {
    return this.generatedUrls[this.generatedUrls.length - 1];
  }

  /**
   * 심리상태 업데이트 목록 조회
   */
  getStatusUpdates(): PsychologicalStatusUpdate[] {
    return [...this.statusUpdates];
  }

  /**
   * 특정 아동의 심리상태 업데이트 조회
   */
  getStatusUpdatesForChild(childId: string): PsychologicalStatusUpdate[] {
    return this.statusUpdates.filter((u) => u.childId === childId);
  }

  /**
   * 마지막 심리상태 업데이트 조회
   */
  getLastStatusUpdate(): PsychologicalStatusUpdate | undefined {
    return this.statusUpdates[this.statusUpdates.length - 1];
  }

  /**
   * Webhook 요청 목록 조회
   */
  getWebhookRequests(): WebhookRequest[] {
    return [...this.webhookRequests];
  }

  /**
   * 특정 타입의 Webhook 요청 조회
   */
  getWebhookRequestsByType(type: WebhookRequest['type']): WebhookRequest[] {
    return this.webhookRequests.filter((r) => r.type === type);
  }

  /**
   * 세션 완료 알림 목록 조회
   */
  getSessionNotifications(): SessionCompleteNotification[] {
    return [...this.sessionNotifications];
  }

  /**
   * 호출 횟수 조회
   */
  getCallCount(): number {
    return this.callCount;
  }

  /**
   * Mock 상태 리셋
   */
  reset(): void {
    this.generatedUrls = [];
    this.statusUpdates = [];
    this.webhookRequests = [];
    this.sessionNotifications = [];
    this.shouldFail = false;
    this.failOnChildId = null;
    this.customUrlBase = 'https://soul-e.test.yeirin.com';
    this.callCount = 0;
  }

  /**
   * 토큰 생성 헬퍼
   */
  private generateToken(): string {
    return `consent-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 서명 생성 헬퍼
   */
  private generateSignature(payload: unknown): string {
    // 테스트용 단순 서명
    return `valid-${Buffer.from(JSON.stringify(payload)).toString('base64').substring(0, 32)}`;
  }
}

/**
 * 전역 Mock 인스턴스
 */
export const soulEMock = new SoulEMock();

/**
 * Jest Mock Factory
 */
export function createSoulEMock() {
  return {
    generateConsentUrl: jest
      .fn()
      .mockImplementation((childId: string, options?: { expiresInMinutes?: number }) =>
        soulEMock.generateConsentUrl(childId, options),
      ),
    receivePsychologicalStatus: jest
      .fn()
      .mockImplementation((update: Omit<PsychologicalStatusUpdate, 'updatedAt'>) =>
        soulEMock.receivePsychologicalStatus(update),
      ),
    receiveSessionComplete: jest
      .fn()
      .mockImplementation((notification: Omit<SessionCompleteNotification, 'completedAt'>) =>
        soulEMock.receiveSessionComplete(notification),
      ),
    verifyWebhookSignature: jest
      .fn()
      .mockImplementation((payload: unknown, signature: string) =>
        soulEMock.verifyWebhookSignature(payload, signature),
      ),
  };
}

/**
 * NestJS Provider Mock
 */
export const SoulEMockProvider = {
  provide: 'SoulEClient',
  useValue: createSoulEMock(),
};

/**
 * Webhook 페이로드 픽스처
 */
export const webhookPayloadFixtures = {
  /**
   * 유효한 심리상태 업데이트 (안정)
   */
  stableStatus: {
    childId: 'child-cf-001',
    status: 'STABLE' as const,
    assessmentId: 'assessment-001',
    summary: '정서적으로 안정된 상태입니다.',
    indicators: ['긍정적 자아상', '또래관계 양호'],
  },

  /**
   * 위험 상태 업데이트
   */
  atRiskStatus: {
    childId: 'child-cf-002',
    status: 'AT_RISK' as const,
    assessmentId: 'assessment-002',
    summary: '경미한 불안 증상이 관찰됩니다.',
    indicators: ['수면 패턴 변화', '사회적 위축'],
  },

  /**
   * 고위험 상태 업데이트
   */
  highRiskStatus: {
    childId: 'child-cf-003',
    status: 'HIGH_RISK' as const,
    assessmentId: 'assessment-003',
    summary: '즉각적인 전문 상담이 필요합니다.',
    indicators: ['자해 관련 언급', '심한 우울 증상', '사회적 고립'],
  },

  /**
   * 세션 완료 알림
   */
  sessionComplete: {
    sessionId: 'session-001',
    childId: 'child-cf-001',
    duration: 1800, // 30분 (초)
    summary: '아동이 긍정적으로 참여했습니다.',
    nextSessionRecommended: true,
  },

  /**
   * 잘못된 형식의 페이로드
   */
  invalidPayload: {
    childId: '', // 빈 문자열
    status: 'INVALID_STATUS',
  },

  /**
   * 존재하지 않는 아동
   */
  nonExistentChild: {
    childId: 'non-existent-child-id',
    status: 'STABLE' as const,
    assessmentId: 'assessment-999',
  },
};

/**
 * Webhook 헤더 픽스처
 */
export const webhookHeaderFixtures = {
  /**
   * 유효한 서명
   */
  validSignature: {
    'x-webhook-signature': 'valid-mock-signature-12345',
    'content-type': 'application/json',
  },

  /**
   * 잘못된 서명
   */
  invalidSignature: {
    'x-webhook-signature': 'invalid-signature',
    'content-type': 'application/json',
  },

  /**
   * 서명 누락
   */
  missingSignature: {
    'content-type': 'application/json',
  },
};

/**
 * 동의 URL 검증 헬퍼
 */
export function isValidConsentUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.pathname.startsWith('/consent/') && parsed.pathname.length > 10;
  } catch {
    return false;
  }
}

/**
 * 토큰 만료 여부 확인 헬퍼
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}
