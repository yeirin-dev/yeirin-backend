import { NotFoundException } from '@nestjs/common';
import { GetInstitutionUseCase } from './get-institution.usecase';

describe('GetInstitutionUseCase', () => {
  let useCase: GetInstitutionUseCase;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByVoucherType: jest.fn(),
      findByServiceType: jest.fn(),
      findQualityCertified: jest.fn(),
    };

    useCase = new GetInstitutionUseCase(mockRepository);
  });

  const createMockInstitution = (id: string) => ({
    id,
    userId: 'user-123',
    centerName: '행복한 상담센터',
    representativeName: '김대표',
    address: '서울시 강남구',
    establishedDate: new Date('2020-01-15'),
    operatingVouchers: ['YOUTH', 'CHILD'],
    isQualityCertified: true,
    maxCapacity: 50,
    introduction: '소개글',
    counselorCount: 5,
    counselorCertifications: ['자격증1'],
    primaryTargetGroup: '아동/청소년',
    secondaryTargetGroup: '',
    canProvideComprehensiveTest: true,
    providedServices: ['개인상담'],
    specialTreatments: ['미술치료'],
    canProvideParentCounseling: true,
    averageRating: 4.5,
    reviewCount: 10,
    counselorProfiles: [{ id: 'c1' }, { id: 'c2' }],
    reviews: [{ rating: 5 }, { rating: 4 }],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('바우처 기관 단일 조회', () => {
    it('ID로 기관을 조회한다', async () => {
      // Given
      const institutionId = 'institution-123';
      const mockInstitution = createMockInstitution(institutionId);
      mockRepository.findById.mockResolvedValue(mockInstitution);

      // When
      const result = await useCase.execute(institutionId);

      // Then
      expect(result.id).toBe(institutionId);
      expect(result.centerName).toBe('행복한 상담센터');
      expect(mockRepository.findById).toHaveBeenCalledWith(institutionId);
    });

    it('존재하지 않는 ID로 조회시 NotFoundException을 던진다', async () => {
      // Given
      const institutionId = 'non-existent-id';
      mockRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(useCase.execute(institutionId)).rejects.toThrow(NotFoundException);
      expect(mockRepository.findById).toHaveBeenCalledWith(institutionId);
    });

    it('리뷰가 있으면 평균 평점을 계산한다', async () => {
      // Given
      const institutionId = 'institution-with-reviews';
      const mockInstitution = createMockInstitution(institutionId);
      mockInstitution.reviews = [{ rating: 5 }, { rating: 4 }, { rating: 3 }];
      mockRepository.findById.mockResolvedValue(mockInstitution);

      // When
      const result = await useCase.execute(institutionId);

      // Then
      expect(result.averageRating).toBe(4); // (5+4+3)/3 = 4
    });

    it('리뷰가 없으면 평균 평점은 0이다', async () => {
      // Given
      const institutionId = 'institution-no-reviews';
      const mockInstitution = createMockInstitution(institutionId);
      mockInstitution.reviews = [];
      mockRepository.findById.mockResolvedValue(mockInstitution);

      // When
      const result = await useCase.execute(institutionId);

      // Then
      expect(result.averageRating).toBe(0);
    });
  });

  describe('응답 DTO 변환', () => {
    it('기관 정보를 InstitutionResponseDto로 변환한다', async () => {
      // Given
      const institutionId = 'institution-123';
      const mockInstitution = createMockInstitution(institutionId);
      mockRepository.findById.mockResolvedValue(mockInstitution);

      // When
      const result = await useCase.execute(institutionId);

      // Then
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('centerName');
      expect(result).toHaveProperty('representativeName');
      expect(result).toHaveProperty('averageRating');
      expect(result).toHaveProperty('reviewCount');
      expect(result).toHaveProperty('counselorCount');
    });

    it('상담사 수와 리뷰 수를 정확히 계산한다', async () => {
      // Given
      const institutionId = 'institution-123';
      const mockInstitution = createMockInstitution(institutionId);
      mockInstitution.counselorProfiles = [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }];
      mockInstitution.reviews = [{ rating: 5 }, { rating: 4 }];
      mockRepository.findById.mockResolvedValue(mockInstitution);

      // When
      const result = await useCase.execute(institutionId);

      // Then
      expect(result.counselorCount).toBe(3);
      expect(result.reviewCount).toBe(2);
    });
  });
});
