import { Inject, Injectable } from '@nestjs/common';
import { DomainError, Result } from '@domain/common/result';
import { ChildConsent } from '@domain/consent/model/child-consent';
import { ConsentRole } from '@domain/consent/model/value-objects/consent-role';
import { ChildConsentRepository } from '@domain/consent/repository/child-consent.repository';
import { ChildConsentMapper } from '@infrastructure/persistence/typeorm/mapper/child-consent.mapper';
import { AcceptGuardianConsentDto } from '../dto/accept-guardian-consent.dto';
import { ConsentResponseDto } from '../dto/consent-response.dto';

/**
 * 보호자 동의 제출 Use Case
 *
 * @description
 * 보호자의 아동 개인정보 처리 동의를 저장합니다.
 * - role: GUARDIAN으로 저장
 * - guardianPhone, guardianRelation 필수
 * - 새 동의 생성 또는 기존 보호자 동의 업데이트
 * - 동의 이력 기록
 */
@Injectable()
export class AcceptGuardianConsentUseCase {
  constructor(
    @Inject('ChildConsentRepository')
    private readonly consentRepository: ChildConsentRepository,
  ) {}

  async execute(dto: AcceptGuardianConsentDto): Promise<Result<ConsentResponseDto, DomainError>> {
    // 1. 기존 보호자 동의 조회
    const existingConsent = await this.consentRepository.findByChildIdAndRole(
      dto.childId,
      ConsentRole.GUARDIAN,
    );

    let consent: ChildConsent;
    let action: 'CREATED' | 'UPDATED';
    let previousData: Record<string, unknown> | null = null;

    if (existingConsent) {
      // 2a. 기존 보호자 동의가 있으면 업데이트
      previousData = ChildConsentMapper.toSnapshot(existingConsent);

      // 보호자 동의 항목에 childSelfConsent: false 추가
      const consentItemsWithChildSelf = {
        ...dto.consentItems,
        childSelfConsent: false,
      };

      const updateResult = existingConsent.updateConsent(
        consentItemsWithChildSelf,
        false, // 보호자 동의는 14세 이상 여부 불필요
        dto.ipAddress,
      );

      if (updateResult.isFailure) {
        return Result.fail(updateResult.getError());
      }

      consent = existingConsent;
      action = 'UPDATED';
    } else {
      // 2b. 새 보호자 동의 생성
      const createResult = ChildConsent.createGuardianConsent({
        childId: dto.childId,
        consentItems: dto.consentItems,
        guardianPhone: dto.guardianPhone,
        guardianRelation: dto.guardianRelation,
        documentUrl: dto.documentUrl,
        ipAddress: dto.ipAddress,
      });

      if (createResult.isFailure) {
        return Result.fail(createResult.getError());
      }

      consent = createResult.getValue();
      action = 'CREATED';
    }

    // 3. 동의 저장
    const savedConsent = await this.consentRepository.save(consent);

    // 4. 이력 저장
    await this.consentRepository.saveHistory({
      consentId: savedConsent.id,
      childId: savedConsent.childId,
      action,
      previousData,
      newData: ChildConsentMapper.toSnapshot(savedConsent),
      ipAddress: dto.ipAddress ?? null,
    });

    // 5. 응답 DTO 반환
    return Result.ok(this.toResponseDto(savedConsent));
  }

  private toResponseDto(consent: ChildConsent): ConsentResponseDto {
    return {
      id: consent.id,
      childId: consent.childId,
      consentItems: consent.consentItems.value,
      consentVersion: consent.consentVersion.value,
      documentUrl: consent.documentUrl,
      hasValidConsent: consent.isValid(),
      consentedAt: consent.consentedAt,
      revokedAt: consent.revokedAt,
      revocationReason: consent.revocationReason,
      createdAt: consent.createdAt,
      updatedAt: consent.updatedAt,
    };
  }
}
