import { Child } from '../model/child';

/**
 * Child Repository 인터페이스
 * Domain 계층에서 정의 (의존성 역전)
 *
 * NOTE: 모든 아동은 시설(Institution)에 직접 연결됩니다.
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
   * 양육시설 ID로 아동 목록 조회
   * - CARE_FACILITY 유형 아동 조회
   */
  findByCareFacilityId(careFacilityId: string): Promise<Child[]>;

  /**
   * 지역아동센터 ID로 아동 목록 조회
   * - COMMUNITY_CENTER 유형 아동 조회
   */
  findByCommunityChildCenterId(communityChildCenterId: string): Promise<Child[]>;

  /**
   * 교육복지사협회 학교 ID로 아동 목록 조회
   * - EDUCATION_WELFARE_SCHOOL 유형 아동 조회
   */
  findByEducationWelfareSchoolId(educationWelfareSchoolId: string): Promise<Child[]>;

  /**
   * 아동 삭제
   */
  delete(id: string): Promise<void>;

  /**
   * 아동 존재 여부 확인
   */
  exists(id: string): Promise<boolean>;

  /**
   * 양육시설별 아동 수 조회
   */
  countByCareFacilityId(careFacilityId: string): Promise<number>;

  /**
   * 지역아동센터별 아동 수 조회
   */
  countByCommunityChildCenterId(communityChildCenterId: string): Promise<number>;

  /**
   * 교육복지사협회 학교별 아동 수 조회
   */
  countByEducationWelfareSchoolId(educationWelfareSchoolId: string): Promise<number>;
}
