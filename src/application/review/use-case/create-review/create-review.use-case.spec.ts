import { Test, TestingModule } from '@nestjs/testing';
import { Review } from '@domain/review/model/review';
import { Rating } from '@domain/review/model/value-objects/rating.vo';
import { ReviewContent } from '@domain/review/model/value-objects/review-content.vo';
import { ReviewRepository } from '@domain/review/repository/review.repository.interface';
import { CreateReviewUseCase } from './create-review.use-case';

describe('CreateReviewUseCase', () => {
  let useCase: CreateReviewUseCase;
  let mockReviewRepository: jest.Mocked<ReviewRepository>;

  beforeEach(async () => {
    mockReviewRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByInstitutionId: jest.fn(),
      findByUserId: jest.fn(),
      existsByUserIdAndInstitutionId: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
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

  describe('리뷰 생성', () => {
    it('유효한 데이터로 리뷰를 생성한다', async () => {
      // Given
      const dto = {
        institutionId: 'inst-123',
        userId: 'user-456',
        rating: 5,
        content: '정말 좋은 상담 기관입니다. 상담사 선생님들이 매우 친절하십니다.',
      };

      const expectedReview = Review.create({
        institutionId: dto.institutionId,
        userId: dto.userId,
        rating: Rating.create(dto.rating).value,
        content: ReviewContent.create(dto.content).value,
      }).value;

      mockReviewRepository.existsByUserIdAndInstitutionId.mockResolvedValue(false);
      mockReviewRepository.save.mockResolvedValue(expectedReview);

      // When
      const result = await useCase.execute(dto);

      // Then
      expect(result.institutionId).toBe(dto.institutionId);
      expect(result.userId).toBe(dto.userId);
      expect(result.rating).toBe(dto.rating);
      expect(result.helpfulCount).toBe(0);
      expect(mockReviewRepository.save).toHaveBeenCalled();
    });

    it('이미 리뷰를 작성한 사용자는 중복 작성할 수 없다', async () => {
      // Given
      const dto = {
        institutionId: 'inst-123',
        userId: 'user-456',
        rating: 5,
        content: '정말 좋은 상담 기관입니다.',
      };

      mockReviewRepository.existsByUserIdAndInstitutionId.mockResolvedValue(true);

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow('이미 해당 기관에 리뷰를 작성하셨습니다');
      expect(mockReviewRepository.save).not.toHaveBeenCalled();
    });

    it('잘못된 별점으로 생성하면 실패한다', async () => {
      // Given
      const dto = {
        institutionId: 'inst-123',
        userId: 'user-456',
        rating: 6, // 잘못된 별점
        content: '좋은 상담 기관입니다',
      };

      mockReviewRepository.existsByUserIdAndInstitutionId.mockResolvedValue(false);

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow('별점은 1-5 사이여야 합니다');
      expect(mockReviewRepository.save).not.toHaveBeenCalled();
    });

    it('잘못된 리뷰 내용으로 생성하면 실패한다', async () => {
      // Given
      const dto = {
        institutionId: 'inst-123',
        userId: 'user-456',
        rating: 5,
        content: '너무 짧은 리뷰', // 10자 미만
      };

      mockReviewRepository.existsByUserIdAndInstitutionId.mockResolvedValue(false);

      // When & Then
      await expect(useCase.execute(dto)).rejects.toThrow('리뷰 내용은 최소 10자 이상이어야 합니다');
      expect(mockReviewRepository.save).not.toHaveBeenCalled();
    });
  });
});
