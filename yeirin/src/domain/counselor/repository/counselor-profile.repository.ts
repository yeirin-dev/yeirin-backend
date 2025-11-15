import { CounselorProfileEntity } from '@infrastructure/persistence/typeorm/entity/counselor-profile.entity';

/**
 * 상담사 프로필 Repository 인터페이스
 */
export interface CounselorProfileRepository {
  /**
   * 상담사 ID로 조회
   */
  findById(id: string): Promise<CounselorProfileEntity | null>;

  /**
   * 모든 상담사 조회 (페이지네이션)
   */
  findAll(page: number, limit: number): Promise<[CounselorProfileEntity[], number]>;

  /**
   * 기관 ID로 상담사 조회
   */
  findByInstitutionId(institutionId: string): Promise<CounselorProfileEntity[]>;

  /**
   * 상담사 프로필 생성
   */
  create(
    profile: Omit<CounselorProfileEntity, 'id' | 'createdAt' | 'updatedAt' | 'institution' | 'user'>,
  ): Promise<CounselorProfileEntity>;

  /**
   * 상담사 프로필 수정
   */
  update(id: string, profile: Partial<CounselorProfileEntity>): Promise<CounselorProfileEntity>;

  /**
   * 상담사 프로필 삭제 (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * 전문 분야로 검색
   */
  findBySpecialty(specialty: string): Promise<CounselorProfileEntity[]>;

  /**
   * 최소 경력 년수로 검색
   */
  findByMinExperience(years: number): Promise<CounselorProfileEntity[]>;
}
