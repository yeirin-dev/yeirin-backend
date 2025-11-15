import { AIRecommendationRepositoryImpl } from './ai-recommendation.repository.impl';
import { AIRecommendationClient } from './ai-recommendation.client';
import { CounselRequestText } from '@domain/matching/value-object/counsel-request-text';

describe('AIRecommendationRepositoryImpl', () => {
  let repository: AIRecommendationRepositoryImpl;
  let mockClient: jest.Mocked<AIRecommendationClient>;

  beforeEach(() => {
    mockClient = {
      requestRecommendation: jest.fn(),
    } as unknown as jest.Mocked<AIRecommendationClient>;

    repository = new AIRecommendationRepositoryImpl(mockClient);
  });

  describe('requestRecommendation', () => {
    it('AI 클라이언트의 응답을 Domain Model로 변환한다', async () => {
      // Given
      const counselRequestText = CounselRequestText.create(
        '8세 남아, ADHD 의심 증상, 학교 적응 어려움',
      ).value;

      mockClient.requestRecommendation.mockResolvedValue({
        recommendations: [
          {
            institution_id: 'inst-001',
            center_name: '서울아동심리상담센터',
            score: 0.9,
            reasoning: 'ADHD 전문',
            address: '서울특별시 강남구',
            average_rating: 4.5,
          },
          {
            institution_id: 'inst-002',
            center_name: '부산아동상담센터',
            score: 0.8,
            reasoning: '아동 전문',
            address: '부산광역시 해운대구',
            average_rating: 4.3,
          },
        ],
        total_institutions: 2,
        request_text: '8세 남아, ADHD 의심 증상, 학교 적응 어려움',
      });

      // When
      const result = await repository.requestRecommendation(counselRequestText);

      // Then
      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations[0].institutionId.value).toBe('inst-001');
      expect(result.recommendations[0].score.value).toBe(0.9);
      expect(result.recommendations[0].reason).toBe('ADHD 전문');
    });

    it('AI 응답이 빈 배열이면 예외가 발생한다', async () => {
      // Given
      const counselRequestText = CounselRequestText.create(
        '8세 남아, ADHD 의심 증상, 학교 적응 어려움',
      ).value;

      mockClient.requestRecommendation.mockResolvedValue({
        recommendations: [],
        total_institutions: 0,
        request_text: '8세 남아, ADHD 의심 증상, 학교 적응 어려움',
      });

      // When & Then
      await expect(repository.requestRecommendation(counselRequestText)).rejects.toThrow(
        '최소 1개 이상의 추천 결과가 필요합니다',
      );
    });

    it('유효하지 않은 점수가 포함되면 예외가 발생한다', async () => {
      // Given
      const counselRequestText = CounselRequestText.create(
        '8세 남아, ADHD 의심 증상, 학교 적응 어려움',
      ).value;

      mockClient.requestRecommendation.mockResolvedValue({
        recommendations: [
          {
            institution_id: 'inst-001',
            center_name: '서울아동심리상담센터',
            score: 1.5, // 유효하지 않은 점수
            reasoning: 'ADHD 전문',
            address: '서울특별시 강남구',
            average_rating: 4.5,
          },
        ],
        total_institutions: 1,
        request_text: '8세 남아, ADHD 의심 증상, 학교 적응 어려움',
      });

      // When & Then
      await expect(repository.requestRecommendation(counselRequestText)).rejects.toThrow(
        '추천 점수는 0.0에서 1.0 사이여야 합니다',
      );
    });
  });
});
