import { Test, TestingModule } from '@nestjs/testing';
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
import { GuardianProfileRepository } from '@domain/guardian/repository/guardian-profile.repository';
import { GetGuardianDashboardUseCase } from './get-guardian-dashboard.usecase';

describe('GetGuardianDashboardUseCase', () => {
  let useCase: GetGuardianDashboardUseCase;
  let mockChildRepository: jest.Mocked<ChildRepository>;
  let mockCounselRequestRepository: jest.Mocked<CounselRequestRepository>;
  let mockGuardianProfileRepository: jest.Mocked<GuardianProfileRepository>;

  beforeEach(async () => {
    // NOTE: 모든 아동은 시설(Institution)에 직접 연결됩니다.
    //       findByGuardianId, countByGuardianId는 더 이상 사용되지 않습니다.
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

    mockCounselRequestRepository = {
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

    mockGuardianProfileRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByGuardianType: jest.fn(),
      findByCareFacilityId: jest.fn(),
      findByCommunityChildCenterId: jest.fn(),
      exists: jest.fn(),
      countByCareFacilityId: jest.fn(),
      countByCommunityChildCenterId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetGuardianDashboardUseCase,
        {
          provide: 'ChildRepository',
          useValue: mockChildRepository,
        },
        {
          provide: 'CounselRequestRepository',
          useValue: mockCounselRequestRepository,
        },
        {
          provide: 'GuardianProfileRepository',
          useValue: mockGuardianProfileRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetGuardianDashboardUseCase>(GetGuardianDashboardUseCase);
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
      motivation: '상담 의뢰 동기',
      goals: '상담 목표',
    },
    testResults: {},
    consent: ConsentStatus.AGREED,
  });

  const createCounselRequest = (id: string, status: CounselRequestStatus): CounselRequest => {
    return CounselRequest.restore({
      id,
      childId: 'child-123',
      guardianId: 'user-123',
      status,
      formData: createMockFormData(),
      centerName: '행복한 지역아동센터',
      careType: CareType.GENERAL,
      requestDate: new Date(2025, 0, 15),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  describe('보호자 대시보드 조회', () => {
    it('일반 보호자(부모)의 대시보드를 조회한다 - 아동 수는 0으로 반환 (더 이상 지원 안함)', async () => {
      // Given
      // NOTE: 일반 보호자(부모) 유형은 더 이상 아동과 연결되지 않습니다.
      //       시설 기반 인증으로 전환되었습니다.
      const userId = 'user-123';
      const guardianProfile = {
        id: 'guardian-123',
        userId,
        guardianType: 'PARENT',
        careFacilityId: null,
        communityChildCenterId: null,
      };

      mockGuardianProfileRepository.findByUserId.mockResolvedValue(guardianProfile as any);
      // countByGuardianId는 더 이상 사용되지 않음
      mockCounselRequestRepository.countByGuardianIdAndStatus.mockResolvedValue({
        total: 5,
        pending: 1,
        recommended: 1,
        matched: 1,
        inProgress: 1,
        completed: 1,
        rejected: 0,
      });
      mockCounselRequestRepository.findRecentByGuardianId.mockResolvedValue([
        createCounselRequest('request-1', CounselRequestStatus.PENDING),
        createCounselRequest('request-2', CounselRequestStatus.MATCHED),
      ]);

      // When
      const result = await useCase.execute(userId);

      // Then
      expect(result.childrenCount).toBe(0); // PARENT 유형은 더 이상 아동 수를 조회하지 않음
      expect(result.totalCounselRequests).toBe(5);
      expect(result.matchedCount).toBe(1);
      expect(result.inProgressCount).toBe(1);
      expect(result.pendingCount).toBe(2); // pending + recommended
      expect(result.completedCount).toBe(1);
      expect(result.recentActivities).toHaveLength(2);
    });

    it('양육시설 선생님의 대시보드를 조회한다', async () => {
      // Given
      const userId = 'user-teacher';
      const guardianProfile = {
        id: 'guardian-teacher',
        userId,
        guardianType: 'CARE_FACILITY_TEACHER',
        careFacilityId: 'facility-123',
        communityChildCenterId: null,
      };

      mockGuardianProfileRepository.findByUserId.mockResolvedValue(guardianProfile as any);
      mockChildRepository.countByCareFacilityId.mockResolvedValue(10);
      mockCounselRequestRepository.countByGuardianIdAndStatus.mockResolvedValue({
        total: 3,
        pending: 1,
        recommended: 0,
        matched: 1,
        inProgress: 1,
        completed: 0,
        rejected: 0,
      });
      mockCounselRequestRepository.findRecentByGuardianId.mockResolvedValue([]);

      // When
      const result = await useCase.execute(userId);

      // Then
      expect(result.childrenCount).toBe(10);
      expect(mockChildRepository.countByCareFacilityId).toHaveBeenCalledWith('facility-123');
    });

    it('지역아동센터 선생님의 대시보드를 조회한다', async () => {
      // Given
      const userId = 'user-center-teacher';
      const guardianProfile = {
        id: 'guardian-center-teacher',
        userId,
        guardianType: 'COMMUNITY_CENTER_TEACHER',
        careFacilityId: null,
        communityChildCenterId: 'center-123',
      };

      mockGuardianProfileRepository.findByUserId.mockResolvedValue(guardianProfile as any);
      mockChildRepository.countByCommunityChildCenterId.mockResolvedValue(15);
      mockCounselRequestRepository.countByGuardianIdAndStatus.mockResolvedValue({
        total: 0,
        pending: 0,
        recommended: 0,
        matched: 0,
        inProgress: 0,
        completed: 0,
        rejected: 0,
      });
      mockCounselRequestRepository.findRecentByGuardianId.mockResolvedValue([]);

      // When
      const result = await useCase.execute(userId);

      // Then
      expect(result.childrenCount).toBe(15);
      expect(mockChildRepository.countByCommunityChildCenterId).toHaveBeenCalledWith('center-123');
    });

    it('보호자 프로필이 없으면 아동 수 0을 반환한다', async () => {
      // Given
      const userId = 'user-no-profile';
      mockGuardianProfileRepository.findByUserId.mockResolvedValue(null);
      mockCounselRequestRepository.countByGuardianIdAndStatus.mockResolvedValue({
        total: 0,
        pending: 0,
        recommended: 0,
        matched: 0,
        inProgress: 0,
        completed: 0,
        rejected: 0,
      });
      mockCounselRequestRepository.findRecentByGuardianId.mockResolvedValue([]);

      // When
      const result = await useCase.execute(userId);

      // Then
      expect(result.childrenCount).toBe(0);
    });
  });

  describe('최근 활동 조회', () => {
    it('최근 7일간의 활동을 조회한다', async () => {
      // Given
      const userId = 'user-123';
      mockGuardianProfileRepository.findByUserId.mockResolvedValue({
        id: 'guardian-123',
        userId,
        guardianType: 'CARE_FACILITY_TEACHER',
        careFacilityId: 'facility-123',
      } as any);
      mockChildRepository.countByCareFacilityId.mockResolvedValue(1);
      mockCounselRequestRepository.countByGuardianIdAndStatus.mockResolvedValue({
        total: 3,
        pending: 1,
        recommended: 0,
        matched: 1,
        inProgress: 1,
        completed: 0,
        rejected: 0,
      });
      mockCounselRequestRepository.findRecentByGuardianId.mockResolvedValue([
        createCounselRequest('request-1', CounselRequestStatus.PENDING),
        createCounselRequest('request-2', CounselRequestStatus.MATCHED),
        createCounselRequest('request-3', CounselRequestStatus.IN_PROGRESS),
      ]);

      // When
      const result = await useCase.execute(userId);

      // Then
      expect(mockCounselRequestRepository.findRecentByGuardianId).toHaveBeenCalledWith(userId, 7);
      expect(result.recentActivities).toHaveLength(3);
      expect(result.recentActivities[0]).toHaveProperty('counselRequestId');
      expect(result.recentActivities[0]).toHaveProperty('childName');
      expect(result.recentActivities[0]).toHaveProperty('activityType');
      expect(result.recentActivities[0]).toHaveProperty('description');
      expect(result.recentActivities[0]).toHaveProperty('activityAt');
    });

    it('상태별 활동 설명을 올바르게 생성한다', async () => {
      // Given
      const userId = 'user-123';
      mockGuardianProfileRepository.findByUserId.mockResolvedValue({
        id: 'guardian-123',
        userId,
        guardianType: 'CARE_FACILITY_TEACHER',
        careFacilityId: 'facility-123',
      } as any);
      mockChildRepository.countByCareFacilityId.mockResolvedValue(1);
      mockCounselRequestRepository.countByGuardianIdAndStatus.mockResolvedValue({
        total: 1,
        pending: 1,
        recommended: 0,
        matched: 0,
        inProgress: 0,
        completed: 0,
        rejected: 0,
      });
      mockCounselRequestRepository.findRecentByGuardianId.mockResolvedValue([
        createCounselRequest('request-1', CounselRequestStatus.PENDING),
      ]);

      // When
      const result = await useCase.execute(userId);

      // Then
      expect(result.recentActivities[0].description).toBe('상담의뢰지가 접수되었습니다');
    });
  });
});
