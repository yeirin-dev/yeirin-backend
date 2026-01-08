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
import { SoulEClient } from '@infrastructure/external/soul-e.client';
import { YeirinAIClient } from '@infrastructure/external/yeirin-ai.client';
import { CreateCounselRequestDto } from '../dto/create-counsel-request.dto';
import { CreateCounselRequestUseCase } from './create-counsel-request.usecase';

describe('CreateCounselRequestUseCase', () => {
  let useCase: CreateCounselRequestUseCase;
  let mockRepository: jest.Mocked<CounselRequestRepository>;
  let mockYeirinAIClient: jest.Mocked<YeirinAIClient>;
  let mockSoulEClient: jest.Mocked<SoulEClient>;

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

    mockYeirinAIClient = {
      requestIntegratedReport: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<YeirinAIClient>;

    mockSoulEClient = {
      getLatestAssessmentResult: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<SoulEClient>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCounselRequestUseCase,
        {
          provide: 'CounselRequestRepository',
          useValue: mockRepository,
        },
        {
          provide: YeirinAIClient,
          useValue: mockYeirinAIClient,
        },
        {
          provide: SoulEClient,
          useValue: mockSoulEClient,
        },
      ],
    }).compile();

    useCase = module.get<CreateCounselRequestUseCase>(CreateCounselRequestUseCase);
  });

  const createValidFormData = (): CounselRequestFormData => ({
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

  const createValidDto = (): CreateCounselRequestDto => ({
    childId: '123e4567-e89b-12d3-a456-426614174001',
    ...createValidFormData(),
  });

  describe('상담의뢰지 생성', () => {
    it('유효한 정보로 상담의뢰지를 생성한다', async () => {
      // Given
      const dto = createValidDto();
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result).toBeDefined();
      expect(result.childId).toBe(dto.childId);
      expect(result.status).toBe(CounselRequestStatus.PENDING);
      expect(result.centerName).toBe('행복한 지역아동센터');
      expect(result.careType).toBe(CareType.GENERAL);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('생성된 상담의뢰지는 PENDING 상태이다', async () => {
      // Given
      const dto = createValidDto();
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.status).toBe(CounselRequestStatus.PENDING);
    });

    it('우선돌봄 아동이면서 세부 사유가 없으면 실패한다', async () => {
      // Given
      const dto = createValidDto();
      dto.basicInfo.careType = CareType.PRIORITY;
      dto.basicInfo.priorityReasons = undefined;

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow(
        '우선돌봄 아동은 세부 사유를 최소 1개 이상 선택해야 합니다',
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('센터명이 없으면 실패한다', async () => {
      // Given
      const dto = createValidDto();
      dto.coverInfo.centerName = '';

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow('센터명은 필수입니다');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('담당자 이름이 없으면 실패한다', async () => {
      // Given
      const dto = createValidDto();
      dto.coverInfo.counselorName = '';

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow('담당자 이름은 필수입니다');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('아동 이름이 없으면 실패한다', async () => {
      // Given
      const dto = createValidDto();
      dto.basicInfo.childInfo.name = '';

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow('아동 이름은 필수입니다');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('유효하지 않은 월(13월)이면 실패한다', async () => {
      // Given
      const dto = createValidDto();
      dto.coverInfo.requestDate.month = 13;

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow('월은 1-12 사이여야 합니다');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('유효하지 않은 일(32일)이면 실패한다', async () => {
      // Given
      const dto = createValidDto();
      dto.coverInfo.requestDate.day = 32;

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow('일은 1-31 사이여야 합니다');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('응답 DTO 변환', () => {
    it('CounselRequest를 CounselRequestResponseDto로 변환한다', async () => {
      // Given
      const dto = createValidDto();
      mockRepository.save.mockImplementation(async (request) => request);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('childId');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('formData');
      expect(result).toHaveProperty('centerName');
      expect(result).toHaveProperty('careType');
      expect(result).toHaveProperty('requestDate');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
  });
});
