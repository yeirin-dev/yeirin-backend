import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DomainError, Result } from '@domain/common/result';
import { UserRepository } from '@domain/user/repository/user.repository';
import { UnbanUserAdminUseCase } from './unban-user.admin.usecase';

describe('UnbanUserAdminUseCase', () => {
  let useCase: UnbanUserAdminUseCase;
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
        UnbanUserAdminUseCase,
        {
          provide: 'UserRepository',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<UnbanUserAdminUseCase>(UnbanUserAdminUseCase);
  });

  const createMockUser = (id: string, isBanned: boolean = true) => ({
    id,
    isBanned,
    unban: jest.fn().mockReturnValue(Result.ok(undefined)),
  });

  describe('사용자 정지 해제', () => {
    it('정지된 사용자의 정지를 해제한다', async () => {
      // Given
      const userId = 'banned-user-123';
      const mockUser = createMockUser(userId, true);

      mockUserRepository.findById.mockResolvedValue(mockUser as any);
      mockUserRepository.save.mockResolvedValue(mockUser as any);

      // When
      await useCase.execute(userId);

      // Then
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUser.unban).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
    });

    it('존재하지 않는 사용자의 정지를 해제하면 NotFoundException을 던진다', async () => {
      // Given
      const userId = 'non-existent-user';

      mockUserRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(useCase.execute(userId)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(userId)).rejects.toThrow(`사용자를 찾을 수 없습니다: ${userId}`);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('정지되지 않은 사용자의 정지를 해제하면 BadRequestException을 던진다', async () => {
      // Given
      const userId = 'active-user-123';
      const mockUser = createMockUser(userId, false);

      mockUser.unban.mockReturnValue(Result.fail(new DomainError('정지되지 않은 계정입니다')));

      mockUserRepository.findById.mockResolvedValue(mockUser as any);

      // When & Then
      await expect(useCase.execute(userId)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(userId)).rejects.toThrow('정지되지 않은 계정입니다');
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('정지 해제 후 사용자 정보가 저장된다', async () => {
      // Given
      const userId = 'banned-user-456';
      const mockUser = createMockUser(userId, true);

      mockUserRepository.findById.mockResolvedValue(mockUser as any);
      mockUserRepository.save.mockResolvedValue(mockUser as any);

      // When
      await useCase.execute(userId);

      // Then
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
    });
  });
});
