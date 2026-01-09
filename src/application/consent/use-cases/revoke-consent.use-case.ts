import { Inject, Injectable } from '@nestjs/common';
import { DomainError, Result } from '@domain/common/result';
import { ChildConsentRepository } from '@domain/consent/repository/child-consent.repository';
import { ChildConsentMapper } from '@infrastructure/persistence/typeorm/mapper/child-consent.mapper';
import { ConsentResponseDto } from '../dto/consent-response.dto';
import { RevokeConsentDto } from '../dto/revoke-consent.dto';

/**
 * 동의 철회 Use Case
 *
 * @description
 * 아동의 개인정보 처리 동의를 철회합니다.
 * - 철회 사유 필수
 * - 철회 이력 기록
 */
@Injectable()
export class RevokeConsentUseCase {
  constructor(
    @Inject('ChildConsentRepository')
    private readonly consentRepository: ChildConsentRepository,
  ) {}

  async execute(
    childId: string,
    dto: RevokeConsentDto,
  ): Promise<Result<ConsentResponseDto, DomainError>> {
    // 1. 기존 동의 조회
    const consent = await this.consentRepository.findByChildId(childId);

    if (!consent) {
      return Result.fail(new DomainError('동의 정보를 찾을 수 없습니다.', 'CONSENT_NOT_FOUND'));
    }

    // 2. 이전 상태 저장 (이력용)
    const previousData = ChildConsentMapper.toSnapshot(consent);

    // 3. 동의 철회
    const revokeResult = consent.revoke(dto.reason);

    if (revokeResult.isFailure) {
      return Result.fail(revokeResult.getError());
    }

    // 4. 저장
    const savedConsent = await this.consentRepository.save(consent);

    // 5. 이력 저장
    await this.consentRepository.saveHistory({
      consentId: savedConsent.id,
      childId: savedConsent.childId,
      action: 'REVOKED',
      previousData,
      newData: ChildConsentMapper.toSnapshot(savedConsent),
      ipAddress: dto.ipAddress ?? null,
    });

    // 6. 응답 반환
    return Result.ok({
      id: savedConsent.id,
      childId: savedConsent.childId,
      consentItems: savedConsent.consentItems.value,
      consentVersion: savedConsent.consentVersion.value,
      documentUrl: savedConsent.documentUrl,
      hasValidConsent: savedConsent.isValid(),
      consentedAt: savedConsent.consentedAt,
      revokedAt: savedConsent.revokedAt,
      revocationReason: savedConsent.revocationReason,
      createdAt: savedConsent.createdAt,
      updatedAt: savedConsent.updatedAt,
    });
  }
}
