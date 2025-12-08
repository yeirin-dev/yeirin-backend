import { Test, TestingModule } from '@nestjs/testing';
import { ChildRepository } from '@domain/child/repository/child.repository';
import { Child } from '@domain/child/model/child';
import { ChildType, ChildTypeValue } from '@domain/child/model/value-objects/child-type.vo';
import { ChildName } from '@domain/child/model/value-objects/child-name.vo';
import { BirthDate } from '@domain/child/model/value-objects/birth-date.vo';
import { Gender, GenderType } from '@domain/child/model/value-objects/gender.vo';
import { GetChildrenByGuardianUseCase } from './get-children-by-guardian.use-case';

describe('GetChildrenByGuardianUseCase', () => {
  let useCase: GetChildrenByGuardianUseCase;
  let mockRepository: jest.Mocked<ChildRepository>;

  beforeEach(async () => {
    mockRepository = {
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetChildrenByGuardianUseCase,
        {
          provide: 'ChildRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetChildrenByGuardianUseCase>(GetChildrenByGuardianUseCase);
  });

  const createMockChild = (
    id: string,
    name: string,
    guardianId: string,
    childTypeValue: ChildTypeValue = ChildTypeValue.REGULAR,
  ): Child => {
    return Child.restore(
      {
        childType: ChildType.create(childTypeValue).getValue(),
        name: ChildName.create(name).getValue(),
        birthDate: BirthDate.create(new Date('2015-05-10')).getValue(),
        gender: Gender.create(GenderType.MALE).getValue(),
        guardianId,
        careFacilityId: null,
        communityChildCenterId: null,
      },
      id,
      new Date(),
    );
  };

  describe('보호자별 아동 목록 조회', () => {
    it('보호자 ID로 아동 목록을 조회한다', async () => {
      // Given
      const guardianId = 'guardian-123';
      const children = [
        createMockChild('child-1', '홍길동', guardianId),
        createMockChild('child-2', '홍길순', guardianId),
      ];
      mockRepository.findByGuardianId.mockResolvedValue(children);

      // When
      const result = await useCase.execute(guardianId);

      // Then
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('홍길동');
      expect(result[1].name).toBe('홍길순');
      expect(mockRepository.findByGuardianId).toHaveBeenCalledWith(guardianId);
    });

    it('아동이 없는 보호자 조회시 빈 배열을 반환한다', async () => {
      // Given
      const guardianId = 'guardian-no-children';
      mockRepository.findByGuardianId.mockResolvedValue([]);

      // When
      const result = await useCase.execute(guardianId);

      // Then
      expect(result).toHaveLength(0);
      expect(mockRepository.findByGuardianId).toHaveBeenCalledWith(guardianId);
    });

    it('다양한 유형의 아동을 모두 반환한다', async () => {
      // Given
      const guardianId = 'guardian-123';
      const children = [
        createMockChild('child-1', '홍길동', guardianId, ChildTypeValue.REGULAR),
        createMockChild('child-2', '홍길순', guardianId, ChildTypeValue.COMMUNITY_CENTER),
      ];
      mockRepository.findByGuardianId.mockResolvedValue(children);

      // When
      const result = await useCase.execute(guardianId);

      // Then
      expect(result).toHaveLength(2);
      const childTypes = result.map((c) => c.childType);
      expect(childTypes).toContain(ChildTypeValue.REGULAR);
      expect(childTypes).toContain(ChildTypeValue.COMMUNITY_CENTER);
    });
  });

  describe('응답 DTO 변환', () => {
    it('각 Child를 ChildResponseDto로 변환한다', async () => {
      // Given
      const guardianId = 'guardian-123';
      const children = [createMockChild('child-1', '홍길동', guardianId)];
      mockRepository.findByGuardianId.mockResolvedValue(children);

      // When
      const result = await useCase.execute(guardianId);

      // Then
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('childType');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('birthDate');
      expect(result[0]).toHaveProperty('gender');
      expect(result[0]).toHaveProperty('age');
      expect(result[0]).toHaveProperty('guardianId');
      expect(result[0]).toHaveProperty('isOrphan');
    });
  });
});
