import { ConsentRole } from '../../src/infrastructure/persistence/typeorm/entity/enums/consent-role.enum';
import { ConsentItemsJson } from '../../src/infrastructure/persistence/typeorm/entity/child-consent.entity';

/**
 * 동의서 테스트 픽스처
 */

/**
 * 동의 항목 기본 데이터
 */
export const consentItemsFixtures: Record<string, ConsentItemsJson> = {
  /**
   * 전체 동의 (연구 데이터 포함)
   */
  allAgreed: {
    personalInfo: true,
    sensitiveData: true,
    researchData: true,
    childSelfConsent: true,
  },

  /**
   * 필수만 동의 (연구 데이터 미동의)
   */
  requiredOnly: {
    personalInfo: true,
    sensitiveData: true,
    researchData: false,
    childSelfConsent: true,
  },

  /**
   * 14세 미만 아동 (본인동의 불필요)
   */
  under14: {
    personalInfo: true,
    sensitiveData: true,
    researchData: false,
    childSelfConsent: false,
  },

  /**
   * 필수 항목 미동의 (무효)
   */
  invalidMissingRequired: {
    personalInfo: false, // 필수 항목 미동의
    sensitiveData: true,
    researchData: false,
    childSelfConsent: true,
  },
};

/**
 * 아동 동의서 데이터
 */
export const childConsentFixtures = {
  /**
   * 양육시설 아동 동의 (14세 미만)
   */
  careFacilityChildUnder14: {
    id: 'consent-cf-under14-001',
    childId: 'child-cf-001',
    role: ConsentRole.CHILD,
    consentItems: consentItemsFixtures.under14,
    consentVersion: '1.0.0',
    documentUrl: null,
    consentedAt: new Date(),
    revokedAt: null,
    revocationReason: null,
    guardianPhone: null,
    guardianRelation: null,
    ipAddress: '127.0.0.1',
  },

  /**
   * 양육시설 아동 동의 (14세 이상)
   */
  careFacilityChildOver14: {
    id: 'consent-cf-over14-001',
    childId: 'child-cf-002',
    role: ConsentRole.CHILD,
    consentItems: consentItemsFixtures.allAgreed,
    consentVersion: '1.0.0',
    documentUrl: 'https://example.com/consent-doc.pdf',
    consentedAt: new Date(),
    revokedAt: null,
    revocationReason: null,
    guardianPhone: null,
    guardianRelation: null,
    ipAddress: '192.168.1.100',
  },

  /**
   * 지역아동센터 아동 동의 (14세 미만)
   */
  communityCenterChildUnder14: {
    id: 'consent-cc-child-001',
    childId: 'child-cc-001',
    role: ConsentRole.CHILD,
    consentItems: consentItemsFixtures.under14,
    consentVersion: '1.0.0',
    documentUrl: null,
    consentedAt: new Date(),
    revokedAt: null,
    revocationReason: null,
    guardianPhone: null,
    guardianRelation: null,
    ipAddress: '127.0.0.1',
  },

  /**
   * 지역아동센터 보호자 동의
   */
  communityCenterGuardian: {
    id: 'consent-cc-guardian-001',
    childId: 'child-cc-001',
    role: ConsentRole.GUARDIAN,
    consentItems: consentItemsFixtures.requiredOnly,
    consentVersion: '1.0.0',
    documentUrl: null,
    consentedAt: new Date(),
    revokedAt: null,
    revocationReason: null,
    guardianPhone: '010-1234-5678',
    guardianRelation: '부모',
    ipAddress: '127.0.0.1',
  },

  /**
   * 철회된 동의
   */
  revoked: {
    id: 'consent-revoked-001',
    childId: 'child-cf-003',
    role: ConsentRole.CHILD,
    consentItems: consentItemsFixtures.allAgreed,
    consentVersion: '1.0.0',
    documentUrl: null,
    consentedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7일 전
    revokedAt: new Date(),
    revocationReason: '서비스 이용 중단',
    guardianPhone: null,
    guardianRelation: null,
    ipAddress: '127.0.0.1',
  },
};

/**
 * 동의 제출 DTO 픽스처
 */
