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
import { S3Service } from '@infrastructure/storage/s3.service';
import { GetCounselRequestsByChildUseCase } from './get-counsel-requests-by-child.usecase';

describe('GetCounselRequestsByChildUseCase', () => {
  let useCase: GetCounselRequestsByChildUseCase;
  let mockRepository: jest.Mocked<CounselRequestRepository>;
  let mockS3Service: jest.Mocked<S3Service>;

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

    mockS3Service = {
      getPresignedUrl: jest.fn(),
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    } as unknown as jest.Mocked<S3Service>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCounselRequestsByChildUseCase,
        {
          provide: 'CounselRequestRepository',
          useValue: mockRepository,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    useCase = module.get<GetCounselRequestsByChildUseCase>(GetCounselRequestsByChildUseCase);
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
    childId: string,
    status: CounselRequestStatus = CounselRequestStatus.PENDING,
  ): CounselRequest => {
    return CounselRequest.restore({
      id,
      childId,
      status,
      formData: createMockFormData(),
      centerName: '행복한 지역아동센터',
      careType: CareType.GENERAL,
      requestDate: new Date(2025, 0, 15),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  describe('아동별 상담의뢰지 목록 조회', () => {
    it('아동 ID로 상담의뢰지 목록을 조회한다', async () => {
      // Given
      const childId = 'child-123';
      const counselRequests = [
        createCounselRequest('request-1', childId, CounselRequestStatus.PENDING),
        createCounselRequest('request-2', childId, CounselRequestStatus.COMPLETED),
      ];
      mockRepository.findByChildId.mockResolvedValue(counselRequests);

      // When
      const result = await useCase.execute(childId);

      // Then
      expect(result).toHaveLength(2);
      expect(result[0].childId).toBe(childId);
      expect(result[1].childId).toBe(childId);
      expect(mockRepository.findByChildId).toHaveBeenCalledWith(childId);
    });

    it('상담의뢰지가 없는 아동 조회시 빈 배열을 반환한다', async () => {
      // Given
      const childId = 'child-no-requests';
      mockRepository.findByChildId.mockResolvedValue([]);

      // When
      const result = await useCase.execute(childId);

      // Then
      expect(result).toHaveLength(0);
      expect(mockRepository.findByChildId).toHaveBeenCalledWith(childId);
    });

    it('여러 상태의 상담의뢰지를 모두 반환한다', async () => {
      // Given
      const childId = 'child-123';
      const counselRequests = [
        createCounselRequest('request-1', childId, CounselRequestStatus.PENDING),
        createCounselRequest('request-2', childId, CounselRequestStatus.IN_PROGRESS),
        createCounselRequest('request-3', childId, CounselRequestStatus.COMPLETED),
      ];
      mockRepository.findByChildId.mockResolvedValue(counselRequests);

      // When
      const result = await useCase.execute(childId);

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
      const childId = 'child-123';
      const counselRequests = [createCounselRequest('request-1', childId)];
      mockRepository.findByChildId.mockResolvedValue(counselRequests);

      // When
      const result = await useCase.execute(childId);

      // Then
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('childId');
      expect(result[0]).toHaveProperty('status');
      expect(result[0]).toHaveProperty('formData');
      expect(result[0]).toHaveProperty('centerName');
      expect(result[0]).toHaveProperty('careType');
    });
  });
});
