import { ChildConsent } from '../model/child-consent';
import { ConsentRole } from '../model/value-objects/consent-role';

/**
 * 동의 이력 생성 데이터
 */
export interface ConsentHistoryData {
  consentId: string;
  childId: string;
  action: 'CREATED' | 'UPDATED' | 'REVOKED';
  previousData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  ipAddress: string | null;
}

/**
 * 완전한 동의 상태 (14세 기준 분기)
 */
export interface CompleteConsentStatus {
  /** 완전한 동의 여부 */
  isComplete: boolean;
  /** 보호자 동의 존재 여부 */
  hasGuardianConsent: boolean;
  /** 아동 본인 동의 존재 여부 */
  hasChildConsent: boolean;
  /** 필요한 동의 유형 (GUARDIAN, CHILD, BOTH, 또는 완료 시 null) */
  requiredConsent: 'GUARDIAN' | 'CHILD' | 'BOTH' | null;
}

/**
 * ChildConsent Repository 인터페이스
 * Domain 계층에서 정의 (의존성 역전)
 *
 * NOTE: 아동당 역할별(CHILD/GUARDIAN)로 하나의 유효한 동의만 존재합니다.
 */
export interface ChildConsentRepository {
  /**
   * 동의 저장 (생성 또는 업데이트)
   */
  save(consent: ChildConsent): Promise<ChildConsent>;

  /**
   * ID로 동의 조회
   */
  findById(id: string): Promise<ChildConsent | null>;

  /**
   * 아동 ID로 동의 조회 (기존 호환성 유지 - CHILD role 우선)
   * @deprecated findByChildIdAndRole 사용 권장
   */
  findByChildId(childId: string): Promise<ChildConsent | null>;

  /**
   * 아동 ID와 역할로 동의 조회
   */
  findByChildIdAndRole(childId: string, role: ConsentRole): Promise<ChildConsent | null>;

  /**
   * 아동의 모든 동의 조회 (CHILD + GUARDIAN)
   */
  findAllByChildId(childId: string): Promise<ChildConsent[]>;

  /**
   * 아동의 유효한 동의 존재 여부 확인 (기존 호환성 유지)
   * - 철회되지 않고 필수 항목이 동의된 상태
   * @deprecated hasValidConsentByRole 사용 권장
   */
  hasValidConsent(childId: string): Promise<boolean>;

  /**
   * 역할별 유효한 동의 존재 여부 확인
   */
  hasValidConsentByRole(childId: string, role: ConsentRole): Promise<boolean>;

  /**
   * 완전한 동의 상태 확인 (14세 기준 분기)
   * @param childId 아동 ID
   * @param isOver14 14세 이상 여부
   */
  getCompleteConsentStatus(childId: string, isOver14: boolean): Promise<CompleteConsentStatus>;

  /**
   * 동의 삭제
   */
  delete(id: string): Promise<void>;

  /**
   * 동의 존재 여부 확인
   */
  exists(id: string): Promise<boolean>;

  /**
   * 동의 이력 저장 (감사 추적)
   */
  saveHistory(history: ConsentHistoryData): Promise<void>;

  /**
   * 아동 ID로 동의 이력 조회
   */
  findHistoryByChildId(
    childId: string,
  ): Promise<{ action: string; createdAt: Date; ipAddress: string | null }[]>;
}
