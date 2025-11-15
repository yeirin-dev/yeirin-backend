import { Test, TestingModule } from '@nestjs/testing';
import { ReviewRepository } from '@domain/review/repository/review.repository';
import { ReviewFixture } from '../../../../test/fixtures/review.fixture';
import { GetReviewsUseCase } from './get-reviews.usecase';

describe('GetReviewsUseCase', () => {
  let useCase: GetReviewsUseCase;
  let mockReviewRepository: jest.Mocked<ReviewRepository>;

  beforeEach(async () => {
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
        GetReviewsUseCase,
        {
          provide: 'ReviewRepository',
          useValue: mockReviewRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetReviewsUseCase>(GetReviewsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('페이지네이션이 적용된 리뷰 목록을 반환한다', async () => {
      // Given
      const reviews = Array.from({ length: 5 }, (_, i) =>
        ReviewFixture.createReviewEntity({ id: `review-${i}` }),
      );
      mockReviewRepository.findAll.mockResolvedValue([reviews, 15]);

      // When
      const result = await useCase.execute(1, 5);

      // Then
      expect(result.reviews).toHaveLength(5);
      expect(result.total).toBe(15);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(5);
      expect(mockReviewRepository.findAll).toHaveBeenCalledWith(1, 5);
    });

    it('빈 목록을 올바르게 반환한다', async () => {
      // Given
      mockReviewRepository.findAll.mockResolvedValue([[], 0]);

      // When
      const result = await useCase.execute(1, 10);

      // Then
      expect(result.reviews).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('각 리뷰에 기관 이름을 포함한다', async () => {
      // Given
      const institution = ReviewFixture.createInstitutionEntity({
        centerName: '테스트 상담센터',
      });
      const reviews = [ReviewFixture.createReviewEntity({ institution })];
      mockReviewRepository.findAll.mockResolvedValue([reviews, 1]);

      // When
      const result = await useCase.execute(1, 10);

      // Then
      expect(result.reviews[0].institutionName).toBe('테스트 상담센터');
    });

    it('페이지 번호와 제한이 올바르게 전달된다', async () => {
      // Given
      mockReviewRepository.findAll.mockResolvedValue([[], 0]);

      // When
      await useCase.execute(3, 20);

      // Then
      expect(mockReviewRepository.findAll).toHaveBeenCalledWith(3, 20);
    });
  });
});
