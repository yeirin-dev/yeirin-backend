import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SolapiMessageService } from 'solapi';
import * as path from 'path';
import * as fs from 'fs';

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
 * Solapi를 이용한 문자 발송 (SMS/LMS/MMS)
 */
@Injectable()
export class SmsService implements OnModuleInit {
  private readonly logger = new Logger(SmsService.name);
  private readonly messageService: SolapiMessageService;
  private readonly senderNumber: string;
  private readonly isEnabled: boolean;
  private guardianConsentImageId: string | null = null;

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
   * 모듈 초기화 시 MMS 이미지 업로드
   */
  async onModuleInit() {
    if (this.messageService && this.isEnabled) {
      await this.uploadGuardianConsentImage();
    }
  }

  /**
   * 보호자 동의 MMS용 이미지 업로드
   * MMS 이미지는 200KB 이내의 JPG 파일만 가능
   */
  private async uploadGuardianConsentImage(): Promise<void> {
    const imagePath = path.join(__dirname, '../../assets/mms/guardian-consent.jpg');

    if (!fs.existsSync(imagePath)) {
      this.logger.warn(
        `MMS 이미지 파일이 없습니다: ${imagePath}. LMS로 발송됩니다.`,
      );
      return;
    }

    try {
      const result = await this.messageService.uploadFile(imagePath, 'MMS');
      this.guardianConsentImageId = (result as { fileId?: string })?.fileId || null;
      this.logger.log(`MMS 이미지 업로드 완료 - imageId: ${this.guardianConsentImageId}`);
    } catch (error) {
      this.logger.error(`MMS 이미지 업로드 실패: ${error}`);
      this.guardianConsentImageId = null;
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
      // 메시지 길이에 따라 SMS/LMS 자동 결정 (한글 90바이트 = 약 45자)
      const byteLength = Buffer.byteLength(text, 'utf8');
      const messageType = byteLength > 90 ? 'LMS' : 'SMS';

      this.logger.log(
        `${messageType} 발송 시작 - to: ${normalizedTo}, byteLength: ${byteLength}`,
      );

      const result = await this.messageService.send({
        to: normalizedTo,
        from: normalizedFrom,
        text,
        type: messageType,
      });

      this.logger.log(
        `${messageType} 발송 성공 - to: ${normalizedTo}, result: ${JSON.stringify(result)}`,
      );

      return {
        success: true,
        messageId: (result as { groupId?: string })?.groupId || 'sent',
      };
    } catch (error: unknown) {
      // 항상 전체 에러 객체 로깅 (디버깅용)
      this.logger.error(
        `SMS 발송 실패 전체 에러 - to: ${normalizedTo}, error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`,
      );

      // Solapi SDK 에러는 다양한 형태로 올 수 있음
      let errorMessage = 'Unknown error';

      if (error instanceof Error) {
        errorMessage = error.message;
        // Error 객체의 추가 속성 확인 (Solapi 에러는 추가 속성을 가질 수 있음)
        const errAny = error as Error & Record<string, unknown>;
        if (errAny.errorCode) {
          errorMessage = `[${errAny.errorCode}] ${error.message}`;
        }
        if (errAny.statusCode) {
          errorMessage = `(${errAny.statusCode}) ${errorMessage}`;
        }
      } else if (typeof error === 'object' && error !== null) {
        const errObj = error as Record<string, unknown>;
        if (errObj.message) {
          errorMessage = String(errObj.message);
        } else if (errObj.errorMessage) {
          errorMessage = String(errObj.errorMessage);
        } else if (errObj.error) {
          errorMessage = String(errObj.error);
        }
      }

      this.logger.error(`SMS 발송 실패 - to: ${normalizedTo}, error: ${errorMessage}`);

      return {
        success: false,
        errorMessage,
      };
    }
  }

