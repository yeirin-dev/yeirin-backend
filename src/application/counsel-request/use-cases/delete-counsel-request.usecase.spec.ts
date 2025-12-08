import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import {
  CareType,
  ConsentStatus,
  CounselRequestStatus,
  Gender,
} from '@domain/counsel-request/model/value-objects/counsel-request-enums';
import { CounselRequestFormData } from '@domain/counsel-request/model/value-objects/counsel-request-form-data';
import { DeleteCounselRequestUseCase } from './delete-counsel-request.usecase';

describe('DeleteCounselRequestUseCase', () => {
  let useCase: DeleteCounselRequestUseCase;
  let mockRepository: jest.Mocked<CounselRequestRepository>;

  beforeEach(async () => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByChildId: jest.fn(),
      findByGuardianId: jest.fn(),
      findByStatus: jest.fn(),
      findByInstitutionId: jest.fn(),
      findByCounselorId: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      countByGuardianIdAndStatus: jest.fn(),
      findRecentByGuardianId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteCounselRequestUseCase,
        {
          provide: 'CounselRequestRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteCounselRequestUseCase>(DeleteCounselRequestUseCase);
  });

  const createMockFormData = (): CounselRequestFormData => ({
    coverInfo: {
      requestDate: { year: 2025, month: 1, day: 15 },
      centerName: '행복한 지역아동센터',
      counselorName: '김담당',
    },
    basicInfo: {
      childInfo: {
        name: '홍길동',
        gender: Gender.MALE,
        age: 10,
        grade: '초4',
      },
      careType: CareType.GENERAL,
    },
    psychologicalInfo: {
      medicalHistory: '없음',
      specialNotes: '특이사항 없음',
    },
    requestMotivation: {
      motivation: '또래 관계에서 어려움을 겪고 있어 상담 의뢰합니다.',
      goals: '또래 관계 개선 및 자존감 향상',
    },
    testResults: {},
    consent: ConsentStatus.AGREED,
  });

  const createCounselRequest = (id: string): CounselRequest => {
    return CounselRequest.restore({
      id,
      childId: 'child-123',
      guardianId: 'guardian-123',
      status: CounselRequestStatus.PENDING,
      formData: createMockFormData(),
      centerName: '행복한 지역아동센터',
      careType: CareType.GENERAL,
      requestDate: new Date(2025, 0, 15),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  describe('상담의뢰지 삭제', () => {
    it('존재하는 상담의뢰지를 삭제한다', async () => {
      // Given
      const requestId = 'request-123';
      const counselRequest = createCounselRequest(requestId);
      mockRepository.findById.mockResolvedValue(counselRequest);
      mockRepository.delete.mockResolvedValue(undefined);

      // When
      await useCase.execute(requestId);

      // Then
      expect(mockRepository.findById).toHaveBeenCalledWith(requestId);
      expect(mockRepository.delete).toHaveBeenCalledWith(requestId);
    });

    it('존재하지 않는 상담의뢰지를 삭제하면 NotFoundException을 던진다', async () => {
      // Given
      const requestId = 'non-existent-id';
      mockRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(useCase.execute(requestId)).rejects.toThrow(NotFoundException);
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('삭제 전에 존재 여부를 확인한다', async () => {
      // Given
      const requestId = 'request-123';
      const counselRequest = createCounselRequest(requestId);
      mockRepository.findById.mockResolvedValue(counselRequest);
      mockRepository.delete.mockResolvedValue(undefined);

      // When
      await useCase.execute(requestId);

      // Then
      expect(mockRepository.findById).toHaveBeenCalledWith(requestId);
      expect(mockRepository.delete).toHaveBeenCalledWith(requestId);
    });
  });
});