export const submitConsentDtoFixtures = {
  /**
   * 유효한 아동 동의 (14세 이상)
   */
  validChildOver14: {
    childId: 'child-cf-002',
    role: ConsentRole.CHILD,
    consentItems: consentItemsFixtures.allAgreed,
    consentVersion: '1.0.0',
  },

  /**
   * 유효한 아동 동의 (14세 미만)
   */
  validChildUnder14: {
    childId: 'child-cf-001',
    role: ConsentRole.CHILD,
    consentItems: consentItemsFixtures.under14,
    consentVersion: '1.0.0',
  },

  /**
   * 유효한 보호자 동의
   */
  validGuardian: {
    childId: 'child-cc-001',
    role: ConsentRole.GUARDIAN,
    consentItems: consentItemsFixtures.requiredOnly,
    consentVersion: '1.0.0',
    guardianPhone: '010-1234-5678',
    guardianRelation: '부모',
  },

  /**
   * 필수 항목 미동의 (무효)
   */
  invalidMissingRequired: {
    childId: 'child-cf-001',
    role: ConsentRole.CHILD,
    consentItems: consentItemsFixtures.invalidMissingRequired,
    consentVersion: '1.0.0',
  },

  /**
   * 보호자 동의 시 전화번호 누락 (무효)
   */
  guardianMissingPhone: {
    childId: 'child-cc-001',
    role: ConsentRole.GUARDIAN,
    consentItems: consentItemsFixtures.requiredOnly,
    consentVersion: '1.0.0',
    // guardianPhone 누락
    guardianRelation: '부모',
  },

  /**
   * 존재하지 않는 아동
   */
  nonExistentChild: {
    childId: 'non-existent-child-id',
    role: ConsentRole.CHILD,
    consentItems: consentItemsFixtures.allAgreed,
    consentVersion: '1.0.0',
  },
};

/**
 * 동의 철회 DTO 픽스처
 */
export const revokeConsentDtoFixtures = {
  /**
   * 유효한 철회
   */
  valid: {
    childId: 'child-cf-001',
    revocationReason: '서비스 이용 중단',
  },

  /**
   * 사유 없이 철회
   */
  noReason: {
    childId: 'child-cf-001',
    // revocationReason 누락
  },

  /**
   * 존재하지 않는 아동
   */
  nonExistentChild: {
    childId: 'non-existent-child-id',
    revocationReason: '철회 사유',
  },
};

/**
 * 보호자 동의 토큰 픽스처
 */
export const guardianConsentTokenFixtures = {
  /**
   * 유효한 토큰 생성 요청
   */
  validTokenRequest: {
    childId: 'child-cc-001',
    guardianPhone: '010-1234-5678',
    expiresInMinutes: 30,
  },

  /**
   * 만료된 토큰 (테스트용 - 과거 시간)
   */
  expiredToken: {
    token: 'expired-token-12345',
    childId: 'child-cc-001',
    expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1시간 전 만료
  },

  /**
   * 유효한 토큰
   */
  validToken: {
    token: 'valid-token-67890',
    childId: 'child-cc-001',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30분 후 만료
  },
};

/**
 * 동의 상태 응답 픽스처
 */
export const consentStatusResponseFixtures = {
  /**
   * 완전한 동의 (아동 + 보호자)
   */
  complete: {
    childId: 'child-cc-001',
    isComplete: true,
    childConsent: {
      exists: true,
      consentedAt: new Date().toISOString(),
      isRevoked: false,
    },
    guardianConsent: {
      exists: true,
      consentedAt: new Date().toISOString(),
      isRevoked: false,
    },
  },

  /**
   * 아동 동의만 있음 (14세 미만은 이것만으로 완전)
   */
  childOnly: {
    childId: 'child-cf-001',
    isComplete: true, // 14세 미만이므로 완전
    childConsent: {
      exists: true,
      consentedAt: new Date().toISOString(),
      isRevoked: false,
    },
    guardianConsent: {
      exists: false,
      consentedAt: null,
      isRevoked: false,
    },
  },

  /**
   * 동의 없음
   */
  none: {
    childId: 'child-cc-002',
    isComplete: false,
    childConsent: {
      exists: false,
      consentedAt: null,
      isRevoked: false,
    },
    guardianConsent: {
      exists: false,
      consentedAt: null,
      isRevoked: false,
    },
  },

  /**
   * 철회된 동의
   */
  revoked: {
    childId: 'child-cf-003',
    isComplete: false,
    childConsent: {
      exists: true,
      consentedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      isRevoked: true,
      revokedAt: new Date().toISOString(),
    },
    guardianConsent: {
      exists: false,
      consentedAt: null,
      isRevoked: false,
    },
  },
};

/**
 * 동의 완료 여부 확인 헬퍼
 * - 14세 미만: 아동 동의만 필요 (양육시설) 또는 보호자 동의 필요 (지역아동센터)
 * - 14세 이상: 아동 동의 필수, 지역아동센터는 보호자 동의도 필요
 */
export function isConsentComplete(
  hasChildConsent: boolean,
  hasGuardianConsent: boolean,
  isOver14: boolean,
  isCareFacility: boolean,
): boolean {
  if (isCareFacility) {
    // 양육시설: 아동 동의만 필요
    return hasChildConsent;
  } else {
    // 지역아동센터: 보호자 동의 필수
    if (isOver14) {
      // 14세 이상: 아동 동의 + 보호자 동의
      return hasChildConsent && hasGuardianConsent;
    } else {
      // 14세 미만: 보호자 동의만 필요
      return hasGuardianConsent;
    }
  }
}
