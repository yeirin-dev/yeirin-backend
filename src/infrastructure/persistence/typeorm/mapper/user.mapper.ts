import { User } from '@domain/user/model/user';
import { Email } from '@domain/user/model/value-objects/email.vo';
import { Password } from '@domain/user/model/value-objects/password.vo';
import { PhoneNumber } from '@domain/user/model/value-objects/phone-number.vo';
import { RealName } from '@domain/user/model/value-objects/real-name.vo';
import { UserRole, UserRoleType } from '@domain/user/model/value-objects/user-role.vo';
import { UserEntity } from '../entity/user.entity';

/**
 * User Mapper
 * - Domain Model ↔ Infrastructure Entity 변환
 * - Anti-Corruption Layer (방부패 계층)
 * - Domain이 Infrastructure에 오염되지 않도록 보호
 */
export class UserMapper {
  /**
   * Domain → Entity (저장용)
   */
  static toEntity(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.id;
    entity.email = user.email.value;
    entity.password = user.password.value;
    entity.realName = user.realName.value;
    entity.phoneNumber = user.phoneNumber.value;
    entity.role = user.role.value;
    entity.refreshToken = user.refreshToken;
    entity.isEmailVerified = user.isEmailVerified;
    entity.isActive = user.isActive;
    entity.lastLoginAt = user.lastLoginAt;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;

    return entity;
  }

  /**
   * Entity → Domain (조회용)
   */
  static toDomain(entity: UserEntity): User {
    // Value Objects 복원
    const email = Email.create(entity.email).getValue();
    const password = Password.fromHash(entity.password);
    const realName = RealName.create(entity.realName).getValue();
    const phoneNumber = PhoneNumber.create(entity.phoneNumber).getValue();
    const role = UserRole.create(entity.role as UserRoleType).getValue();

    // User Aggregate 복원
    return User.restore({
      id: entity.id,
      email,
      password,
      realName,
      phoneNumber,
      role,
      isEmailVerified: entity.isEmailVerified,
      isActive: entity.isActive,
      lastLoginAt: entity.lastLoginAt,
      refreshToken: entity.refreshToken,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Entity[] → Domain[] (대량 조회용)
   */
  static toDomainList(entities: UserEntity[]): User[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
