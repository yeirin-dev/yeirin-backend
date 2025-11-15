import { User } from '../model/user';
import { Email } from '../model/value-objects/email.vo';

/**
 * User Repository 인터페이스 (Domain Layer)
 * - Infrastructure 독립적
 * - User Aggregate Root 사용 (Entity 아님!)
 * - Port & Adapter 패턴 (Hexagonal Architecture)
 */
export interface IUserRepository {
  /**
   * ID로 User 조회
   */
  findById(id: string): Promise<User | null>;

  /**
   * Email로 User 조회
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * User 저장 (생성 or 업데이트)
   */
  save(user: User): Promise<User>;

  /**
   * User 삭제 (Soft Delete)
   */
  delete(id: string): Promise<void>;

  /**
   * 이메일 중복 확인
   */
  existsByEmail(email: Email): Promise<boolean>;
}
