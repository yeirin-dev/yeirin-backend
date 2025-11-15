import { GuardianProfileEntity } from '@infrastructure/persistence/typeorm/entity/guardian-profile.entity';

/**
 * 보호자 프로필 Repository 인터페이스
 */
export interface GuardianProfileRepository {
  /**
   * 보호자 프로필 ID로 조회
   */
  findById(id: string): Promise<GuardianProfileEntity | null>;

  /**
   * User ID로 보호자 프로필 조회
   */
  findByUserId(userId: string): Promise<GuardianProfileEntity | null>;

  /**
   * 보호자 프로필 생성
   */
  create(
    profile: Omit<GuardianProfileEntity, 'id' | 'createdAt' | 'updatedAt' | 'user'>,
  ): Promise<GuardianProfileEntity>;

  /**
   * 보호자 프로필 수정
   */
  update(id: string, profile: Partial<GuardianProfileEntity>): Promise<GuardianProfileEntity>;

  /**
   * 보호자 프로필 삭제
   */
  delete(id: string): Promise<void>;

  /**
   * 보호자 유형으로 검색
   */
  findByGuardianType(guardianType: 'TEACHER' | 'PARENT'): Promise<GuardianProfileEntity[]>;

  /**
   * 소속 기관명으로 검색
   */
  findByOrganization(organizationName: string): Promise<GuardianProfileEntity[]>;

  /**
   * 보호자 프로필 존재 여부 확인
   */
  exists(id: string): Promise<boolean>;
}
