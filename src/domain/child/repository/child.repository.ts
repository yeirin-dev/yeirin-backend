import { Child } from '../model/child';

/**
 * Child Repository 인터페이스
 * Domain 계층에서 정의 (의존성 역전)
 */
export interface ChildRepository {
  /**
   * 아동 저장 (생성 또는 업데이트)
   */
  save(child: Child): Promise<Child>;

  /**
   * ID로 아동 조회
   */
  findById(id: string): Promise<Child | null>;

  /**
   * 보호자 ID로 아동 목록 조회
   */
  findByGuardianId(guardianId: string): Promise<Child[]>;

  /**
   * 양육시설 ID로 아동 목록 조회
   */
  findByInstitutionId(institutionId: string): Promise<Child[]>;

  /**
   * 아동 삭제
   */
  delete(id: string): Promise<void>;

  /**
   * 아동 존재 여부 확인
   */
  exists(id: string): Promise<boolean>;
}
