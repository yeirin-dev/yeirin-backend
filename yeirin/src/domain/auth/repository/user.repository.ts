import { UserEntity } from '@infrastructure/persistence/typeorm/entity/user.entity';

/**
 * 사용자 Repository 인터페이스
 * Domain 계층: 프레임워크 독립적
 */
export interface UserRepository {
  /**
   * ID로 사용자 조회
   */
  findById(id: string): Promise<UserEntity | null>;

  /**
   * 이메일로 사용자 조회
   */
  findByEmail(email: string): Promise<UserEntity | null>;

  /**
   * 사용자 생성
   */
  create(user: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt' | 'refreshToken' | 'isEmailVerified' | 'isActive' | 'lastLoginAt'>): Promise<UserEntity>;

  /**
   * 사용자 정보 업데이트
   */
  update(id: string, user: Partial<UserEntity>): Promise<UserEntity>;

  /**
   * 리프레시 토큰 업데이트
   */
  updateRefreshToken(id: string, refreshToken: string | null): Promise<void>;

  /**
   * 마지막 로그인 시간 업데이트
   */
  updateLastLogin(id: string): Promise<void>;
}
