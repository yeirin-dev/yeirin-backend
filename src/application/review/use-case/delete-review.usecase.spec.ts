import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteReviewUseCase } from './delete-review.usecase';
import { ReviewRepository } from '@domain/review/repository/review.repository';
import { ReviewFixture } from '../../../../test/fixtures/review.fixture';

describe('DeleteReviewUseCase', () => {
  let useCase: DeleteReviewUseCase;
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
        DeleteReviewUseCase,
        {
          provide: 'ReviewRepository',
          useValue: mockReviewRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteReviewUseCase>(DeleteReviewUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('존재하는 리뷰를 삭제한다', async () => {
      // Given
      const reviewId = 'test-review-id';
      const existingReview = ReviewFixture.createReviewEntity({ id: reviewId });

      mockReviewRepository.findById.mockResolvedValue(existingReview);
      mockReviewRepository.delete.mockResolvedValue(undefined);

      // When
      await useCase.execute(reviewId);

      // Then
      expect(mockReviewRepository.findById).toHaveBeenCalledWith(reviewId);
      expect(mockReviewRepository.delete).toHaveBeenCalledWith(reviewId);
    });

    it('존재하지 않는 리뷰 삭제 시 NotFoundException을 발생시킨다', async () => {
      // Given
      const reviewId = 'non-existent-id';
      mockReviewRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(useCase.execute(reviewId)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(reviewId)).rejects.toThrow(
        `리뷰를 찾을 수 없습니다 (ID: ${reviewId})`
      );
      expect(mockReviewRepository.delete).not.toHaveBeenCalled();
    });

    it('삭제 전 리뷰 존재 여부를 확인한다', async () => {
      // Given
      const reviewId = 'test-review-id';
      const existingReview = ReviewFixture.createReviewEntity({ id: reviewId });

      mockReviewRepository.findById.mockResolvedValue(existingReview);
      mockReviewRepository.delete.mockResolvedValue(undefined);

      // When
      await useCase.execute(reviewId);

      // Then
      expect(mockReviewRepository.findById).toHaveBeenCalledWith(reviewId);
      expect(mockReviewRepository.delete).toHaveBeenCalledWith(reviewId);
    });
  });
});
