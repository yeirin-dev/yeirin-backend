import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@domain/user/model/user';
import { Email } from '@domain/user/model/value-objects/email.vo';
import { Password } from '@domain/user/model/value-objects/password.vo';
import { PhoneNumber } from '@domain/user/model/value-objects/phone-number.vo';
import { RealName } from '@domain/user/model/value-objects/real-name.vo';
import { UserRole } from '@domain/user/model/value-objects/user-role.vo';
import { UserEntity } from '../entity/user.entity';
import { UserRepositoryImpl } from './user.repository.impl';

describe('UserRepositoryImpl', () => {
  let repository: UserRepositoryImpl;
  let typeormRepository: jest.Mocked<Repository<UserEntity>>;

  const mockUserEntity: UserEntity = {
    id: 'test-id',
    email: 'test@example.com',
    password: '$2b$10$hashed',
    realName: '테스트',
    phoneNumber: '010-1234-5678',
    role: 'INSTITUTION_ADMIN',
    refreshToken: null,
    isEmailVerified: false,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as UserEntity;

  const createMockUser = (): User => {
    return {
      id: 'test-id',
      email: { value: 'test@example.com' } as Email,
      password: { value: '$2b$10$hashed', isHashed: true } as Password,
      realName: { value: '테스트' } as RealName,
      phoneNumber: { value: '010-1234-5678' } as PhoneNumber,
      role: { value: 'INSTITUTION_ADMIN' } as UserRole,
      refreshToken: null,
      isEmailVerified: false,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      updateRefreshToken: jest.fn(),
      verifyEmail: jest.fn(),
      deactivate: jest.fn(),
      activate: jest.fn(),
    } as unknown as User;
  };

  beforeEach(async () => {
    const mockTypeormRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepositoryImpl,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockTypeormRepository,
        },
      ],
    }).compile();

    repository = module.get<UserRepositoryImpl>(UserRepositoryImpl);
    typeormRepository = module.get(getRepositoryToken(UserEntity));

    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('이메일로 사용자를 찾으면 User 도메인 객체를 반환한다', async () => {
      // Given
      const email = Email.create('test@example.com').getValue();
      typeormRepository.findOne.mockResolvedValue(mockUserEntity);

      // When
      const result = await repository.findByEmail(email);

      // Then
      expect(typeormRepository.findOne).toHaveBeenCalledWith({
        where: { email: email.value },
      });
      expect(result).toBeDefined();
      expect(result?.id).toBe(mockUserEntity.id);
    });

    it('사용자가 없으면 null을 반환한다', async () => {
      // Given
      const email = Email.create('nonexistent@example.com').getValue();
      typeormRepository.findOne.mockResolvedValue(null);

      // When
      const result = await repository.findByEmail(email);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('existsByEmail', () => {
    it('이메일이 존재하면 true를 반환한다', async () => {
      // Given
      const email = Email.create('existing@example.com').getValue();
      typeormRepository.count.mockResolvedValue(1);

      // When
      const result = await repository.existsByEmail(email);

      // Then
      expect(typeormRepository.count).toHaveBeenCalledWith({
        where: { email: email.value },
      });
      expect(result).toBe(true);
    });

    it('이메일이 존재하지 않으면 false를 반환한다', async () => {
      // Given
      const email = Email.create('new@example.com').getValue();
      typeormRepository.count.mockResolvedValue(0);

      // When
      const result = await repository.existsByEmail(email);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('save', () => {
    it('User 도메인 객체를 Entity로 변환하여 저장한다', async () => {
      // Given
      const user = createMockUser();
      typeormRepository.save.mockResolvedValue(mockUserEntity);

      // When
      const result = await repository.save(user);

      // Then
      expect(typeormRepository.save).toHaveBeenCalled();
      expect(result.id).toBe(mockUserEntity.id);
    });
  });

  describe('findById', () => {
    it('ID로 사용자를 찾으면 User 도메인 객체를 반환한다', async () => {
      // Given
      typeormRepository.findOne.mockResolvedValue(mockUserEntity);

      // When
      const result = await repository.findById('test-id');

      // Then
      expect(typeormRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(result).toBeDefined();
    });

    it('사용자가 없으면 null을 반환한다', async () => {
      // Given
      typeormRepository.findOne.mockResolvedValue(null);

      // When
      const result = await repository.findById('nonexistent-id');

      // Then
      expect(result).toBeNull();
    });
  });
});
