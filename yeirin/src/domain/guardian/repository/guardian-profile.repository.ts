import { GuardianType } from '@infrastructure/persistence/typeorm/entity/enums/guardian-type.enum';
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
    profile: Omit<
      GuardianProfileEntity,
      'id' | 'createdAt' | 'updatedAt' | 'user' | 'careFacility' | 'communityChildCenter'
    >,
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
  findByGuardianType(guardianType: GuardianType): Promise<GuardianProfileEntity[]>;

  /**
   * 양육시설 ID로 소속 선생님 목록 조회
   */
  findByCareFacilityId(careFacilityId: string): Promise<GuardianProfileEntity[]>;

  /**
   * 지역아동센터 ID로 소속 선생님 목록 조회
   */
  findByCommunityChildCenterId(communityChildCenterId: string): Promise<GuardianProfileEntity[]>;

  /**
   * 보호자 프로필 존재 여부 확인
   */
  exists(id: string): Promise<boolean>;

  /**
   * 양육시설 소속 선생님 수 조회
   */
  countByCareFacilityId(careFacilityId: string): Promise<number>;

  /**
   * 지역아동센터 소속 선생님 수 조회
   */
  countByCommunityChildCenterId(communityChildCenterId: string): Promise<number>;
}
