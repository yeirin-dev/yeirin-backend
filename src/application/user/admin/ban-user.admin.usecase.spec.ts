import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DomainError, Result } from '@domain/common/result';
import { UserRepository } from '@domain/user/repository/user.repository';
import { BanUserAdminUseCase } from './ban-user.admin.usecase';

describe('BanUserAdminUseCase', () => {
  let useCase: BanUserAdminUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      existsByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BanUserAdminUseCase,
        {
          provide: 'UserRepository',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<BanUserAdminUseCase>(BanUserAdminUseCase);
  });

  const createMockUser = (id: string, role: string, isBanned: boolean = false) => ({
    id,
    role: { value: role },
    isBanned,
    ban: jest.fn().mockReturnValue(Result.ok(undefined)),
    unban: jest.fn().mockReturnValue(Result.ok(undefined)),
  });

  describe('사용자 정지', () => {
    it('유효한 사유로 일반 사용자를 정지한다', async () => {
      // Given
      const userId = 'user-123';
      const dto = { reason: '서비스 이용 약관 위반으로 인한 계정 정지 처리입니다.' };
      const mockUser = createMockUser(userId, 'GUARDIAN');

      mockUserRepository.findById.mockResolvedValue(mockUser as any);
      mockUserRepository.save.mockResolvedValue(mockUser as any);

      // When
      await useCase.execute(userId, dto, 'admin-123');

      // Then
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUser.ban).toHaveBeenCalledWith(dto.reason);
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
    });

    it('존재하지 않는 사용자를 정지하면 NotFoundException을 던진다', async () => {
      // Given
      const userId = 'non-existent-user';
      const dto = { reason: '서비스 이용 약관 위반으로 인한 계정 정지' };

      mockUserRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(useCase.execute(userId, dto)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(userId, dto)).rejects.toThrow(
        `사용자를 찾을 수 없습니다: ${userId}`,
      );
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('ADMIN 역할 사용자를 정지하면 BadRequestException을 던진다', async () => {
      // Given
      const userId = 'admin-user-123';
      const dto = { reason: '관리자 계정 정지 시도' };
      const mockUser = createMockUser(userId, 'ADMIN');

      mockUserRepository.findById.mockResolvedValue(mockUser as any);

      // When & Then
      await expect(useCase.execute(userId, dto)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(userId, dto)).rejects.toThrow(
        '관리자 계정은 정지할 수 없습니다',
      );
      expect(mockUser.ban).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('이미 정지된 사용자를 정지하면 Domain 에러를 던진다', async () => {
      // Given
      const userId = 'banned-user-123';
      const dto = { reason: '이미 정지된 사용자 다시 정지 시도' };
      const mockUser = createMockUser(userId, 'GUARDIAN', true);

      mockUser.ban.mockReturnValue(Result.fail(new DomainError('이미 정지된 계정입니다')));

      mockUserRepository.findById.mockResolvedValue(mockUser as any);

      // When & Then
      await expect(useCase.execute(userId, dto)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(userId, dto)).rejects.toThrow('이미 정지된 계정입니다');
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('정지 사유가 너무 짧으면 Domain 에러를 던진다', async () => {
      // Given
      const userId = 'user-123';
      const dto = { reason: '짧은 사유' };
      const mockUser = createMockUser(userId, 'GUARDIAN');

      mockUser.ban.mockReturnValue(
        Result.fail(new DomainError('정지 사유는 최소 10자 이상이어야 합니다')),
      );

      mockUserRepository.findById.mockResolvedValue(mockUser as any);

      // When & Then
      await expect(useCase.execute(userId, dto)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(userId, dto)).rejects.toThrow(
        '정지 사유는 최소 10자 이상이어야 합니다',
      );
    });

    it('INSTITUTION_ADMIN 역할 사용자를 정지할 수 있다', async () => {
      // Given
      const userId = 'institution-admin-123';
      const dto = { reason: '기관 관리자 계정 서비스 이용 약관 위반' };
      const mockUser = createMockUser(userId, 'INSTITUTION_ADMIN');

      mockUserRepository.findById.mockResolvedValue(mockUser as any);
      mockUserRepository.save.mockResolvedValue(mockUser as any);

      // When
      await useCase.execute(userId, dto);

      // Then
      expect(mockUser.ban).toHaveBeenCalledWith(dto.reason);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('COUNSELOR 역할 사용자를 정지할 수 있다', async () => {
      // Given
      const userId = 'counselor-123';
      const dto = { reason: '상담사 계정 부적절한 상담 행위로 인한 정지' };
      const mockUser = createMockUser(userId, 'COUNSELOR');

      mockUserRepository.findById.mockResolvedValue(mockUser as any);
      mockUserRepository.save.mockResolvedValue(mockUser as any);

      // When
      await useCase.execute(userId, dto);

      // Then
      expect(mockUser.ban).toHaveBeenCalledWith(dto.reason);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });
});
