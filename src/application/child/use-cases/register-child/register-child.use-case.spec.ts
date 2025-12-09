import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CareFacilityRepository } from '@domain/care-facility/repository/care-facility.repository';
import { Child } from '@domain/child/model/child';
import { BirthDate } from '@domain/child/model/value-objects/birth-date.vo';
import { ChildName } from '@domain/child/model/value-objects/child-name.vo';
import { ChildType, ChildTypeValue } from '@domain/child/model/value-objects/child-type.vo';
import { Gender, GenderType } from '@domain/child/model/value-objects/gender.vo';
import { ChildRepository } from '@domain/child/repository/child.repository';
import { CommunityChildCenterRepository } from '@domain/community-child-center/repository/community-child-center.repository';
import { GuardianProfileRepository } from '@domain/guardian/repository/guardian-profile.repository';
import { ChildType as ChildTypeEnum } from '@infrastructure/persistence/typeorm/entity/enums/child-type.enum';
import { RegisterChildDto } from '../../dto/register-child.dto';
import { RegisterChildUseCase } from './register-child.use-case';

describe('RegisterChildUseCase', () => {
  let useCase: RegisterChildUseCase;
  let mockChildRepository: jest.Mocked<ChildRepository>;
  let mockGuardianRepository: jest.Mocked<GuardianProfileRepository>;
  let mockCareFacilityRepository: jest.Mocked<CareFacilityRepository>;
  let mockCommunityChildCenterRepository: jest.Mocked<CommunityChildCenterRepository>;

  beforeEach(async () => {
    mockChildRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByGuardianId: jest.fn(),
      findByCareFacilityId: jest.fn(),
      findByCommunityChildCenterId: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      countByGuardianId: jest.fn(),
      countByCareFacilityId: jest.fn(),
      countByCommunityChildCenterId: jest.fn(),
    };

    mockGuardianRepository = {
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

    mockCareFacilityRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAllActive: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      existsByName: jest.fn(),
    };

    mockCommunityChildCenterRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAllActive: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      existsByName: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterChildUseCase,
        {
          provide: 'ChildRepository',
          useValue: mockChildRepository,
        },
        {
          provide: 'GuardianProfileRepository',
          useValue: mockGuardianRepository,
        },
        {
          provide: 'CareFacilityRepository',
          useValue: mockCareFacilityRepository,
        },
        {
          provide: 'CommunityChildCenterRepository',
          useValue: mockCommunityChildCenterRepository,
        },
      ],
    }).compile();

    useCase = module.get<RegisterChildUseCase>(RegisterChildUseCase);
  });

  const createMockChild = (
    id: string,
    childTypeValue: ChildTypeValue,
    guardianId: string | null,
    careFacilityId: string | null,
    communityChildCenterId: string | null,
  ): Child => {
    return Child.restore(
      {
        childType: ChildType.create(childTypeValue).getValue(),
        name: ChildName.create('홍길동').getValue(),
        birthDate: BirthDate.create(new Date('2015-05-10')).getValue(),
        gender: Gender.create(GenderType.MALE).getValue(),
        guardianId,
        careFacilityId,
        communityChildCenterId,
      },
      id,
      new Date(),
    );
  };

  describe('일반 아동 등록', () => {
    it('일반 아동(부모 직접보호)을 등록한다', async () => {
      // Given
      const dto: RegisterChildDto = {
        childType: ChildTypeEnum.REGULAR,
        name: '홍길동',
        birthDate: '2015-05-10',
        gender: GenderType.MALE,
        guardianId: 'guardian-123',
      };

      mockGuardianRepository.exists.mockResolvedValue(true);
      mockChildRepository.save.mockImplementation(async (child) => child);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.name).toBe('홍길동');
      expect(result.childType).toBe(ChildTypeValue.REGULAR);
      expect(result.guardianId).toBe('guardian-123');
      expect(result.careFacilityId).toBeNull();
      expect(result.communityChildCenterId).toBeNull();
      expect(mockGuardianRepository.exists).toHaveBeenCalledWith('guardian-123');
      expect(mockChildRepository.save).toHaveBeenCalled();
    });

    it('일반 아동 등록 시 보호자가 없으면 NotFoundException을 던진다', async () => {
      // Given
      const dto: RegisterChildDto = {
        childType: ChildTypeEnum.REGULAR,
        name: '홍길동',
        birthDate: '2015-05-10',
        gender: GenderType.MALE,
        guardianId: 'non-existent-guardian',
      };

      mockGuardianRepository.exists.mockResolvedValue(false);

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow(NotFoundException);
      expect(mockChildRepository.save).not.toHaveBeenCalled();
    });

    it('일반 아동에 양육시설 ID가 있으면 BadRequestException을 던진다', async () => {
      // Given
      const dto: RegisterChildDto = {
        childType: ChildTypeEnum.REGULAR,
        name: '홍길동',
        birthDate: '2015-05-10',
        gender: GenderType.MALE,
        guardianId: 'guardian-123',
        careFacilityId: 'facility-123',
      };

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(dto)).rejects.toThrow(
        '일반 아동은 양육시설과 연결될 수 없습니다',
      );
    });

    it('일반 아동에 보호자 ID가 없으면 BadRequestException을 던진다', async () => {
      // Given
      const dto: RegisterChildDto = {
        childType: ChildTypeEnum.REGULAR,
        name: '홍길동',
        birthDate: '2015-05-10',
        gender: GenderType.MALE,
      };

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(dto)).rejects.toThrow('일반 아동은 부모 보호자 ID가 필수입니다');
    });
  });

  describe('양육시설 아동 등록', () => {
    it('양육시설 아동(고아)을 등록한다', async () => {
      // Given
      const dto: RegisterChildDto = {
        childType: ChildTypeEnum.CARE_FACILITY,
        name: '김철수',
        birthDate: '2016-03-15',
        gender: GenderType.MALE,
        careFacilityId: 'facility-123',
      };

      mockCareFacilityRepository.exists.mockResolvedValue(true);
      mockChildRepository.save.mockImplementation(async (child) => child);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.name).toBe('김철수');
      expect(result.childType).toBe(ChildTypeValue.CARE_FACILITY);
      expect(result.careFacilityId).toBe('facility-123');
      expect(result.guardianId).toBeNull();
      expect(result.communityChildCenterId).toBeNull();
      expect(result.isOrphan).toBe(true);
    });

    it('양육시설 아동에 양육시설 ID가 없으면 BadRequestException을 던진다', async () => {
      // Given
      const dto: RegisterChildDto = {
        childType: ChildTypeEnum.CARE_FACILITY,
        name: '김철수',
        birthDate: '2016-03-15',
        gender: GenderType.MALE,
      };

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(dto)).rejects.toThrow(
        '양육시설 아동은 양육시설 ID가 필수입니다',
      );
    });

    it('양육시설 아동에 보호자 ID가 있으면 BadRequestException을 던진다', async () => {
      // Given
      const dto: RegisterChildDto = {
        childType: ChildTypeEnum.CARE_FACILITY,
        name: '김철수',
        birthDate: '2016-03-15',
        gender: GenderType.MALE,
        careFacilityId: 'facility-123',
        guardianId: 'guardian-123',
      };

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(dto)).rejects.toThrow(
        '양육시설 아동(고아)은 부모 보호자와 연결될 수 없습니다',
      );
    });

    it('존재하지 않는 양육시설이면 NotFoundException을 던진다', async () => {
      // Given
      const dto: RegisterChildDto = {
        childType: ChildTypeEnum.CARE_FACILITY,
        name: '김철수',
        birthDate: '2016-03-15',
        gender: GenderType.MALE,
        careFacilityId: 'non-existent-facility',
      };

      mockCareFacilityRepository.exists.mockResolvedValue(false);

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('지역아동센터 아동 등록', () => {
    it('지역아동센터 아동을 등록한다', async () => {
      // Given
      const dto: RegisterChildDto = {
        childType: ChildTypeEnum.COMMUNITY_CENTER,
        name: '이영희',
        birthDate: '2014-08-20',
        gender: GenderType.FEMALE,
        communityChildCenterId: 'center-123',
        guardianId: 'guardian-123',
      };

      mockCommunityChildCenterRepository.exists.mockResolvedValue(true);
      mockGuardianRepository.exists.mockResolvedValue(true);
      mockChildRepository.save.mockImplementation(async (child) => child);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.name).toBe('이영희');
      expect(result.childType).toBe(ChildTypeValue.COMMUNITY_CENTER);
      expect(result.communityChildCenterId).toBe('center-123');
      expect(result.guardianId).toBe('guardian-123');
      expect(result.careFacilityId).toBeNull();
      expect(result.isOrphan).toBe(false);
    });

    it('지역아동센터 아동에 센터 ID가 없으면 BadRequestException을 던진다', async () => {
      // Given
      const dto: RegisterChildDto = {
        childType: ChildTypeEnum.COMMUNITY_CENTER,
        name: '이영희',
        birthDate: '2014-08-20',
        gender: GenderType.FEMALE,
        guardianId: 'guardian-123',
      };

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(dto)).rejects.toThrow(
        '지역아동센터 아동은 지역아동센터 ID가 필수입니다',
      );
    });

    it('지역아동센터 아동에 보호자 ID가 없으면 BadRequestException을 던진다', async () => {
      // Given
      const dto: RegisterChildDto = {
        childType: ChildTypeEnum.COMMUNITY_CENTER,
        name: '이영희',
        birthDate: '2014-08-20',
        gender: GenderType.FEMALE,
        communityChildCenterId: 'center-123',
      };

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(dto)).rejects.toThrow(
        '지역아동센터 아동은 부모 보호자 ID가 필수입니다',
      );
    });
  });

  describe('DTO 변환', () => {
    it('Child를 ChildResponseDto로 변환한다', async () => {
      // Given
      const dto: RegisterChildDto = {
        childType: ChildTypeEnum.REGULAR,
        name: '홍길동',
        birthDate: '2015-05-10',
        gender: GenderType.MALE,
        guardianId: 'guardian-123',
        medicalInfo: 'ADHD 진단',
        specialNeeds: '감각 통합 치료 필요',
      };

      mockGuardianRepository.exists.mockResolvedValue(true);
      mockChildRepository.save.mockImplementation(async (child) => child);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('childType');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('birthDate');
      expect(result).toHaveProperty('gender');
      expect(result).toHaveProperty('age');
      expect(result).toHaveProperty('medicalInfo');
      expect(result).toHaveProperty('specialNeeds');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
  });
});
