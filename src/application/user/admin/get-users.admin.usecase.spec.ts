import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { UserEntity } from '@infrastructure/persistence/typeorm/entity/user.entity';
import { SortOrder } from '@yeirin/admin-common';
import { AdminUserQueryDto, UserStatusFilter, UserRoleFilter } from './dto/admin-user-query.dto';
import { GetUsersAdminUseCase } from './get-users.admin.usecase';

describe('GetUsersAdminUseCase', () => {
  let useCase: GetUsersAdminUseCase;
  let mockUserRepository: jest.Mocked<Repository<UserEntity>>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<UserEntity>>;

  beforeEach(async () => {
    mockQueryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    } as any;

    mockUserRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUsersAdminUseCase,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetUsersAdminUseCase>(GetUsersAdminUseCase);
  });

  const createMockUserEntity = (
    id: string,
    email: string,
    role: string,
    isActive: boolean = true,
    isBanned: boolean = false,
  ): Partial<UserEntity> => ({
    id,
    email,
    realName: '테스트 사용자',
    phoneNumber: '010-1234-5678',
    role: role as any,
    isEmailVerified: true,
    isActive,
    isBanned,
    banReason: isBanned ? '테스트 정지' : null,
    bannedAt: isBanned ? new Date() : null,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 쿼리 객체 생성 헬퍼 (Class 인스턴스화)
  const createQuery = (overrides: Partial<AdminUserQueryDto> = {}): AdminUserQueryDto => {
    const query = new AdminUserQueryDto();
    Object.assign(query, overrides);
    return query;
  };

  describe('사용자 목록 조회', () => {
    it('기본 페이지네이션으로 사용자 목록을 조회한다', async () => {
      // Given
      const query = createQuery();
      const mockUsers = [
        createMockUserEntity('user-1', 'user1@example.com', 'INSTITUTION_ADMIN'),
        createMockUserEntity('user-2', 'user2@example.com', 'COUNSELOR'),
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers as UserEntity[], 2]);

      // When
      const result = await useCase.execute(query);

      // Then
      expect(result.data.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledWith('user');
    });

    it('페이지와 limit을 지정하여 조회한다', async () => {
      // Given
      const query = createQuery({ page: 2, limit: 10 });
      const mockUsers = [createMockUserEntity('user-11', 'user11@example.com', 'INSTITUTION_ADMIN')];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers as UserEntity[], 15]);

      // When
      const result = await useCase.execute(query);

      // Then
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10); // (page - 1) * limit
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('역할로 필터링하여 조회한다', async () => {
      // Given
      const query = createQuery({ role: UserRoleFilter.COUNSELOR });
      const mockUsers = [createMockUserEntity('counselor-1', 'counselor@example.com', 'COUNSELOR')];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers as UserEntity[], 1]);

      // When
      const result = await useCase.execute(query);

      // Then
      expect(result.data.length).toBe(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.role = :role', {
        role: UserRoleFilter.COUNSELOR,
      });
    });

    it('ACTIVE 상태로 필터링하여 조회한다', async () => {
      // Given
      const query = createQuery({ status: UserStatusFilter.ACTIVE });
      const mockUsers = [
        createMockUserEntity('active-user', 'active@example.com', 'INSTITUTION_ADMIN', true, false),
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers as UserEntity[], 1]);

      // When
      const result = await useCase.execute(query);

      // Then
      expect(result.data.length).toBe(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.isActive = :isActive', {
        isActive: true,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.isBanned = :isBanned', {
        isBanned: false,
      });
    });

    it('BANNED 상태로 필터링하여 조회한다', async () => {
      // Given
      const query = createQuery({ status: UserStatusFilter.BANNED });
      const mockUsers = [
        createMockUserEntity('banned-user', 'banned@example.com', 'INSTITUTION_ADMIN', false, true),
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers as UserEntity[], 1]);

      // When
      const result = await useCase.execute(query);

      // Then
      expect(result.data[0].isBanned).toBe(true);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.isBanned = :isBanned', {
        isBanned: true,
      });
    });

    it('INACTIVE 상태로 필터링하여 조회한다', async () => {
      // Given
      const query = createQuery({ status: UserStatusFilter.INACTIVE });
      const mockUsers = [
        createMockUserEntity('inactive-user', 'inactive@example.com', 'INSTITUTION_ADMIN', false, false),
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers as UserEntity[], 1]);

      // When
      const result = await useCase.execute(query);

      // Then
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.isActive = :isActive', {
        isActive: false,
      });
    });

    it('검색어로 이메일과 이름을 검색한다', async () => {
      // Given
      const query = createQuery({ search: 'test' });
      const mockUsers = [createMockUserEntity('test-user', 'test@example.com', 'INSTITUTION_ADMIN')];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers as UserEntity[], 1]);

      // When
      const result = await useCase.execute(query);

      // Then
      expect(result.data.length).toBe(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(user.email ILIKE :search OR user.realName ILIKE :search)',
        { search: '%test%' },
      );
    });

    it('이메일 인증 여부로 필터링한다', async () => {
      // Given
      const query = createQuery({ isEmailVerified: true });
      const mockUsers = [createMockUserEntity('verified-user', 'verified@example.com', 'INSTITUTION_ADMIN')];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers as UserEntity[], 1]);

      // When
      const result = await useCase.execute(query);

      // Then
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.isEmailVerified = :isEmailVerified',
        { isEmailVerified: true },
      );
    });

    it('정렬 기준과 순서를 지정할 수 있다', async () => {
      // Given
      const query = createQuery({ sortBy: 'email', sortOrder: SortOrder.ASC });
      const mockUsers = [
        createMockUserEntity('user-1', 'aaa@example.com', 'INSTITUTION_ADMIN'),
        createMockUserEntity('user-2', 'bbb@example.com', 'COUNSELOR'),
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers as UserEntity[], 2]);

      // When
      await useCase.execute(query);

      // Then
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('user.email', SortOrder.ASC);
    });

    it('기본 정렬은 createdAt DESC이다', async () => {
      // Given
      const query = createQuery();
      const mockUsers: UserEntity[] = [];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers, 0]);

      // When
      await useCase.execute(query);

      // Then
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('user.createdAt', 'DESC');
    });

    it('빈 결과를 올바르게 반환한다', async () => {
      // Given
      const query = createQuery({ search: 'nonexistent' });
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      // When
      const result = await useCase.execute(query);

      // Then
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasNext).toBe(false);
    });

    it('응답 DTO에 모든 필수 필드가 포함된다', async () => {
      // Given
      const query = createQuery();
      const mockUser = createMockUserEntity(
        'user-123',
        'complete@example.com',
        'INSTITUTION_ADMIN',
        true,
        true,
      );
      mockUser.banReason = '테스트 정지 사유';
      mockUser.bannedAt = new Date('2024-01-01');

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockUser as UserEntity], 1]);

      // When
      const result = await useCase.execute(query);

      // Then
      const user = result.data[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('realName');
      expect(user).toHaveProperty('phoneNumber');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('isEmailVerified');
      expect(user).toHaveProperty('isActive');
      expect(user).toHaveProperty('isBanned');
      expect(user).toHaveProperty('banReason');
      expect(user).toHaveProperty('bannedAt');
      expect(user).toHaveProperty('lastLoginAt');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
    });
  });
});
