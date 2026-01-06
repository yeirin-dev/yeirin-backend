import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';
import {
  CareType,
  ConsentStatus,
  CounselRequestStatus,
  Gender,
} from '@domain/counsel-request/model/value-objects/counsel-request-enums';
import { CounselRequestFormData } from '@domain/counsel-request/model/value-objects/counsel-request-form-data';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { CompleteCounselingUseCase } from './complete-counseling.usecase';

describe('CompleteCounselingUseCase', () => {
  let useCase: CompleteCounselingUseCase;
  let mockRepository: jest.Mocked<CounselRequestRepository>;

  beforeEach(async () => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByChildId: jest.fn(),
      findByStatus: jest.fn(),
      findByInstitutionId: jest.fn(),
      findByCounselorId: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompleteCounselingUseCase,
        {
          provide: 'CounselRequestRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<CompleteCounselingUseCase>(CompleteCounselingUseCase);
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

  const createInProgressCounselRequest = (id: string): CounselRequest => {
    return CounselRequest.restore({
      id,
      childId: 'child-123',
      status: CounselRequestStatus.IN_PROGRESS,
      formData: createMockFormData(),
      centerName: '행복한 지역아동센터',
      careType: CareType.GENERAL,
      requestDate: new Date(2025, 0, 15),
      matchedInstitutionId: 'institution-123',
      matchedCounselorId: 'counselor-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const createMatchedCounselRequest = (id: string): CounselRequest => {
    return CounselRequest.restore({
      id,
      childId: 'child-123',
      status: CounselRequestStatus.MATCHED,
      formData: createMockFormData(),
      centerName: '행복한 지역아동센터',
      careType: CareType.GENERAL,
      requestDate: new Date(2025, 0, 15),
      matchedInstitutionId: 'institution-123',
      matchedCounselorId: 'counselor-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const createCompletedCounselRequest = (id: string): CounselRequest => {
    return CounselRequest.restore({
      id,
      childId: 'child-123',
      status: CounselRequestStatus.COMPLETED,
      formData: createMockFormData(),
      centerName: '행복한 지역아동센터',
      careType: CareType.GENERAL,
      requestDate: new Date(2025, 0, 15),
      matchedInstitutionId: 'institution-123',
      matchedCounselorId: 'counselor-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  describe('상담 완료', () => {
    it('진행 중인 상담을 완료한다', async () => {
      // Given
      const requestId = 'request-123';
      const counselRequest = createInProgressCounselRequest(requestId);
      mockRepository.findById.mockResolvedValue(counselRequest);
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      const result = await useCase.execute(requestId);

      // Then
      expect(result.status).toBe(CounselRequestStatus.COMPLETED);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 상담의뢰를 완료하면 NotFoundException을 던진다', async () => {
      // Given
      const requestId = 'non-existent-id';
      mockRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(useCase.execute(requestId)).rejects.toThrow(NotFoundException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('매칭 완료 상태에서 바로 완료하면 실패한다', async () => {
      // Given
      const requestId = 'request-123';
      const counselRequest = createMatchedCounselRequest(requestId);
      mockRepository.findById.mockResolvedValue(counselRequest);

      // When & Then
      await expect(useCase.execute(requestId)).rejects.toThrow(
        '상담 진행 중 상태에서만 완료할 수 있습니다',
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('이미 완료된 상담을 다시 완료하면 실패한다', async () => {
      // Given
      const requestId = 'request-123';
      const counselRequest = createCompletedCounselRequest(requestId);
      mockRepository.findById.mockResolvedValue(counselRequest);

      // When & Then
      await expect(useCase.execute(requestId)).rejects.toThrow(
        '상담 진행 중 상태에서만 완료할 수 있습니다',
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('응답 DTO 변환', () => {
    it('상담 완료 후 CounselRequestResponseDto로 변환한다', async () => {
      // Given
      const requestId = 'request-123';
      const counselRequest = createInProgressCounselRequest(requestId);
      mockRepository.findById.mockResolvedValue(counselRequest);
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      const result = await useCase.execute(requestId);

      // Then
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('childId');
      expect(result).toHaveProperty('status');
      expect(result.status).toBe(CounselRequestStatus.COMPLETED);
      expect(result).toHaveProperty('matchedInstitutionId');
      expect(result).toHaveProperty('matchedCounselorId');
    });
  });
});
