import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DomainError, Result } from '@domain/common/result';
import { CounselRequestStatus } from '@domain/counsel-request/model/value-objects/counsel-request-enums';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { AdminUpdateCounselRequestStatusDto } from './dto/admin-update-status.dto';
import { UpdateCounselRequestStatusAdminUseCase } from './update-status.admin.usecase';

describe('UpdateCounselRequestStatusAdminUseCase', () => {
  let useCase: UpdateCounselRequestStatusAdminUseCase;
  let mockCounselRequestRepository: jest.Mocked<CounselRequestRepository>;

  beforeEach(async () => {
    mockCounselRequestRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByChildId: jest.fn(),
      findByStatus: jest.fn(),
      findByInstitutionId: jest.fn(),
      findByCounselorId: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCounselRequestStatusAdminUseCase,
        {
          provide: 'CounselRequestRepository',
          useValue: mockCounselRequestRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateCounselRequestStatusAdminUseCase>(
      UpdateCounselRequestStatusAdminUseCase,
    );
  });

  const createMockCounselRequest = (id: string, status: CounselRequestStatus) => ({
    id,
    status,
    adminForceStatus: jest.fn().mockReturnValue(Result.ok(undefined)),
  });

  describe('상담의뢰 상태 강제 변경', () => {
    it('PENDING 상태의 상담의뢰를 REJECTED로 변경한다', async () => {
      // Given
      const id = 'counsel-request-123';
      const dto: AdminUpdateCounselRequestStatusDto = {
        newStatus: CounselRequestStatus.REJECTED,
        reason: '시스템 오류로 인한 상태 재조정입니다',
      };
      const mockCounselRequest = createMockCounselRequest(id, CounselRequestStatus.PENDING);

      mockCounselRequestRepository.findById.mockResolvedValue(mockCounselRequest as any);
      mockCounselRequestRepository.save.mockResolvedValue(mockCounselRequest as any);

      // When
      const result = await useCase.execute(id, dto, 'admin-123');

      // Then
      expect(result.previousStatus).toBe(CounselRequestStatus.PENDING);
      expect(result.newStatus).toBe(CounselRequestStatus.REJECTED);
      expect(mockCounselRequest.adminForceStatus).toHaveBeenCalledWith(dto.newStatus, dto.reason);
      expect(mockCounselRequestRepository.save).toHaveBeenCalledWith(mockCounselRequest);
    });

    it('존재하지 않는 상담의뢰의 상태를 변경하면 NotFoundException을 던진다', async () => {
      // Given
      const id = 'non-existent-id';
      const dto: AdminUpdateCounselRequestStatusDto = {
        newStatus: CounselRequestStatus.REJECTED,
        reason: '테스트 목적의 상태 변경입니다',
      };

      mockCounselRequestRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(useCase.execute(id, dto, 'admin-123')).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(id, dto, 'admin-123')).rejects.toThrow(
        `상담의뢰를 찾을 수 없습니다: ${id}`,
      );
      expect(mockCounselRequestRepository.save).not.toHaveBeenCalled();
    });

    it('COMPLETED 상태의 상담의뢰는 변경할 수 없다', async () => {
      // Given
      const id = 'completed-counsel-request';
      const dto: AdminUpdateCounselRequestStatusDto = {
        newStatus: CounselRequestStatus.PENDING,
        reason: '완료된 상담의뢰 상태 변경 시도입니다',
      };
      const mockCounselRequest = createMockCounselRequest(id, CounselRequestStatus.COMPLETED);

      mockCounselRequestRepository.findById.mockResolvedValue(mockCounselRequest as any);

      // When & Then
      await expect(useCase.execute(id, dto, 'admin-123')).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(id, dto, 'admin-123')).rejects.toThrow(
        '완료된 상담의뢰는 상태를 변경할 수 없습니다',
      );
      expect(mockCounselRequest.adminForceStatus).not.toHaveBeenCalled();
    });

    it('COMPLETED 상태로 직접 변경할 수 없다', async () => {
      // Given
      const id = 'counsel-request-123';
      const dto: AdminUpdateCounselRequestStatusDto = {
        newStatus: CounselRequestStatus.COMPLETED,
        reason: '관리자가 직접 완료 처리하려는 시도',
      };
      const mockCounselRequest = createMockCounselRequest(id, CounselRequestStatus.IN_PROGRESS);

      mockCounselRequestRepository.findById.mockResolvedValue(mockCounselRequest as any);

      // When & Then
      await expect(useCase.execute(id, dto, 'admin-123')).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(id, dto, 'admin-123')).rejects.toThrow(
        '관리자가 직접 완료 상태로 변경할 수 없습니다',
      );
      expect(mockCounselRequest.adminForceStatus).not.toHaveBeenCalled();
    });

    it('동일한 상태로 변경하면 BadRequestException을 던진다', async () => {
      // Given
      const id = 'counsel-request-123';
      const dto: AdminUpdateCounselRequestStatusDto = {
        newStatus: CounselRequestStatus.PENDING,
        reason: '동일 상태로 변경 시도입니다',
      };
      const mockCounselRequest = createMockCounselRequest(id, CounselRequestStatus.PENDING);

      mockCounselRequestRepository.findById.mockResolvedValue(mockCounselRequest as any);

      // When & Then
      await expect(useCase.execute(id, dto, 'admin-123')).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(id, dto, 'admin-123')).rejects.toThrow(
        '현재 상태와 동일한 상태로는 변경할 수 없습니다',
      );
    });

    it('IN_PROGRESS 상태에서 MATCHED로 롤백할 수 있다', async () => {
      // Given
      const id = 'counsel-request-456';
      const dto: AdminUpdateCounselRequestStatusDto = {
        newStatus: CounselRequestStatus.MATCHED,
        reason: '상담 진행 중 문제가 발생하여 매칭 상태로 롤백',
      };
      const mockCounselRequest = createMockCounselRequest(id, CounselRequestStatus.IN_PROGRESS);

      mockCounselRequestRepository.findById.mockResolvedValue(mockCounselRequest as any);
      mockCounselRequestRepository.save.mockResolvedValue(mockCounselRequest as any);

      // When
      const result = await useCase.execute(id, dto, 'admin-123');

      // Then
      expect(result.previousStatus).toBe(CounselRequestStatus.IN_PROGRESS);
      expect(result.newStatus).toBe(CounselRequestStatus.MATCHED);
      expect(mockCounselRequest.adminForceStatus).toHaveBeenCalled();
    });

    it('Domain 에러 발생 시 BadRequestException을 던진다', async () => {
      // Given
      const id = 'counsel-request-789';
      const dto: AdminUpdateCounselRequestStatusDto = {
        newStatus: CounselRequestStatus.REJECTED,
        reason: '짧은사유',
      };
      const mockCounselRequest = createMockCounselRequest(id, CounselRequestStatus.PENDING);

      mockCounselRequest.adminForceStatus.mockReturnValue(
        Result.fail(new DomainError('변경 사유는 최소 10자 이상이어야 합니다')),
      );

      mockCounselRequestRepository.findById.mockResolvedValue(mockCounselRequest as any);

      // When & Then
      await expect(useCase.execute(id, dto, 'admin-123')).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(id, dto, 'admin-123')).rejects.toThrow(
        '변경 사유는 최소 10자 이상이어야 합니다',
      );
      expect(mockCounselRequestRepository.save).not.toHaveBeenCalled();
    });

    it('RECOMMENDED 상태에서 PENDING으로 롤백할 수 있다', async () => {
      // Given
      const id = 'counsel-request-abc';
      const dto: AdminUpdateCounselRequestStatusDto = {
        newStatus: CounselRequestStatus.PENDING,
        reason: 'AI 추천 결과가 부적절하여 재추천을 위해 롤백',
      };
      const mockCounselRequest = createMockCounselRequest(id, CounselRequestStatus.RECOMMENDED);

      mockCounselRequestRepository.findById.mockResolvedValue(mockCounselRequest as any);
      mockCounselRequestRepository.save.mockResolvedValue(mockCounselRequest as any);

      // When
      const result = await useCase.execute(id, dto, 'admin-123');

      // Then
      expect(result.previousStatus).toBe(CounselRequestStatus.RECOMMENDED);
      expect(result.newStatus).toBe(CounselRequestStatus.PENDING);
    });
  });
});
