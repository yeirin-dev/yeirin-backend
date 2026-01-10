import { ChildConsent } from '@domain/consent/model/child-consent';
import { ConsentItems } from '@domain/consent/model/value-objects/consent-items.vo';
import { ConsentRole } from '@domain/consent/model/value-objects/consent-role';
import { ConsentVersion } from '@domain/consent/model/value-objects/consent-version.vo';
import { ChildConsentEntity } from '../entity/child-consent.entity';
import { ConsentRole as EntityConsentRole } from '../entity/enums/consent-role.enum';

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

    // Entity role → Domain role 변환
    const role =
      entity.role === EntityConsentRole.GUARDIAN ? ConsentRole.GUARDIAN : ConsentRole.CHILD;

    return ChildConsent.restore({
      id: entity.id,
      childId: entity.childId,
      role,
      consentItems,
      consentVersion,
      documentUrl: entity.documentUrl,
      consentedAt: entity.consentedAt,
      revokedAt: entity.revokedAt,
      revocationReason: entity.revocationReason,
      guardianPhone: entity.guardianPhone,
      guardianRelation: entity.guardianRelation,
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
    // Domain role → Entity role 변환
    entity.role =
      consent.role === ConsentRole.GUARDIAN ? EntityConsentRole.GUARDIAN : EntityConsentRole.CHILD;
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
    entity.guardianPhone = consent.guardianPhone;
    entity.guardianRelation = consent.guardianRelation;
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
      role: consent.role,
      consentItems: consent.consentItems.value,
      consentVersion: consent.consentVersion.value,
      documentUrl: consent.documentUrl,
      consentedAt: consent.consentedAt.toISOString(),
      revokedAt: consent.revokedAt?.toISOString() ?? null,
      revocationReason: consent.revocationReason,
      guardianPhone: consent.guardianPhone,
      guardianRelation: consent.guardianRelation,
      ipAddress: consent.ipAddress,
    };
  }
}
