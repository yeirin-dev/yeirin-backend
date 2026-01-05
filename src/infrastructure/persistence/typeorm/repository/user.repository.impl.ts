import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@domain/user/model/user';
import { Email } from '@domain/user/model/value-objects/email.vo';
import { UserRepository } from '@domain/user/repository/user.repository';
import { UserEntity } from '../entity/user.entity';
import { UserMapper } from '../mapper/user.mapper';

/**
 * User Repository 구현체 (Infrastructure Layer)
 * - UserRepository 인터페이스 구현
 * - TypeORM 의존성 캡슐화
 * - Domain User ↔ UserEntity 매핑
 */
@Injectable()
export class UserRepositoryImpl implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * ID로 User 조회
   */
  async findById(id: string): Promise<User | null> {
    const entity = await this.userRepository.findOne({ where: { id } });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  /**
   * Email로 User 조회
   */
  async findByEmail(email: Email): Promise<User | null> {
    const entity = await this.userRepository.findOne({
      where: { email: email.value },
    });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  /**
   * User 저장 (생성 or 업데이트)
   */
  async save(user: User): Promise<User> {
    const entity = UserMapper.toEntity(user);
    const savedEntity = await this.userRepository.save(entity);
    return UserMapper.toDomain(savedEntity);
  }

  /**
   * User 삭제 (Soft Delete)
   */
  async delete(id: string): Promise<void> {
    await this.userRepository.softDelete(id);
  }

  /**
   * 이메일 중복 확인
   */
  async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.userRepository.count({
      where: { email: email.value },
    });
    return count > 0;
  }
}
