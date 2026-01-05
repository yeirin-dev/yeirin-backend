import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Address } from '@domain/common/value-objects/address.vo';
import { InstitutionName } from '@domain/common/value-objects/institution-name.vo';
import { CommunityChildCenterRepository } from '@domain/community-child-center/repository/community-child-center.repository';
import { GuardianProfileRepository } from '@domain/guardian/repository/guardian-profile.repository';
import { CreateCommunityChildCenterDto } from '../dto/create-community-child-center.dto';
import { CreateCommunityChildCenterUseCase } from './create-community-child-center.usecase';

describe('CreateCommunityChildCenterUseCase', () => {
  let useCase: CreateCommunityChildCenterUseCase;
  let mockCenterRepository: jest.Mocked<CommunityChildCenterRepository>;
  let mockGuardianProfileRepository: jest.Mocked<GuardianProfileRepository>;

  beforeEach(async () => {
    mockCenterRepository = {
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
        CreateCommunityChildCenterUseCase,
        {
          provide: 'CommunityChildCenterRepository',
          useValue: mockCenterRepository,
        },
        {
          provide: 'GuardianProfileRepository',
          useValue: mockGuardianProfileRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateCommunityChildCenterUseCase>(CreateCommunityChildCenterUseCase);
  });

  const createMockCenter = (id: string, name: string) => {
    const nameResult = InstitutionName.create(name);
    const addressResult = Address.create({
      address: '서울시 마포구 상암로 123',
      addressDetail: '2층',
      postalCode: '03925',
    });

    return {
      id,
      name: nameResult.getValue(),
      address: addressResult.getValue(),
      representativeName: '김영희',
      phoneNumber: '02-9876-5432',
      capacity: 30,
      establishedDate: new Date('2018-03-15'),
      introduction: '지역 아동들의 방과후 돌봄을 제공합니다',
      operatingHours: '평일 14:00-19:00',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  describe('지역아동센터 생성', () => {
    it('유효한 정보로 지역아동센터를 생성한다', async () => {
      // Given
      const dto: CreateCommunityChildCenterDto = {
        name: '행복지역아동센터',
        address: '서울시 마포구 상암로 123',
        addressDetail: '2층',
        postalCode: '03925',
        representativeName: '김영희',
        phoneNumber: '02-9876-5432',
        capacity: 30,
        establishedDate: '2018-03-15',
        introduction: '지역 아동들의 방과후 돌봄을 제공합니다',
        operatingHours: '평일 14:00-19:00',
      };

      const mockCenter = createMockCenter('center-123', dto.name);

      mockCenterRepository.existsByName.mockResolvedValue(false);
      mockCenterRepository.save.mockResolvedValue(mockCenter as any);
      mockGuardianProfileRepository.countByCommunityChildCenterId.mockResolvedValue(0);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.name).toBe('행복지역아동센터');
      expect(result.address).toBe('서울시 마포구 상암로 123');
      expect(result.representativeName).toBe('김영희');
      expect(result.capacity).toBe(30);
      expect(result.operatingHours).toBe('평일 14:00-19:00');
      expect(result.isActive).toBe(true);
      expect(result.teacherCount).toBe(0);
      expect(mockCenterRepository.existsByName).toHaveBeenCalledWith('행복지역아동센터');
      expect(mockCenterRepository.save).toHaveBeenCalled();
    });

    it('중복된 기관명이면 BadRequestException을 던진다', async () => {
      // Given
      const dto: CreateCommunityChildCenterDto = {
        name: '기존 센터',
        address: '서울시 강남구',
        representativeName: '이영희',
        phoneNumber: '02-1111-2222',
        capacity: 20,
        establishedDate: '2020-01-01',
      };

      mockCenterRepository.existsByName.mockResolvedValue(true);

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(dto)).rejects.toThrow('이미 존재하는 기관명입니다');
      expect(mockCenterRepository.save).not.toHaveBeenCalled();
    });

    it('필수 필드만으로 생성할 수 있다', async () => {
      // Given
      const dto: CreateCommunityChildCenterDto = {
        name: '희망지역아동센터',
        address: '서울시 서초구 서초대로 456',
        representativeName: '박영희',
        phoneNumber: '02-9999-8888',
        capacity: 25,
        establishedDate: '2019-06-01',
      };

      const mockCenter = createMockCenter('center-456', dto.name);

      mockCenterRepository.existsByName.mockResolvedValue(false);
      mockCenterRepository.save.mockResolvedValue(mockCenter as any);
      mockGuardianProfileRepository.countByCommunityChildCenterId.mockResolvedValue(0);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.isActive).toBe(true);
      expect(mockCenterRepository.save).toHaveBeenCalled();
    });

    it('새로 생성된 센터의 선생님 수는 0이다', async () => {
      // Given
      const dto: CreateCommunityChildCenterDto = {
        name: '사랑지역아동센터',
        address: '서울시 종로구 종로 789',
        representativeName: '최영희',
        phoneNumber: '02-5555-6666',
        capacity: 40,
        establishedDate: '2020-09-01',
      };

      const mockCenter = createMockCenter('center-789', dto.name);

      mockCenterRepository.existsByName.mockResolvedValue(false);
      mockCenterRepository.save.mockResolvedValue(mockCenter as any);
      mockGuardianProfileRepository.countByCommunityChildCenterId.mockResolvedValue(0);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.teacherCount).toBe(0);
      expect(mockGuardianProfileRepository.countByCommunityChildCenterId).toHaveBeenCalledWith(
        mockCenter.id,
      );
    });
  });

  describe('응답 DTO 변환', () => {
    it('CommunityChildCenter를 CommunityChildCenterResponseDto로 변환한다', async () => {
      // Given
      const dto: CreateCommunityChildCenterDto = {
        name: '꿈나무지역아동센터',
        address: '서울시 동작구 상도로 123',
        addressDetail: '3층',
        postalCode: '06978',
        representativeName: '정영희',
        phoneNumber: '02-7777-8888',
        capacity: 35,
        establishedDate: '2017-03-01',
        introduction: '꿈을 키우는 공간입니다.',
        operatingHours: '평일 13:00-18:00',
      };

      const mockCenter = createMockCenter('center-response-test', dto.name);

      mockCenterRepository.existsByName.mockResolvedValue(false);
      mockCenterRepository.save.mockResolvedValue(mockCenter as any);
      mockGuardianProfileRepository.countByCommunityChildCenterId.mockResolvedValue(2);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('address');
      expect(result).toHaveProperty('addressDetail');
      expect(result).toHaveProperty('postalCode');
      expect(result).toHaveProperty('representativeName');
      expect(result).toHaveProperty('phoneNumber');
      expect(result).toHaveProperty('capacity');
      expect(result).toHaveProperty('establishedDate');
      expect(result).toHaveProperty('introduction');
      expect(result).toHaveProperty('operatingHours');
      expect(result).toHaveProperty('isActive');
      expect(result).toHaveProperty('teacherCount');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
  });
});
