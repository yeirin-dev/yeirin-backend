import { ChildConsent } from '../model/child-consent';

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
 * ChildConsent Repository 인터페이스
 * Domain 계층에서 정의 (의존성 역전)
 *
 * NOTE: 아동당 하나의 유효한 동의만 존재합니다.
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
   * 아동 ID로 동의 조회
   * - 아동당 하나의 동의만 존재 (unique constraint)
   */
  findByChildId(childId: string): Promise<ChildConsent | null>;

  /**
   * 아동의 유효한 동의 존재 여부 확인
   * - 철회되지 않고 필수 항목이 동의된 상태
   */
  hasValidConsent(childId: string): Promise<boolean>;

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
