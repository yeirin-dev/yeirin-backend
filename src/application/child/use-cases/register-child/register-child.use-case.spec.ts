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
import { ChildType as ChildTypeEnum } from '@infrastructure/persistence/typeorm/entity/enums/child-type.enum';
import { RegisterChildDto } from '../../dto/register-child.dto';
import { RegisterChildUseCase } from './register-child.use-case';

describe('RegisterChildUseCase', () => {
  let useCase: RegisterChildUseCase;
  let mockChildRepository: jest.Mocked<ChildRepository>;
  let mockCareFacilityRepository: jest.Mocked<CareFacilityRepository>;
  let mockCommunityChildCenterRepository: jest.Mocked<CommunityChildCenterRepository>;

  beforeEach(async () => {
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

    mockCareFacilityRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAllActive: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      existsByName: jest.fn(),
      findActiveByDistrict: jest.fn(),
      getDistinctDistricts: jest.fn(),
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
      findActiveByDistrict: jest.fn(),
      getDistinctDistricts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterChildUseCase,
        {
          provide: 'ChildRepository',
          useValue: mockChildRepository,
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

  describe('양육시설 아동 등록', () => {
    it('양육시설 아동을 등록한다', async () => {
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
      expect(result.communityChildCenterId).toBeNull();
      expect(result.isOrphan).toBe(true);
      expect(mockCareFacilityRepository.exists).toHaveBeenCalledWith('facility-123');
      expect(mockChildRepository.save).toHaveBeenCalled();
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

    it('양육시설 아동에 지역아동센터 ID가 있으면 BadRequestException을 던진다', async () => {
      // Given
      const dto: RegisterChildDto = {
        childType: ChildTypeEnum.CARE_FACILITY,
        name: '김철수',
        birthDate: '2016-03-15',
        gender: GenderType.MALE,
        careFacilityId: 'facility-123',
        communityChildCenterId: 'center-123',
      };

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(dto)).rejects.toThrow(
        '양육시설 아동은 지역아동센터와 연결될 수 없습니다',
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

    it('양육시설 아동에 의료정보와 특수요구사항을 함께 등록한다', async () => {
      // Given
      const dto: RegisterChildDto = {
        childType: ChildTypeEnum.CARE_FACILITY,
        name: '김철수',
        birthDate: '2016-03-15',
        gender: GenderType.MALE,
        careFacilityId: 'facility-123',
        medicalInfo: 'ADHD 진단',
        specialNeeds: '감각 통합 치료 필요',
      };

      mockCareFacilityRepository.exists.mockResolvedValue(true);
      mockChildRepository.save.mockImplementation(async (child) => child);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.medicalInfo).toBe('ADHD 진단');
      expect(result.specialNeeds).toBe('감각 통합 치료 필요');
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
      };

      mockCommunityChildCenterRepository.exists.mockResolvedValue(true);
      mockChildRepository.save.mockImplementation(async (child) => child);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.name).toBe('이영희');
      expect(result.childType).toBe(ChildTypeValue.COMMUNITY_CENTER);
      expect(result.communityChildCenterId).toBe('center-123');
      expect(result.careFacilityId).toBeNull();
      expect(result.isOrphan).toBe(false);
      expect(mockCommunityChildCenterRepository.exists).toHaveBeenCalledWith('center-123');
      expect(mockChildRepository.save).toHaveBeenCalled();
    });

    it('지역아동센터 아동에 센터 ID가 없으면 BadRequestException을 던진다', async () => {
      // Given
      const dto: RegisterChildDto = {
        childType: ChildTypeEnum.COMMUNITY_CENTER,
        name: '이영희',
        birthDate: '2014-08-20',
        gender: GenderType.FEMALE,
      };

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(dto)).rejects.toThrow(
        '지역아동센터 아동은 지역아동센터 ID가 필수입니다',
      );
    });

    it('지역아동센터 아동에 양육시설 ID가 있으면 BadRequestException을 던진다', async () => {
      // Given
      const dto: RegisterChildDto = {
        childType: ChildTypeEnum.COMMUNITY_CENTER,
        name: '이영희',
        birthDate: '2014-08-20',
        gender: GenderType.FEMALE,
        communityChildCenterId: 'center-123',
        careFacilityId: 'facility-123',
      };

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(dto)).rejects.toThrow(
        '지역아동센터 아동은 양육시설과 연결될 수 없습니다',
      );
    });

    it('존재하지 않는 지역아동센터이면 NotFoundException을 던진다', async () => {
      // Given
      const dto: RegisterChildDto = {
        childType: ChildTypeEnum.COMMUNITY_CENTER,
        name: '이영희',
        birthDate: '2014-08-20',
        gender: GenderType.FEMALE,
        communityChildCenterId: 'non-existent-center',
      };

      mockCommunityChildCenterRepository.exists.mockResolvedValue(false);

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('일반 아동 유형 (더 이상 지원 안함)', () => {
    it('일반 아동 유형으로 등록하면 BadRequestException을 던진다', async () => {
      // Given
      const dto: RegisterChildDto = {
        childType: ChildTypeEnum.REGULAR,
        name: '홍길동',
        birthDate: '2015-05-10',
        gender: GenderType.MALE,
      };

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(dto)).rejects.toThrow(
        '일반 아동 유형은 더 이상 지원되지 않습니다',
      );
    });
  });

  describe('DTO 변환', () => {
    it('Child를 ChildResponseDto로 변환한다', async () => {
      // Given
      const dto: RegisterChildDto = {
        childType: ChildTypeEnum.CARE_FACILITY,
        name: '홍길동',
        birthDate: '2015-05-10',
        gender: GenderType.MALE,
        careFacilityId: 'facility-123',
        medicalInfo: 'ADHD 진단',
        specialNeeds: '감각 통합 치료 필요',
      };

      mockCareFacilityRepository.exists.mockResolvedValue(true);
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
