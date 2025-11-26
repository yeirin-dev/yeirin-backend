import { CareFacility } from '@domain/care-facility/model/care-facility';

/**
 * 양육시설 Repository 인터페이스
 */
export interface CareFacilityRepository {
  /**
   * ID로 조회
   */
  findById(id: string): Promise<CareFacility | null>;

  /**
   * 기관명으로 조회
   */
  findByName(name: string): Promise<CareFacility | null>;

  /**
   * 활성 기관 목록 조회
   */
  findAllActive(): Promise<CareFacility[]>;

  /**
   * 전체 목록 조회 (페이지네이션)
   */
  findAll(options?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<{ data: CareFacility[]; total: number }>;

  /**
   * 저장 (생성 또는 수정)
   */
  save(facility: CareFacility): Promise<CareFacility>;

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
}
