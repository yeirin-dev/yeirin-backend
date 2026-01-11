/**
 * SMS 발송 서비스 Mock
 *
 * 실제 SMS 발송 대신 테스트용 기록 저장
 */

/**
 * SMS 메시지 인터페이스
 */
export interface SmsMessage {
  id: string;
  to: string;
  content: string;
  sentAt: Date;
  status: 'pending' | 'sent' | 'failed';
  templateType?: string;
  metadata?: Record<string, string>;
}

/**
 * SMS 발송 결과 인터페이스
 */
export interface SmsSendResult {
  success: boolean;
  messageId: string;
  to: string;
  sentAt: Date;
  error?: string;
}

/**
 * SMS Mock 서비스
 */
export class SmsMock {
  private messages: SmsMessage[] = [];
  private shouldFail = false;
  private failForNumbers: Set<string> = new Set();
  private callCount = 0;

  /**
   * SMS 발송 Mock
   */
  async send(
    to: string,
    content: string,
    options?: {
      templateType?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<SmsSendResult> {
    this.callCount++;

    // 특정 번호 실패 시뮬레이션
    if (this.shouldFail || this.failForNumbers.has(to)) {
      const failedMessage: SmsMessage = {
        id: this.generateMessageId(),
        to,
        content,
        sentAt: new Date(),
        status: 'failed',
        templateType: options?.templateType,
        metadata: options?.metadata,
      };
      this.messages.push(failedMessage);

      return {
        success: false,
        messageId: failedMessage.id,
        to,
        sentAt: failedMessage.sentAt,
        error: 'SMS 발송 실패',
      };
    }

    // 성공 케이스
    const message: SmsMessage = {
      id: this.generateMessageId(),
      to,
      content,
      sentAt: new Date(),
      status: 'sent',
      templateType: options?.templateType,
      metadata: options?.metadata,
    };
    this.messages.push(message);

    return {
      success: true,
      messageId: message.id,
      to,
      sentAt: message.sentAt,
    };
  }

  /**
   * 보호자 동의 URL SMS 발송
   */
  async sendGuardianConsentSms(
    to: string,
    childName: string,
    consentUrl: string,
    expiresInMinutes = 30,
  ): Promise<SmsSendResult> {
    const content = `[Soul-E 심리상담] ${childName} 아동의 보호자 동의가 필요합니다.

동의 페이지: ${consentUrl}

본 링크는 ${expiresInMinutes}분간 유효합니다.
동의하시면 아동이 AI 심리상담 서비스를 이용할 수 있습니다.`;

    return this.send(to, content, {
      templateType: 'GUARDIAN_CONSENT',
      metadata: {
        childName,
        consentUrl,
        expiresInMinutes: String(expiresInMinutes),
      },
    });
  }

  /**
   * 위험 상태 알림 SMS 발송
   */
  async sendRiskAlertSms(
    to: string,
    childName: string,
    riskLevel: 'AT_RISK' | 'HIGH_RISK',
  ): Promise<SmsSendResult> {
    const levelText = riskLevel === 'HIGH_RISK' ? '고위험' : '위험';
    const content = `[Soul-E 긴급알림] ${childName} 아동의 심리상태가 ${levelText}으로 감지되었습니다.

빠른 시일 내 전문 상담을 권장드립니다.
yeirin-guardian 앱에서 상담의뢰지를 작성해주세요.`;

    return this.send(to, content, {
      templateType: 'RISK_ALERT',
      metadata: {
        childName,
        riskLevel,
      },
    });
  }

  /**
   * 실패 설정
   */
  setFail(shouldFail: boolean): this {
    this.shouldFail = shouldFail;
    return this;
  }

  /**
   * 특정 번호 실패 설정
   */
  setFailForNumber(phoneNumber: string): this {
    this.failForNumbers.add(phoneNumber);
    return this;
  }

  /**
   * 특정 번호 실패 해제
   */
  clearFailForNumber(phoneNumber: string): this {
    this.failForNumbers.delete(phoneNumber);
    return this;
  }

  /**
   * 발송된 메시지 조회
   */
  getMessages(): SmsMessage[] {
    return [...this.messages];
  }

  /**
   * 특정 번호로 발송된 메시지 조회
   */
  getMessagesTo(phoneNumber: string): SmsMessage[] {
    return this.messages.filter((m) => m.to === phoneNumber);
  }

  /**
   * 특정 템플릿으로 발송된 메시지 조회
   */
  getMessagesByTemplate(templateType: string): SmsMessage[] {
    return this.messages.filter((m) => m.templateType === templateType);
  }

  /**
   * 마지막 발송 메시지 조회
   */
  getLastMessage(): SmsMessage | undefined {
    return this.messages[this.messages.length - 1];
  }

  /**
   * 호출 횟수 조회
   */
  getCallCount(): number {
    return this.callCount;
  }

  /**
   * 성공 발송 횟수 조회
   */
  getSuccessCount(): number {
    return this.messages.filter((m) => m.status === 'sent').length;
  }

  /**
   * 실패 발송 횟수 조회
   */
  getFailCount(): number {
    return this.messages.filter((m) => m.status === 'failed').length;
  }

  /**
   * Mock 상태 리셋
   */
  reset(): void {
    this.messages = [];
    this.shouldFail = false;
    this.failForNumbers.clear();
    this.callCount = 0;
  }

  /**
   * 메시지 ID 생성
   */
  private generateMessageId(): string {
    return `sms-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * 전역 Mock 인스턴스
 */
export const smsMock = new SmsMock();

/**
 * Jest Mock Factory
 */
export function createSmsMock() {
  return {
    send: jest.fn().mockImplementation((to: string, content: string, options?: unknown) =>
      smsMock.send(to, content, options as { templateType?: string; metadata?: Record<string, string> }),
    ),
    sendGuardianConsentSms: jest.fn().mockImplementation(
      (to: string, childName: string, consentUrl: string, expires?: number) =>
        smsMock.sendGuardianConsentSms(to, childName, consentUrl, expires),
    ),
    sendRiskAlertSms: jest.fn().mockImplementation(
      (to: string, childName: string, riskLevel: 'AT_RISK' | 'HIGH_RISK') =>
        smsMock.sendRiskAlertSms(to, childName, riskLevel),
    ),
  };
}

/**
 * NestJS Provider Mock
 */
export const SmsMockProvider = {
  provide: 'SmsService',
  useValue: createSmsMock(),
};

/**
 * 전화번호 픽스처
 */
export const phoneNumberFixtures = {
  valid: '010-1234-5678',
  validAlternate: '010-9876-5432',
  invalid: '0101234', // 잘못된 형식
  international: '+82-10-1234-5678',
};

/**
 * 전화번호 정규화 헬퍼
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '').replace(/^82/, '0');
}

/**
 * 전화번호 유효성 검증
 */
export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return /^01[0-9]{8,9}$/.test(normalized);
}
