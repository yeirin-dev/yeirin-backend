import { Test, TestingModule } from '@nestjs/testing';
import { ReviewRepository } from '@domain/review/repository/review.repository';
import { ReviewFixture } from '../../../../test/fixtures/review.fixture';
import { CreateReviewDto } from '../dto/create-review.dto';
import { CreateReviewUseCase } from './create-review.usecase';

describe('CreateReviewUseCase', () => {
  let useCase: CreateReviewUseCase;
  let mockReviewRepository: jest.Mocked<ReviewRepository>;

  beforeEach(async () => {
    // Repository 모킹
    mockReviewRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByInstitutionId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByMinRating: jest.fn(),
      incrementHelpfulCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateReviewUseCase,
        {
          provide: 'ReviewRepository',
          useValue: mockReviewRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateReviewUseCase>(CreateReviewUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('유효한 데이터로 리뷰를 생성한다', async () => {
      // Given
      const dto: CreateReviewDto = {
        institutionId: 'test-institution-id',
        userId: 'test-user-id',
        authorNickname: '테스트사용자',
        rating: 5,
        content: '매우 만족스러운 상담이었습니다.',
      };

      const createdReview = ReviewFixture.createReviewEntity({
        ...dto,
        helpfulCount: 0,
      });

      mockReviewRepository.create.mockResolvedValue(createdReview);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result).toMatchObject({
        id: createdReview.id,
        institutionId: dto.institutionId,
        userId: dto.userId,
        authorNickname: dto.authorNickname,
        rating: dto.rating,
        content: dto.content,
        helpfulCount: 0,
      });

      expect(mockReviewRepository.create).toHaveBeenCalledWith({
        institutionId: dto.institutionId,
        userId: dto.userId,
        authorNickname: dto.authorNickname,
        rating: dto.rating,
        content: dto.content,
        helpfulCount: 0,
      });
    });

    it('userId 없이 리뷰를 생성할 수 있다', async () => {
      // Given
      const dto: CreateReviewDto = {
        institutionId: 'test-institution-id',
        authorNickname: '익명사용자',
        rating: 4,
        content: '익명 리뷰입니다.',
      };

      const createdReview = ReviewFixture.createReviewEntity({
        institutionId: dto.institutionId,
        authorNickname: dto.authorNickname,
        rating: dto.rating,
        content: dto.content,
        userId: null as any,
        helpfulCount: 0,
      });

      mockReviewRepository.create.mockResolvedValue(createdReview);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.userId).toBeNull();
      expect(mockReviewRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: null,
        }),
      );
    });

    it('생성된 리뷰의 helpfulCount는 0으로 초기화된다', async () => {
      // Given
      const dto: CreateReviewDto = {
        institutionId: 'test-institution-id',
        authorNickname: '테스트사용자',
        rating: 5,
        content: '좋은 상담이었습니다.',
      };

      const createdReview = ReviewFixture.createReviewEntity({
        ...dto,
        helpfulCount: 0,
      });

      mockReviewRepository.create.mockResolvedValue(createdReview);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.helpfulCount).toBe(0);
    });

    it('평점이 1-5 범위 내에 있어야 한다', async () => {
      // Given
      const validRatings = [1, 2, 3, 4, 5];

      for (const rating of validRatings) {
        const dto: CreateReviewDto = {
          institutionId: 'test-institution-id',
          authorNickname: '테스트사용자',
          rating: rating as 1 | 2 | 3 | 4 | 5,
          content: `평점 ${rating}점 리뷰`,
        };

        const createdReview = ReviewFixture.createReviewEntity({
          ...dto,
          helpfulCount: 0,
        });

        mockReviewRepository.create.mockResolvedValue(createdReview);

        // When
        const result = await useCase.execute(dto);

        // Then
        expect(result.rating).toBe(rating);
      }
    });

    it('기관 이름을 응답에 포함한다', async () => {
      // Given
      const dto: CreateReviewDto = {
        institutionId: 'test-institution-id',
        authorNickname: '테스트사용자',
        rating: 5,
        content: '좋은 상담이었습니다.',
      };

      const institution = ReviewFixture.createInstitutionEntity({
        id: dto.institutionId,
        centerName: '테스트 상담센터',
      });

      const createdReview = ReviewFixture.createReviewEntity({
        ...dto,
        helpfulCount: 0,
        institution,
      });

      mockReviewRepository.create.mockResolvedValue(createdReview);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.institutionName).toBe('테스트 상담센터');
    });
  });
});
