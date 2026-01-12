import { EducationWelfareSchool } from '@domain/education-welfare-school/model/education-welfare-school';

/**
 * 교육복지사협회 학교 Repository 인터페이스
 */
export interface EducationWelfareSchoolRepository {
  /**
   * ID로 조회
   */
  findById(id: string): Promise<EducationWelfareSchool | null>;

  /**
   * 학교명으로 조회
   */
  findByName(name: string): Promise<EducationWelfareSchool | null>;

  /**
   * 활성 학교 목록 조회
   */
  findAllActive(): Promise<EducationWelfareSchool[]>;

  /**
   * 전체 목록 조회 (페이지네이션)
   */
  findAll(options?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<{ data: EducationWelfareSchool[]; total: number }>;

  /**
   * 저장 (생성 또는 수정)
   */
  save(school: EducationWelfareSchool): Promise<EducationWelfareSchool>;

  /**
   * 삭제
   */
  delete(id: string): Promise<void>;

  /**
   * 존재 여부 확인
   */
  exists(id: string): Promise<boolean>;

  /**
   * 학교명 중복 확인
   */
  existsByName(name: string): Promise<boolean>;

  /**
   * 구/군별 학교 목록 조회 (로그인용)
   */
  findActiveByDistrict(district: string): Promise<EducationWelfareSchool[]>;

  /**
   * 중복 제거된 구/군 목록 조회 (로그인 드롭다운용)
   */
  getDistinctDistricts(): Promise<string[]>;
}
