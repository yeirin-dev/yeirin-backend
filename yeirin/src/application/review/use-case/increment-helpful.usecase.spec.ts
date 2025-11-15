import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReviewRepository } from '@domain/review/repository/review.repository';
import { ReviewFixture } from '../../../../test/fixtures/review.fixture';
import { IncrementHelpfulUseCase } from './increment-helpful.usecase';

describe('IncrementHelpfulUseCase', () => {
  let useCase: IncrementHelpfulUseCase;
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
        IncrementHelpfulUseCase,
        {
          provide: 'ReviewRepository',
          useValue: mockReviewRepository,
        },
      ],
    }).compile();

    useCase = module.get<IncrementHelpfulUseCase>(IncrementHelpfulUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('도움이 됨 카운트를 1 증가시킨다', async () => {
      // Given
      const reviewId = 'test-review-id';
      const existingReview = ReviewFixture.createReviewEntity({
        id: reviewId,
        helpfulCount: 5,
      });
      const updatedReview = { ...existingReview, helpfulCount: 6 };

      mockReviewRepository.findById.mockResolvedValue(existingReview);
      mockReviewRepository.incrementHelpfulCount.mockResolvedValue(updatedReview);

      // When
      const result = await useCase.execute(reviewId);

      // Then
      expect(result.helpfulCount).toBe(6);
      expect(mockReviewRepository.findById).toHaveBeenCalledWith(reviewId);
      expect(mockReviewRepository.incrementHelpfulCount).toHaveBeenCalledWith(reviewId);
    });

    it('존재하지 않는 리뷰 ID로 요청 시 NotFoundException을 발생시킨다', async () => {
      // Given
      const reviewId = 'non-existent-id';
      mockReviewRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(useCase.execute(reviewId)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(reviewId)).rejects.toThrow(
        `리뷰를 찾을 수 없습니다 (ID: ${reviewId})`,
      );
    });

    it('helpfulCount가 0인 리뷰도 증가시킬 수 있다', async () => {
      // Given
      const reviewId = 'test-review-id';
      const existingReview = ReviewFixture.createReviewEntity({
        id: reviewId,
        helpfulCount: 0,
      });
      const updatedReview = { ...existingReview, helpfulCount: 1 };

      mockReviewRepository.findById.mockResolvedValue(existingReview);
      mockReviewRepository.incrementHelpfulCount.mockResolvedValue(updatedReview);

      // When
      const result = await useCase.execute(reviewId);

      // Then
      expect(result.helpfulCount).toBe(1);
    });

    it('여러 번 호출해도 매번 1씩 증가한다', async () => {
      // Given
      const reviewId = 'test-review-id';
      let currentCount = 10;

      for (let i = 0; i < 3; i++) {
        const existingReview = ReviewFixture.createReviewEntity({
          id: reviewId,
          helpfulCount: currentCount,
        });
        const updatedReview = { ...existingReview, helpfulCount: currentCount + 1 };

        mockReviewRepository.findById.mockResolvedValue(existingReview);
        mockReviewRepository.incrementHelpfulCount.mockResolvedValue(updatedReview);

        // When
        const result = await useCase.execute(reviewId);

        // Then
        expect(result.helpfulCount).toBe(currentCount + 1);
        currentCount++;
      }
    });

    it('업데이트된 리뷰의 모든 정보를 응답에 포함한다', async () => {
      // Given
      const reviewId = 'test-review-id';
      const institution = ReviewFixture.createInstitutionEntity({
        centerName: '테스트 상담센터',
      });
      const existingReview = ReviewFixture.createReviewEntity({
        id: reviewId,
        helpfulCount: 5,
        institution,
      });
      const updatedReview = { ...existingReview, helpfulCount: 6 };

      mockReviewRepository.findById.mockResolvedValue(existingReview);
      mockReviewRepository.incrementHelpfulCount.mockResolvedValue(updatedReview);

      // When
      const result = await useCase.execute(reviewId);

      // Then
      expect(result).toMatchObject({
        id: reviewId,
        institutionName: '테스트 상담센터',
        helpfulCount: 6,
      });
    });
  });
});