  /**
   * 보호자 동의 링크 MMS/LMS 발송
   * 이미지가 업로드되어 있으면 MMS, 없으면 LMS로 발송
   * @param to 수신자 전화번호
   * @param consentUrl 동의 페이지 URL
   * @param childName 아동 이름 (현재 미사용, 향후 확장용)
   * @returns 발송 결과
   */
  async sendGuardianConsentSms(
    to: string,
    consentUrl: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    childName: string,
  ): Promise<SmsSendResult> {
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

    // MMS/LMS 본문 생성
    const text = `안녕하세요? 예이린 사회적협동조합입니다.
예이린은 부산사회서비스원과 함께 2026년 「AI와 함께하는 마음건강+ : 연계로 완성하는 통합 돌봄」 사업을 운영합니다.

본 사업은 AI 기반 아동 마음건강 지원 서비스 '내 친구 소울이'를 활용하여,
✔ 자녀의 정서·심리 상태를 간편하게 확인하고
✔ 필요 시 인근 상담·치료 등 바우처 서비스로 연계하는 통합 돌봄 사업입니다.

서비스 이용을 위해서는 학부모님의 사전 동의가 필요하여,
아래 링크를 통해 동의서 제출을 부탁드립니다.

▶ 동의서 제출 링크: ${consentUrl}

자녀의 마음건강을 함께 살피는 이번 사업에 많은 관심과 협조를 부탁드립니다.
감사합니다.

예이린 사회적협동조합 드림`;

    // 개발 환경에서는 실제 발송하지 않음
    if (!this.isEnabled) {
      const messageType = this.guardianConsentImageId ? 'MMS' : 'LMS';
      this.logger.log(
        `[DEV MODE] ${messageType} 발송 시뮬레이션 - to: ${normalizedTo}, from: ${normalizedFrom}, imageId: ${this.guardianConsentImageId}`,
      );
      return {
        success: true,
        messageId: 'dev-mode-simulated',
      };
    }

    try {
      // 이미지가 있으면 MMS, 없으면 LMS로 발송
      if (this.guardianConsentImageId) {
        this.logger.log(
          `MMS 발송 시작 - to: ${normalizedTo}, imageId: ${this.guardianConsentImageId}`,
        );

        const result = await this.messageService.send({
          to: normalizedTo,
          from: normalizedFrom,
          text,
          type: 'MMS',
          subject: '[예이린] 보호자 동의서 제출 안내',
          imageId: this.guardianConsentImageId,
        });

        this.logger.log(
          `MMS 발송 성공 - to: ${normalizedTo}, result: ${JSON.stringify(result)}`,
        );

        return {
          success: true,
          messageId: (result as { groupId?: string })?.groupId || 'sent',
        };
      } else {
        // 이미지 없으면 LMS로 발송
        this.logger.log(`LMS 발송 시작 (이미지 없음) - to: ${normalizedTo}`);
        return this.sendSms(to, text);
      }
    } catch (error: unknown) {
      this.logger.error(
        `MMS/LMS 발송 실패 전체 에러 - to: ${normalizedTo}, error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`,
      );

      let errorMessage = 'Unknown error';

      if (error instanceof Error) {
        errorMessage = error.message;
        const errAny = error as Error & Record<string, unknown>;
        if (errAny.errorCode) {
          errorMessage = `[${errAny.errorCode}] ${error.message}`;
        }
        if (errAny.statusCode) {
          errorMessage = `(${errAny.statusCode}) ${errorMessage}`;
        }
      } else if (typeof error === 'object' && error !== null) {
        const errObj = error as Record<string, unknown>;
        if (errObj.message) {
          errorMessage = String(errObj.message);
        } else if (errObj.errorMessage) {
          errorMessage = String(errObj.errorMessage);
        } else if (errObj.error) {
          errorMessage = String(errObj.error);
        }
      }

      this.logger.error(`MMS/LMS 발송 실패 - to: ${normalizedTo}, error: ${errorMessage}`);

      return {
        success: false,
        errorMessage,
      };
    }
  }
}
