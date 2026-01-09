import { ChildConsent } from '@domain/consent/model/child-consent';
import { ConsentItems } from '@domain/consent/model/value-objects/consent-items.vo';
import { ConsentVersion } from '@domain/consent/model/value-objects/consent-version.vo';
import { ChildConsentEntity } from '../entity/child-consent.entity';

/**
 * ChildConsent Domain ↔ ChildConsentEntity 변환
 * Anti-Corruption Layer (ACL)
 */
export class ChildConsentMapper {
  /**
   * Entity → Domain
   */
  public static toDomain(entity: ChildConsentEntity): ChildConsent {
    // Value Object 복원 (검증 생략 - DB에서 검증된 데이터)
    const consentItems = ConsentItems.restore({
      personalInfo: entity.consentItems.personalInfo,
      sensitiveData: entity.consentItems.sensitiveData,
      researchData: entity.consentItems.researchData,
      childSelfConsent: entity.consentItems.childSelfConsent,
    });

    const consentVersion = ConsentVersion.restore(entity.consentVersion);

    return ChildConsent.restore({
      id: entity.id,
      childId: entity.childId,
      consentItems,
      consentVersion,
      documentUrl: entity.documentUrl,
      consentedAt: entity.consentedAt,
      revokedAt: entity.revokedAt,
      revocationReason: entity.revocationReason,
      ipAddress: entity.ipAddress,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Domain → Entity
   */
  public static toEntity(consent: ChildConsent): ChildConsentEntity {
    const entity = new ChildConsentEntity();
    entity.id = consent.id;
    entity.childId = consent.childId;
    entity.consentItems = {
      personalInfo: consent.consentItems.personalInfo,
      sensitiveData: consent.consentItems.sensitiveData,
      researchData: consent.consentItems.researchData,
      childSelfConsent: consent.consentItems.childSelfConsent,
    };
    entity.consentVersion = consent.consentVersion.value;
    entity.documentUrl = consent.documentUrl;
    entity.consentedAt = consent.consentedAt;
    entity.revokedAt = consent.revokedAt;
    entity.revocationReason = consent.revocationReason;
    entity.ipAddress = consent.ipAddress;
    entity.createdAt = consent.createdAt;
    entity.updatedAt = consent.updatedAt;

    return entity;
  }

  /**
   * Domain → Record (히스토리용 스냅샷)
   */
  public static toSnapshot(consent: ChildConsent): Record<string, unknown> {
    return {
      id: consent.id,
      childId: consent.childId,
      consentItems: consent.consentItems.value,
      consentVersion: consent.consentVersion.value,
      documentUrl: consent.documentUrl,
      consentedAt: consent.consentedAt.toISOString(),
      revokedAt: consent.revokedAt?.toISOString() ?? null,
      revocationReason: consent.revocationReason,
      ipAddress: consent.ipAddress,
    };
  }
}
