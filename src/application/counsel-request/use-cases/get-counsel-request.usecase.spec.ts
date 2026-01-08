import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Child } from '@domain/child/model/child';
import { BirthDate } from '@domain/child/model/value-objects/birth-date.vo';
import { ChildName } from '@domain/child/model/value-objects/child-name.vo';
import { ChildType, ChildTypeValue } from '@domain/child/model/value-objects/child-type.vo';
import { Gender as ChildGender } from '@domain/child/model/value-objects/gender.vo';
import { GenderType } from '@domain/child/model/value-objects/gender.vo';
import { ChildRepository } from '@domain/child/repository/child.repository';
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
import { CounselRequestAuthContext, GetCounselRequestUseCase } from './get-counsel-request.usecase';

describe('GetCounselRequestUseCase', () => {
  let useCase: GetCounselRequestUseCase;
  let mockRepository: jest.Mocked<CounselRequestRepository>;
  let mockChildRepository: jest.Mocked<ChildRepository>;
  let mockS3Service: jest.Mocked<S3Service>;

  const mockAuthContext: CounselRequestAuthContext = {
    institutionId: 'institution-123',
    facilityType: 'CARE_FACILITY',
  };

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

    mockChildRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCareFacilityId: jest.fn(),
      findByCommunityChildCenterId: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      countByCareFacilityId: jest.fn(),
      countByCommunityChildCenterId: jest.fn(),
    };

    mockS3Service = {
      getPresignedUrl: jest.fn(),
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    } as unknown as jest.Mocked<S3Service>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCounselRequestUseCase,
        {
          provide: 'CounselRequestRepository',
          useValue: mockRepository,
        },
        {
          provide: 'ChildRepository',
          useValue: mockChildRepository,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    useCase = module.get<GetCounselRequestUseCase>(GetCounselRequestUseCase);
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
      status: CounselRequestStatus.PENDING,
      formData: createMockFormData(),
      centerName: '행복한 지역아동센터',
      careType: CareType.GENERAL,
      requestDate: new Date(2025, 0, 15),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const createMockChild = (id: string, careFacilityId: string | null): Child => {
    return Child.restore(
      {
        childType: ChildType.create(ChildTypeValue.CARE_FACILITY).getValue(),
        name: ChildName.create('홍길동').getValue(),
        birthDate: BirthDate.create(new Date('2015-05-15')).getValue(),
        gender: ChildGender.create(GenderType.MALE).getValue(),
        careFacilityId,
        communityChildCenterId: null,
      },
      id,
      new Date(),
    );
  };

  describe('상담의뢰지 단일 조회', () => {
    it('ID로 상담의뢰지를 조회한다', async () => {
      // Given
      const requestId = 'request-123';
      const counselRequest = createCounselRequest(requestId);
      const child = createMockChild('child-123', 'institution-123');
      mockRepository.findById.mockResolvedValue(counselRequest);
      mockChildRepository.findById.mockResolvedValue(child);

      // When
      const result = await useCase.execute(requestId, mockAuthContext);

      // Then
      expect(result.id).toBe(requestId);
      expect(result.childId).toBe('child-123');
      expect(result.status).toBe(CounselRequestStatus.PENDING);
      expect(mockRepository.findById).toHaveBeenCalledWith(requestId);
    });

    it('존재하지 않는 ID로 조회하면 NotFoundException을 던진다', async () => {
      // Given
      const requestId = 'non-existent-id';
      mockRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(useCase.execute(requestId, mockAuthContext)).rejects.toThrow(NotFoundException);
      expect(mockRepository.findById).toHaveBeenCalledWith(requestId);
    });

    it('다른 시설의 상담의뢰지를 조회하면 ForbiddenException을 던진다', async () => {
      // Given
      const requestId = 'request-123';
      const counselRequest = createCounselRequest(requestId);
      const child = createMockChild('child-123', 'other-institution');
      mockRepository.findById.mockResolvedValue(counselRequest);
      mockChildRepository.findById.mockResolvedValue(child);

      // When & Then
      await expect(useCase.execute(requestId, mockAuthContext)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('응답 DTO 변환', () => {
    it('CounselRequest를 CounselRequestResponseDto로 변환한다', async () => {
      // Given
      const requestId = 'request-123';
      const counselRequest = createCounselRequest(requestId);
      const child = createMockChild('child-123', 'institution-123');
      mockRepository.findById.mockResolvedValue(counselRequest);
      mockChildRepository.findById.mockResolvedValue(child);

      // When
      const result = await useCase.execute(requestId, mockAuthContext);

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

    it('formData가 올바르게 포함된다', async () => {
      // Given
      const requestId = 'request-123';
      const counselRequest = createCounselRequest(requestId);
      const child = createMockChild('child-123', 'institution-123');
      mockRepository.findById.mockResolvedValue(counselRequest);
      mockChildRepository.findById.mockResolvedValue(child);

      // When
      const result = await useCase.execute(requestId, mockAuthContext);

      // Then
      expect(result.formData).toBeDefined();
      expect(result.formData.coverInfo.centerName).toBe('행복한 지역아동센터');
      expect(result.formData.basicInfo.childInfo.name).toBe('홍길동');
    });
  });
});
