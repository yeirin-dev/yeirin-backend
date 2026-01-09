import { Inject, Injectable } from '@nestjs/common';
import { DomainError, Result } from '@domain/common/result';
import { ChildConsentRepository } from '@domain/consent/repository/child-consent.repository';
import { ConsentStatusResponseDto } from '../dto/consent-response.dto';

/**
 * 동의 상태 조회 Use Case
 *
 * @description
 * 아동의 개인정보 처리 동의 상태를 조회합니다.
 */
@Injectable()
export class GetConsentStatusUseCase {
  constructor(
    @Inject('ChildConsentRepository')
    private readonly consentRepository: ChildConsentRepository,
  ) {}

  async execute(childId: string): Promise<Result<ConsentStatusResponseDto, DomainError>> {
    const consent = await this.consentRepository.findByChildId(childId);

    if (!consent) {
      // 동의가 없는 경우
      return Result.ok({
        hasConsent: false,
        consentItems: null,
        consentVersion: null,
        consentedAt: null,
        isValid: false,
      });
    }

    // 동의가 있는 경우
    return Result.ok({
      hasConsent: true,
      consentItems: consent.consentItems.value,
      consentVersion: consent.consentVersion.value,
      consentedAt: consent.consentedAt,
      isValid: consent.isValid(),
    });
  }
}
