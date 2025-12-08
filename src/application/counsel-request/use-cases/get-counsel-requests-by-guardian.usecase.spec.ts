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
import { GetCounselRequestsByGuardianUseCase } from './get-counsel-requests-by-guardian.usecase';

describe('GetCounselRequestsByGuardianUseCase', () => {
  let useCase: GetCounselRequestsByGuardianUseCase;
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
        GetCounselRequestsByGuardianUseCase,
        {
          provide: 'CounselRequestRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetCounselRequestsByGuardianUseCase>(
      GetCounselRequestsByGuardianUseCase,
    );
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

  const createCounselRequest = (
    id: string,
    guardianId: string,
    status: CounselRequestStatus = CounselRequestStatus.PENDING,
  ): CounselRequest => {
    return CounselRequest.restore({
      id,
      childId: 'child-123',
      guardianId,
      status,
      formData: createMockFormData(),
      centerName: '행복한 지역아동센터',
      careType: CareType.GENERAL,
      requestDate: new Date(2025, 0, 15),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  describe('보호자별 상담의뢰지 목록 조회', () => {
    it('보호자 ID로 상담의뢰지 목록을 조회한다', async () => {
      // Given
      const guardianId = 'guardian-123';
      const counselRequests = [
        createCounselRequest('request-1', guardianId, CounselRequestStatus.PENDING),
        createCounselRequest('request-2', guardianId, CounselRequestStatus.MATCHED),
        createCounselRequest('request-3', guardianId, CounselRequestStatus.COMPLETED),
      ];
      mockRepository.findByGuardianId.mockResolvedValue(counselRequests);

      // When
      const result = await useCase.execute(guardianId);

      // Then
      expect(result).toHaveLength(3);
      expect(result[0].guardianId).toBe(guardianId);
      expect(result[1].guardianId).toBe(guardianId);
      expect(result[2].guardianId).toBe(guardianId);
      expect(mockRepository.findByGuardianId).toHaveBeenCalledWith(guardianId);
    });

    it('상담의뢰지가 없는 보호자 조회시 NotFoundException을 던진다', async () => {
      // Given
      const guardianId = 'guardian-no-requests';
      mockRepository.findByGuardianId.mockResolvedValue([]);

      // When & Then
      await expect(useCase.execute(guardianId)).rejects.toThrow(NotFoundException);
      expect(mockRepository.findByGuardianId).toHaveBeenCalledWith(guardianId);
    });

    it('여러 상태의 상담의뢰지를 모두 반환한다', async () => {
      // Given
      const guardianId = 'guardian-123';
      const counselRequests = [
        createCounselRequest('request-1', guardianId, CounselRequestStatus.PENDING),
        createCounselRequest('request-2', guardianId, CounselRequestStatus.IN_PROGRESS),
        createCounselRequest('request-3', guardianId, CounselRequestStatus.COMPLETED),
      ];
      mockRepository.findByGuardianId.mockResolvedValue(counselRequests);

      // When
      const result = await useCase.execute(guardianId);

      // Then
      const statuses = result.map((r) => r.status);
      expect(statuses).toContain(CounselRequestStatus.PENDING);
      expect(statuses).toContain(CounselRequestStatus.IN_PROGRESS);
      expect(statuses).toContain(CounselRequestStatus.COMPLETED);
    });
  });

  describe('응답 DTO 변환', () => {
    it('각 CounselRequest를 CounselRequestResponseDto로 변환한다', async () => {
      // Given
      const guardianId = 'guardian-123';
      const counselRequests = [createCounselRequest('request-1', guardianId)];
      mockRepository.findByGuardianId.mockResolvedValue(counselRequests);

      // When
      const result = await useCase.execute(guardianId);

      // Then
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('childId');
      expect(result[0]).toHaveProperty('guardianId');
      expect(result[0]).toHaveProperty('status');
      expect(result[0]).toHaveProperty('formData');
      expect(result[0]).toHaveProperty('centerName');
      expect(result[0]).toHaveProperty('careType');
    });
  });
});
