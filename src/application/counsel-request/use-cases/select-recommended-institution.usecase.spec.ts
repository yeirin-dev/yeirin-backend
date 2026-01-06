import { BadRequestException, NotFoundException } from '@nestjs/common';
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
import { CounselRequestRecommendation } from '@domain/counsel-request-recommendation/model/counsel-request-recommendation';
import { CounselRequestRecommendationRepository } from '@domain/counsel-request-recommendation/repository/counsel-request-recommendation.repository';
import { SelectRecommendedInstitutionUseCase } from './select-recommended-institution.usecase';

describe('SelectRecommendedInstitutionUseCase', () => {
  let useCase: SelectRecommendedInstitutionUseCase;
  let mockCounselRequestRepository: jest.Mocked<CounselRequestRepository>;
  let mockRecommendationRepository: jest.Mocked<CounselRequestRecommendationRepository>;

  beforeEach(async () => {
    mockCounselRequestRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByChildId: jest.fn(),
      findByStatus: jest.fn(),
      findByInstitutionId: jest.fn(),
      findByCounselorId: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    mockRecommendationRepository = {
      save: jest.fn(),
      saveAll: jest.fn(),
      findByCounselRequestId: jest.fn(),
      findById: jest.fn(),
      findSelectedByCounselRequestId: jest.fn(),
      deleteByCounselRequestId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SelectRecommendedInstitutionUseCase,
        {
          provide: 'CounselRequestRepository',
          useValue: mockCounselRequestRepository,
        },
        {
          provide: 'CounselRequestRecommendationRepository',
          useValue: mockRecommendationRepository,
        },
      ],
    }).compile();

    useCase = module.get<SelectRecommendedInstitutionUseCase>(SelectRecommendedInstitutionUseCase);
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

  const createRecommendedCounselRequest = (id: string): CounselRequest => {
    return CounselRequest.restore({
      id,
      childId: 'child-123',
      status: CounselRequestStatus.RECOMMENDED,
      formData: createMockFormData(),
      centerName: '행복한 지역아동센터',
      careType: CareType.GENERAL,
      requestDate: new Date(2025, 0, 15),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const createPendingCounselRequest = (id: string): CounselRequest => {
    return CounselRequest.restore({
      id,
      childId: 'child-123',
      status: CounselRequestStatus.PENDING,
      formData: createMockFormData(),
      centerName: '행복한 지역아동센터',
      careType: CareType.GENERAL,
      requestDate: new Date(2025, 0, 15),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const createRecommendation = (
    counselRequestId: string,
    institutionId: string,
    rank: number,
    selected = false,
  ): CounselRequestRecommendation => {
    return CounselRequestRecommendation.restore({
      id: `rec-${rank}`,
      counselRequestId,
      institutionId,
      score: 0.9 - rank * 0.1,
      reason: `추천 이유 ${rank}`,
      rank,
      selected,
      createdAt: new Date(),
    });
  };

  describe('추천 기관 선택', () => {
    it('추천 목록에서 기관을 선택한다', async () => {
      // Given
      const requestId = 'request-123';
      const institutionId = 'institution-1';
      const counselRequest = createRecommendedCounselRequest(requestId);

      const recommendations = [
        createRecommendation(requestId, 'institution-1', 1),
        createRecommendation(requestId, 'institution-2', 2),
        createRecommendation(requestId, 'institution-3', 3),
      ];

      mockCounselRequestRepository.findById.mockResolvedValue(counselRequest);
      mockRecommendationRepository.findByCounselRequestId.mockResolvedValue(recommendations);
      mockRecommendationRepository.save.mockImplementation(async (rec) => rec);
      mockCounselRequestRepository.save.mockImplementation(async (req) => req);

      // When
      const result = await useCase.execute(requestId, institutionId);

      // Then
      expect(result.status).toBe(CounselRequestStatus.MATCHED);
      expect(result.matchedInstitutionId).toBe(institutionId);
      expect(mockRecommendationRepository.save).toHaveBeenCalled();
      expect(mockCounselRequestRepository.save).toHaveBeenCalled();
    });

    it('존재하지 않는 상담의뢰지를 선택하면 NotFoundException을 던진다', async () => {
      // Given
      mockCounselRequestRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(useCase.execute('non-existent', 'institution-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('추천 목록이 없으면 BadRequestException을 던진다', async () => {
      // Given
      const requestId = 'request-123';
      const counselRequest = createRecommendedCounselRequest(requestId);
      mockCounselRequestRepository.findById.mockResolvedValue(counselRequest);
      mockRecommendationRepository.findByCounselRequestId.mockResolvedValue([]);

      // When & Then
      await expect(useCase.execute(requestId, 'institution-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(requestId, 'institution-1')).rejects.toThrow(
        '추천 목록이 없습니다',
      );
    });

    it('추천 목록에 없는 기관을 선택하면 BadRequestException을 던진다', async () => {
      // Given
      const requestId = 'request-123';
      const counselRequest = createRecommendedCounselRequest(requestId);
      const recommendations = [
        createRecommendation(requestId, 'institution-1', 1),
        createRecommendation(requestId, 'institution-2', 2),
      ];

      mockCounselRequestRepository.findById.mockResolvedValue(counselRequest);
      mockRecommendationRepository.findByCounselRequestId.mockResolvedValue(recommendations);

      // When & Then
      await expect(useCase.execute(requestId, 'institution-not-in-list')).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(requestId, 'institution-not-in-list')).rejects.toThrow(
        '선택한 기관이 추천 목록에 없습니다',
      );
    });

    it('RECOMMENDED 상태가 아닌 상담의뢰지에서 기관 선택시 실패한다', async () => {
      // Given
      const requestId = 'request-123';
      const counselRequest = createPendingCounselRequest(requestId);
      const recommendations = [createRecommendation(requestId, 'institution-1', 1)];

      mockCounselRequestRepository.findById.mockResolvedValue(counselRequest);
      mockRecommendationRepository.findByCounselRequestId.mockResolvedValue(recommendations);
      mockRecommendationRepository.save.mockImplementation(async (rec) => rec);

      // When & Then
      await expect(useCase.execute(requestId, 'institution-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('응답 DTO 변환', () => {
    it('선택 후 CounselRequestResponseDto로 변환한다', async () => {
      // Given
      const requestId = 'request-123';
      const institutionId = 'institution-1';
      const counselRequest = createRecommendedCounselRequest(requestId);
      const recommendations = [createRecommendation(requestId, institutionId, 1)];

      mockCounselRequestRepository.findById.mockResolvedValue(counselRequest);
      mockRecommendationRepository.findByCounselRequestId.mockResolvedValue(recommendations);
      mockRecommendationRepository.save.mockImplementation(async (rec) => rec);
      mockCounselRequestRepository.save.mockImplementation(async (req) => req);

      // When
      const result = await useCase.execute(requestId, institutionId);

      // Then
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('matchedInstitutionId');
      expect(result.status).toBe(CounselRequestStatus.MATCHED);
    });
  });
});
