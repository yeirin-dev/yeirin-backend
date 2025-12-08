import { CreateInstitutionUseCase } from './create-institution.usecase';
import { CreateInstitutionDto } from '../dto/create-institution.dto';

describe('CreateInstitutionUseCase', () => {
  let useCase: CreateInstitutionUseCase;
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

    useCase = new CreateInstitutionUseCase(mockRepository);
  });

  describe('바우처 기관 생성', () => {
    it('유효한 정보로 기관을 생성한다', async () => {
      // Given
      const dto: CreateInstitutionDto = {
        userId: 'user-123',
        centerName: '행복한 상담센터',
        representativeName: '김대표',
        address: '서울시 강남구 테헤란로 123',
        establishedDate: '2020-01-15',
        operatingVouchers: ['YOUTH', 'CHILD'],
        isQualityCertified: true,
        maxCapacity: 50,
        introduction: '전문 심리상담 서비스를 제공합니다.',
        primaryTargetGroup: '아동/청소년',
        canProvideComprehensiveTest: true,
        providedServices: ['개인상담', '집단상담'],
        specialTreatments: ['미술치료', '놀이치료'],
        canProvideParentCounseling: true,
      };

      const createdInstitution = {
        id: 'institution-123',
        userId: dto.userId,
        centerName: dto.centerName,
        representativeName: dto.representativeName,
        address: dto.address,
        establishedDate: new Date(dto.establishedDate),
        operatingVouchers: dto.operatingVouchers,
        isQualityCertified: dto.isQualityCertified,
        maxCapacity: dto.maxCapacity,
        introduction: dto.introduction,
        counselorCount: 0,
        counselorCertifications: [],
        primaryTargetGroup: dto.primaryTargetGroup,
        secondaryTargetGroup: '',
        canProvideComprehensiveTest: dto.canProvideComprehensiveTest,
        providedServices: dto.providedServices,
        specialTreatments: dto.specialTreatments,
        canProvideParentCounseling: dto.canProvideParentCounseling,
        averageRating: 0,
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(createdInstitution);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.id).toBe('institution-123');
      expect(result.centerName).toBe('행복한 상담센터');
      expect(result.representativeName).toBe('김대표');
      expect(result.isQualityCertified).toBe(true);
      expect(result.averageRating).toBe(0);
      expect(result.counselorCount).toBe(0);
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('생성된 기관은 초기 평점과 리뷰 수가 0이다', async () => {
      // Given
      const dto: CreateInstitutionDto = {
        userId: 'user-123',
        centerName: '새로운 센터',
        representativeName: '이대표',
        address: '서울시 서초구',
        establishedDate: '2021-06-01',
        operatingVouchers: ['YOUTH'],
        isQualityCertified: false,
        maxCapacity: 30,
        introduction: '새로운 상담센터입니다.',
        primaryTargetGroup: '청소년',
        canProvideComprehensiveTest: false,
        providedServices: ['개인상담'],
        specialTreatments: [],
        canProvideParentCounseling: false,
      };

      mockRepository.create.mockResolvedValue({
        ...dto,
        id: 'institution-456',
        establishedDate: new Date(dto.establishedDate),
        counselorCount: 0,
        counselorCertifications: [],
        secondaryTargetGroup: '',
        averageRating: 0,
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.averageRating).toBe(0);
      expect(result.reviewCount).toBe(0);
      expect(result.counselorCount).toBe(0);
    });

    it('선택적 필드가 없어도 생성할 수 있다', async () => {
      // Given
      const dto: CreateInstitutionDto = {
        userId: 'user-789',
        centerName: '기본 센터',
        representativeName: '박대표',
        address: '서울시 마포구',
        establishedDate: '2022-03-01',
        operatingVouchers: ['CHILD'],
        isQualityCertified: false,
        maxCapacity: 20,
        introduction: '',
        primaryTargetGroup: '아동',
        canProvideComprehensiveTest: false,
        providedServices: [],
        specialTreatments: [],
        canProvideParentCounseling: false,
      };

      mockRepository.create.mockResolvedValue({
        ...dto,
        id: 'institution-789',
        establishedDate: new Date(dto.establishedDate),
        counselorCount: 0,
        counselorCertifications: [],
        secondaryTargetGroup: '',
        averageRating: 0,
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.id).toBe('institution-789');
      expect(result.centerName).toBe('기본 센터');
    });
  });

  describe('응답 DTO 변환', () => {
    it('기관 정보를 InstitutionResponseDto로 변환한다', async () => {
      // Given
      const dto: CreateInstitutionDto = {
        userId: 'user-123',
        centerName: '테스트 센터',
        representativeName: '최대표',
        address: '서울시 송파구',
        establishedDate: '2019-03-10',
        operatingVouchers: ['CHILD'],
        isQualityCertified: true,
        maxCapacity: 40,
        introduction: '테스트 소개입니다.',
        primaryTargetGroup: '아동',
        canProvideComprehensiveTest: true,
        providedServices: ['상담'],
        specialTreatments: ['치료'],
        canProvideParentCounseling: true,
      };

      mockRepository.create.mockResolvedValue({
        id: 'institution-test',
        ...dto,
        establishedDate: new Date(dto.establishedDate),
        counselorCount: 0,
        counselorCertifications: [],
        secondaryTargetGroup: '',
        averageRating: 0,
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('centerName');
      expect(result).toHaveProperty('representativeName');
      expect(result).toHaveProperty('address');
      expect(result).toHaveProperty('establishedDate');
      expect(result).toHaveProperty('operatingVouchers');
      expect(result).toHaveProperty('isQualityCertified');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
  });
});
