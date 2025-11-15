import { InstitutionRecommendation } from '@domain/matching/entity/institution-recommendation';
import { MatchingRecommendation } from '@domain/matching/entity/matching-recommendation';
import { RecommendationRepository } from '@domain/matching/repository/recommendation.repository';
import { CounselRequestText } from '@domain/matching/value-object/counsel-request-text';
import { InstitutionId } from '@domain/matching/value-object/institution-id';
import { RecommendationScore } from '@domain/matching/value-object/recommendation-score';
import { RequestCounselorRecommendationUseCase } from './request-counselor-recommendation.usecase';

describe('RequestCounselorRecommendationUseCase', () => {
  let useCase: RequestCounselorRecommendationUseCase;
  let mockRepository: jest.Mocked<RecommendationRepository>;

  beforeEach(() => {
    mockRepository = {
      requestRecommendation: jest.fn(),
    };
    useCase = new RequestCounselorRecommendationUseCase(mockRepository);
  });

  describe('execute', () => {
    it('유효한 상담의뢰지 텍스트로 추천을 요청하면 추천 결과를 반환한다', async () => {
      // Given
      const requestText = '8세 남아, ADHD 의심 증상, 학교 적응 어려움';
      const counselRequestText = CounselRequestText.create(requestText).value;

      const mockRecommendation = MatchingRecommendation.create({
        counselRequestText,
        recommendations: [
          InstitutionRecommendation.create({
            institutionId: InstitutionId.create('inst-001').value,
            score: RecommendationScore.create(0.9).value,
            reason: 'ADHD 전문 상담기관',
          }).value,
          InstitutionRecommendation.create({
            institutionId: InstitutionId.create('inst-002').value,
            score: RecommendationScore.create(0.8).value,
            reason: '아동 전문 상담사 보유',
          }).value,
        ],
      }).value;

      mockRepository.requestRecommendation.mockResolvedValue(mockRecommendation);

      // When
      const result = await useCase.execute({ counselRequestText: requestText });

      // Then
      expect(result.counselRequestText).toBe(requestText);
      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations[0].institutionId).toBe('inst-001');
      expect(result.recommendations[0].score).toBe(0.9);
      expect(result.recommendations[0].isHighScore).toBe(true);
      expect(mockRepository.requestRecommendation).toHaveBeenCalledTimes(1);
    });

    it('빈 문자열이 입력되면 예외가 발생한다', async () => {
      // Given
      const requestText = '';

      // When & Then
      await expect(useCase.execute({ counselRequestText: requestText })).rejects.toThrow(
        '상담의뢰지 텍스트는 비어있을 수 없습니다',
      );
      expect(mockRepository.requestRecommendation).not.toHaveBeenCalled();
    });

    it('너무 짧은 텍스트가 입력되면 예외가 발생한다', async () => {
      // Given
      const requestText = '짧음';

      // When & Then
      await expect(useCase.execute({ counselRequestText: requestText })).rejects.toThrow(
        '상담의뢰지 텍스트는 최소 10자 이상이어야 합니다',
      );
      expect(mockRepository.requestRecommendation).not.toHaveBeenCalled();
    });

    it('추천 결과는 점수 기준으로 정렬되어 반환된다', async () => {
      // Given
      const requestText = '8세 남아, ADHD 의심 증상, 학교 적응 어려움';
      const counselRequestText = CounselRequestText.create(requestText).value;

      const mockRecommendation = MatchingRecommendation.create({
        counselRequestText,
        recommendations: [
          InstitutionRecommendation.create({
            institutionId: InstitutionId.create('inst-001').value,
            score: RecommendationScore.create(0.7).value,
            reason: '기관 1',
          }).value,
          InstitutionRecommendation.create({
            institutionId: InstitutionId.create('inst-002').value,
            score: RecommendationScore.create(0.9).value,
            reason: '기관 2',
          }).value,
          InstitutionRecommendation.create({
            institutionId: InstitutionId.create('inst-003').value,
            score: RecommendationScore.create(0.8).value,
            reason: '기관 3',
          }).value,
        ],
      }).value;

      mockRepository.requestRecommendation.mockResolvedValue(mockRecommendation);

      // When
      const result = await useCase.execute({ counselRequestText: requestText });

      // Then
      expect(result.recommendations[0].score).toBe(0.9);
      expect(result.recommendations[1].score).toBe(0.8);
      expect(result.recommendations[2].score).toBe(0.7);
    });
  });
});
