import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CareFacility } from '@domain/care-facility/model/care-facility';
import { CareFacilityRepository } from '@domain/care-facility/repository/care-facility.repository';
import { Address } from '@domain/common/value-objects/address.vo';
import { InstitutionName } from '@domain/common/value-objects/institution-name.vo';
import { GuardianProfileRepository } from '@domain/guardian/repository/guardian-profile.repository';
import { CreateCareFacilityDto } from '../dto/create-care-facility.dto';
import { CreateCareFacilityUseCase } from './create-care-facility.usecase';

describe('CreateCareFacilityUseCase', () => {
  let useCase: CreateCareFacilityUseCase;
  let mockCareFacilityRepository: jest.Mocked<CareFacilityRepository>;
  let mockGuardianProfileRepository: jest.Mocked<GuardianProfileRepository>;

  beforeEach(async () => {
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
        CreateCareFacilityUseCase,
        {
          provide: 'CareFacilityRepository',
          useValue: mockCareFacilityRepository,
        },
        {
          provide: 'GuardianProfileRepository',
          useValue: mockGuardianProfileRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateCareFacilityUseCase>(CreateCareFacilityUseCase);
  });

  const createMockCareFacility = (id: string, name: string) => {
    const nameResult = InstitutionName.create(name);
    const addressResult = Address.create({
      address: '서울시 강북구 도봉로 123',
      addressDetail: '3층',
      postalCode: '01234',
    });

    return {
      id,
      name: nameResult.getValue(),
      address: addressResult.getValue(),
      representativeName: '김원장',
      phoneNumber: '02-1234-5678',
      capacity: 50,
      establishedDate: new Date('2015-03-15'),
      introduction: '아이들의 꿈을 키우는 보육원입니다.',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  describe('양육시설 생성', () => {
    it('유효한 정보로 양육시설을 생성한다', async () => {
      // Given
      const dto: CreateCareFacilityDto = {
        name: '새싹 보육원',
        address: '서울시 강북구 도봉로 123',
        addressDetail: '3층',
        postalCode: '01234',
        representativeName: '김원장',
        phoneNumber: '02-1234-5678',
        capacity: 50,
        establishedDate: '2015-03-15',
        introduction: '아이들의 꿈을 키우는 보육원입니다.',
      };

      const mockFacility = createMockCareFacility('facility-123', dto.name);

      mockCareFacilityRepository.existsByName.mockResolvedValue(false);
      mockCareFacilityRepository.save.mockResolvedValue(mockFacility as any);
      mockGuardianProfileRepository.countByCareFacilityId.mockResolvedValue(0);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.name).toBe('새싹 보육원');
      expect(result.address).toBe('서울시 강북구 도봉로 123');
      expect(result.representativeName).toBe('김원장');
      expect(result.capacity).toBe(50);
      expect(result.isActive).toBe(true);
      expect(result.teacherCount).toBe(0);
      expect(mockCareFacilityRepository.existsByName).toHaveBeenCalledWith('새싹 보육원');
      expect(mockCareFacilityRepository.save).toHaveBeenCalled();
    });

    it('중복된 기관명이면 BadRequestException을 던진다', async () => {
      // Given
      const dto: CreateCareFacilityDto = {
        name: '기존 보육원',
        address: '서울시 강남구',
        representativeName: '이원장',
        phoneNumber: '02-1111-2222',
        capacity: 30,
        establishedDate: '2020-01-01',
      };

      mockCareFacilityRepository.existsByName.mockResolvedValue(true);

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
      await expect(useCase.execute(dto)).rejects.toThrow('이미 존재하는 기관명입니다');
      expect(mockCareFacilityRepository.save).not.toHaveBeenCalled();
    });

    it('필수 필드가 모두 포함된 최소 정보로 생성할 수 있다', async () => {
      // Given
      const dto: CreateCareFacilityDto = {
        name: '희망 보육원',
        address: '서울시 서초구 서초대로 456',
        representativeName: '박원장',
        phoneNumber: '02-9999-8888',
        capacity: 30,
        establishedDate: '2018-06-01',
      };

      const mockFacility = createMockCareFacility('facility-456', dto.name);

      mockCareFacilityRepository.existsByName.mockResolvedValue(false);
      mockCareFacilityRepository.save.mockResolvedValue(mockFacility as any);
      mockGuardianProfileRepository.countByCareFacilityId.mockResolvedValue(0);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.name).toBe('희망 보육원');
      expect(result.isActive).toBe(true);
      expect(mockCareFacilityRepository.save).toHaveBeenCalled();
    });

    it('새로 생성된 시설의 선생님 수는 0이다', async () => {
      // Given
      const dto: CreateCareFacilityDto = {
        name: '행복 보육원',
        address: '서울시 마포구 마포대로 789',
        representativeName: '최원장',
        phoneNumber: '02-5555-6666',
        capacity: 40,
        establishedDate: '2019-09-01',
      };

      const mockFacility = createMockCareFacility('facility-789', dto.name);

      mockCareFacilityRepository.existsByName.mockResolvedValue(false);
      mockCareFacilityRepository.save.mockResolvedValue(mockFacility as any);
      mockGuardianProfileRepository.countByCareFacilityId.mockResolvedValue(0);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.teacherCount).toBe(0);
      expect(mockGuardianProfileRepository.countByCareFacilityId).toHaveBeenCalledWith(
        mockFacility.id,
      );
    });
  });

  describe('응답 DTO 변환', () => {
    it('CareFacility를 CareFacilityResponseDto로 변환한다', async () => {
      // Given
      const dto: CreateCareFacilityDto = {
        name: '사랑 보육원',
        address: '서울시 종로구 종로 123',
        addressDetail: '5층 501호',
        postalCode: '03456',
        representativeName: '정원장',
        phoneNumber: '02-7777-8888',
        capacity: 60,
        establishedDate: '2016-03-01',
        introduction: '사랑으로 아이들을 돌봅니다.',
      };

      const mockFacility = createMockCareFacility('facility-response-test', dto.name);

      mockCareFacilityRepository.existsByName.mockResolvedValue(false);
      mockCareFacilityRepository.save.mockResolvedValue(mockFacility as any);
      mockGuardianProfileRepository.countByCareFacilityId.mockResolvedValue(3);

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
      expect(result).toHaveProperty('isActive');
      expect(result).toHaveProperty('teacherCount');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
  });
});
