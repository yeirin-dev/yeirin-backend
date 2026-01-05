import { CommunityChildCenter } from '@domain/community-child-center/model/community-child-center';

/**
 * 지역아동센터 Repository 인터페이스
 */
export interface CommunityChildCenterRepository {
  /**
   * ID로 조회
   */
  findById(id: string): Promise<CommunityChildCenter | null>;

  /**
   * 기관명으로 조회
   */
  findByName(name: string): Promise<CommunityChildCenter | null>;

  /**
   * 활성 기관 목록 조회
   */
  findAllActive(): Promise<CommunityChildCenter[]>;

  /**
   * 전체 목록 조회 (페이지네이션)
   */
  findAll(options?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<{ data: CommunityChildCenter[]; total: number }>;

  /**
   * 저장 (생성 또는 수정)
   */
  save(center: CommunityChildCenter): Promise<CommunityChildCenter>;

  /**
   * 삭제
   */
  delete(id: string): Promise<void>;

  /**
   * 존재 여부 확인
   */
  exists(id: string): Promise<boolean>;

  /**
   * 기관명 중복 확인
   */
  existsByName(name: string): Promise<boolean>;

  /**
   * 구/군별 센터 목록 조회 (로그인용)
   */
  findActiveByDistrict(district: string): Promise<CommunityChildCenter[]>;

  /**
   * 중복 제거된 구/군 목록 조회 (로그인 드롭다운용)
   */
  getDistinctDistricts(): Promise<string[]>;
}
