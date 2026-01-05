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
import { UpdateCounselRequestDto } from '../dto/update-counsel-request.dto';
import { UpdateCounselRequestUseCase } from './update-counsel-request.usecase';

describe('UpdateCounselRequestUseCase', () => {
  let useCase: UpdateCounselRequestUseCase;
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
        UpdateCounselRequestUseCase,
        {
          provide: 'CounselRequestRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateCounselRequestUseCase>(UpdateCounselRequestUseCase);
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

  const createPendingCounselRequest = (id: string): CounselRequest => {
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

  const createMatchedCounselRequest = (id: string): CounselRequest => {
    return CounselRequest.restore({
      id,
      childId: 'child-123',
      guardianId: 'guardian-123',
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

  describe('상담의뢰지 수정', () => {
    it('접수 대기 상태의 상담의뢰지를 수정한다', async () => {
      // Given
      const requestId = 'request-123';
      const counselRequest = createPendingCounselRequest(requestId);
      mockRepository.findById.mockResolvedValue(counselRequest);
      mockRepository.save.mockImplementation(async (request) => request);

      const updateDto: UpdateCounselRequestDto = {
        requestMotivation: {
          motivation: '수정된 의뢰 동기입니다.',
          goals: '수정된 상담 목표입니다.',
        },
      };

      // When
      const result = await useCase.execute(requestId, updateDto);

      // Then
      expect(result.formData.requestMotivation.motivation).toBe('수정된 의뢰 동기입니다.');
      expect(result.formData.requestMotivation.goals).toBe('수정된 상담 목표입니다.');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 상담의뢰지를 수정하면 NotFoundException을 던진다', async () => {
      // Given
      const requestId = 'non-existent-id';
      mockRepository.findById.mockResolvedValue(null);

      const updateDto: UpdateCounselRequestDto = {
        requestMotivation: {
          motivation: '수정된 의뢰 동기',
          goals: '수정된 상담 목표',
        },
      };

      // When & Then
      await expect(useCase.execute(requestId, updateDto)).rejects.toThrow(NotFoundException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('매칭 완료 상태의 상담의뢰지를 수정하면 실패한다', async () => {
      // Given
      const requestId = 'request-123';
      const counselRequest = createMatchedCounselRequest(requestId);
      mockRepository.findById.mockResolvedValue(counselRequest);

      const updateDto: UpdateCounselRequestDto = {
        requestMotivation: {
          motivation: '수정된 의뢰 동기',
          goals: '수정된 상담 목표',
        },
      };

      // When & Then
      await expect(useCase.execute(requestId, updateDto)).rejects.toThrow(
        '접수 대기 상태에서만 수정할 수 있습니다',
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('센터명을 수정하면 centerName 필드도 업데이트된다', async () => {
      // Given
      const requestId = 'request-123';
      const counselRequest = createPendingCounselRequest(requestId);
      mockRepository.findById.mockResolvedValue(counselRequest);
      mockRepository.save.mockImplementation(async (request) => request);

      const updateDto: UpdateCounselRequestDto = {
        coverInfo: {
          requestDate: { year: 2025, month: 1, day: 15 },
          centerName: '새로운 지역아동센터',
          counselorName: '김담당',
        },
      };

      // When
      const result = await useCase.execute(requestId, updateDto);

      // Then
      expect(result.centerName).toBe('새로운 지역아동센터');
      expect(result.formData.coverInfo.centerName).toBe('새로운 지역아동센터');
    });

    it('부분 업데이트시 기존 데이터가 유지된다', async () => {
      // Given
      const requestId = 'request-123';
      const counselRequest = createPendingCounselRequest(requestId);
      mockRepository.findById.mockResolvedValue(counselRequest);
      mockRepository.save.mockImplementation(async (request) => request);

      const updateDto: UpdateCounselRequestDto = {
        psychologicalInfo: {
          medicalHistory: '수정된 병력',
          specialNotes: '수정된 특이사항',
        },
      };

      // When
      const result = await useCase.execute(requestId, updateDto);

      // Then
      // 수정된 부분
      expect(result.formData.psychologicalInfo.medicalHistory).toBe('수정된 병력');
      // 유지된 부분
      expect(result.formData.coverInfo.centerName).toBe('행복한 지역아동센터');
      expect(result.formData.basicInfo.childInfo.name).toBe('홍길동');
    });
  });

  describe('응답 DTO 변환', () => {
    it('수정된 CounselRequest를 CounselRequestResponseDto로 변환한다', async () => {
      // Given
      const requestId = 'request-123';
      const counselRequest = createPendingCounselRequest(requestId);
      mockRepository.findById.mockResolvedValue(counselRequest);
      mockRepository.save.mockImplementation(async (request) => request);

      const updateDto: UpdateCounselRequestDto = {
        requestMotivation: {
          motivation: '수정된 의뢰 동기',
          goals: '수정된 상담 목표',
        },
      };

      // When
      const result = await useCase.execute(requestId, updateDto);

      // Then
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('childId');
      expect(result).toHaveProperty('guardianId');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('formData');
      expect(result).toHaveProperty('updatedAt');
    });
  });
});
