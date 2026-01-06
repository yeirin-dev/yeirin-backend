import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Address } from '@domain/common/value-objects/address.vo';
import { InstitutionName } from '@domain/common/value-objects/institution-name.vo';
import { CommunityChildCenterRepository } from '@domain/community-child-center/repository/community-child-center.repository';
import { GetCommunityChildCenterUseCase } from './get-community-child-center.usecase';

describe('GetCommunityChildCenterUseCase', () => {
  let useCase: GetCommunityChildCenterUseCase;
  let mockCenterRepository: jest.Mocked<CommunityChildCenterRepository>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCommunityChildCenterUseCase,
        {
          provide: 'CommunityChildCenterRepository',
          useValue: mockCenterRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetCommunityChildCenterUseCase>(GetCommunityChildCenterUseCase);
  });

  const createMockCenter = (id: string) => {
    const nameResult = InstitutionName.create('행복지역아동센터');
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

  describe('지역아동센터 단건 조회', () => {
    it('ID로 지역아동센터를 조회한다', async () => {
      // Given
      const centerId = 'center-123';
      const mockCenter = createMockCenter(centerId);
      mockCenterRepository.findById.mockResolvedValue(mockCenter as any);

      // When
      const result = await useCase.execute(centerId);

      // Then
      expect(result.id).toBe(centerId);
      expect(result.name).toBe('행복지역아동센터');
      // NOTE: Institution-based login으로 전환됨 - teacherCount는 항상 0
      expect(result.teacherCount).toBe(0);
      expect(mockCenterRepository.findById).toHaveBeenCalledWith(centerId);
    });

    it('존재하지 않는 ID로 조회시 NotFoundException을 던진다', async () => {
      // Given
      const centerId = 'non-existent-id';
      mockCenterRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(useCase.execute(centerId)).rejects.toThrow(NotFoundException);
      expect(mockCenterRepository.findById).toHaveBeenCalledWith(centerId);
    });

    it('조회된 센터의 선생님 수는 항상 0이다', async () => {
      // Given
      const centerId = 'center-with-teachers';
      const mockCenter = createMockCenter(centerId);
      mockCenterRepository.findById.mockResolvedValue(mockCenter as any);

      // When
      const result = await useCase.execute(centerId);

      // Then
      // NOTE: Institution-based login으로 전환됨 - 개별 교사 계정 없음
      expect(result.teacherCount).toBe(0);
    });
  });

  describe('응답 DTO 변환', () => {
    it('CommunityChildCenter를 CommunityChildCenterResponseDto로 변환한다', async () => {
      // Given
      const centerId = 'center-123';
      const mockCenter = createMockCenter(centerId);
      mockCenterRepository.findById.mockResolvedValue(mockCenter as any);

      // When
      const result = await useCase.execute(centerId);

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
