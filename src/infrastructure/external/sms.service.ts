import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SolapiMessageService } from 'solapi';

/**
 * SMS 발송 결과 인터페이스
 */
export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  errorMessage?: string;
}

/**
 * SMS 발송 서비스
 * Solapi를 이용한 문자 발송
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly messageService: SolapiMessageService;
  private readonly senderNumber: string;
  private readonly isEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SOLAPI_API_KEY');
    const apiSecret = this.configService.get<string>('SOLAPI_API_SECRET');
    this.senderNumber = this.configService.get<string>('SOLAPI_SENDER_NUMBER') || '';
    this.isEnabled = this.configService.get<string>('SOLAPI_ENABLED') === 'true';

    if (apiKey && apiSecret) {
      this.messageService = new SolapiMessageService(apiKey, apiSecret);
      this.logger.log(`SMS Service initialized (enabled: ${this.isEnabled})`);
    } else {
      this.logger.warn('SMS Service not configured - SOLAPI_API_KEY or SOLAPI_API_SECRET missing');
    }
  }

  /**
   * 전화번호에서 특수문자 제거
   * @param phoneNumber 전화번호
   * @returns 숫자만 남은 전화번호
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/[^0-9]/g, '');
  }

  /**
   * SMS 발송
   * @param to 수신자 전화번호
   * @param text 메시지 내용
   * @returns 발송 결과
   */
  async sendSms(to: string, text: string): Promise<SmsSendResult> {
    if (!this.messageService) {
      this.logger.error('SMS Service not configured');
      return {
        success: false,
        errorMessage: 'SMS 서비스가 설정되지 않았습니다.',
      };
    }

    if (!this.senderNumber) {
      this.logger.error('Sender number not configured');
      return {
        success: false,
        errorMessage: '발신번호가 설정되지 않았습니다.',
      };
    }

    const normalizedTo = this.normalizePhoneNumber(to);
    const normalizedFrom = this.normalizePhoneNumber(this.senderNumber);

    // 개발 환경에서는 실제 발송하지 않음
    if (!this.isEnabled) {
      this.logger.log(
        `[DEV MODE] SMS 발송 시뮬레이션 - to: ${normalizedTo}, from: ${normalizedFrom}, text: ${text}`,
      );
      return {
        success: true,
        messageId: 'dev-mode-simulated',
      };
    }

    try {
      this.logger.log(`SMS 발송 시작 - to: ${normalizedTo}`);

      const result = await this.messageService.send({
        to: normalizedTo,
        from: normalizedFrom,
        text,
      });

      this.logger.log(`SMS 발송 성공 - to: ${normalizedTo}, result: ${JSON.stringify(result)}`);

      return {
        success: true,
        messageId: (result as { groupId?: string })?.groupId || 'sent',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`SMS 발송 실패 - to: ${normalizedTo}, error: ${errorMessage}`);

      return {
        success: false,
        errorMessage,
      };
    }
  }

  /**
   * 보호자 동의 링크 SMS 발송
   * @param to 수신자 전화번호
   * @param consentUrl 동의 페이지 URL
   * @param childName 아동 이름
   * @returns 발송 결과
   */
  async sendGuardianConsentSms(
    to: string,
    consentUrl: string,
    childName: string,
  ): Promise<SmsSendResult> {
    // SMS 본문 생성 (90자 이하 = SMS, 초과 = LMS)
    const text = `[소울이] ${childName} 아동의 보호자 동의가 필요합니다.\n${consentUrl}`;

    return this.sendSms(to, text);
  }
}
