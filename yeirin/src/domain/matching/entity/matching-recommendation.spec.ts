import { MatchingRecommendation } from './matching-recommendation';
import { InstitutionRecommendation } from './institution-recommendation';
import { CounselRequestText } from '../value-object/counsel-request-text';
import { InstitutionId } from '../value-object/institution-id';
import { RecommendationScore } from '../value-object/recommendation-score';

describe('MatchingRecommendation', () => {
  const createSampleRecommendation = (
    id: string,
    score: number,
  ): InstitutionRecommendation => {
    return InstitutionRecommendation.create({
      institutionId: InstitutionId.create(id).value,
      score: RecommendationScore.create(score).value,
      reason: `${id} 추천 이유`,
    }).value;
  };

  describe('create', () => {
    it('유효한 매칭 추천 결과를 생성한다', () => {
      const requestText = CounselRequestText.create('8세 남아, ADHD 의심 증상').value;
      const recommendations = [
        createSampleRecommendation('inst-001', 0.9),
        createSampleRecommendation('inst-002', 0.8),
      ];

      const result = MatchingRecommendation.create({
        counselRequestText: requestText,
        recommendations,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.recommendations).toHaveLength(2);
    });

    it('추천 결과가 없으면 실패한다', () => {
      const requestText = CounselRequestText.create('8세 남아, ADHD 의심 증상').value;

      const result = MatchingRecommendation.create({
        counselRequestText: requestText,
        recommendations: [],
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('최소 1개 이상의 추천 결과가 필요합니다');
    });

    it('추천 결과가 10개를 초과하면 실패한다', () => {
      const requestText = CounselRequestText.create('8세 남아, ADHD 의심 증상').value;
      const recommendations = Array.from({ length: 11 }, (_, i) =>
        createSampleRecommendation(`inst-${i}`, 0.8),
      );

      const result = MatchingRecommendation.create({
        counselRequestText: requestText,
        recommendations,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('추천 결과는 최대 10개까지 가능합니다');
    });
  });

  describe('비즈니스 로직', () => {
    it('점수순으로 정렬된 추천 결과를 반환한다', () => {
      const requestText = CounselRequestText.create('8세 남아, ADHD 의심 증상').value;
      const recommendations = [
        createSampleRecommendation('inst-001', 0.7),
        createSampleRecommendation('inst-002', 0.9),
        createSampleRecommendation('inst-003', 0.8),
      ];

      const matching = MatchingRecommendation.create({
        counselRequestText: requestText,
        recommendations,
      }).value;

      const sorted = matching.getSortedByScore();

      expect(sorted[0].score.value).toBe(0.9);
      expect(sorted[1].score.value).toBe(0.8);
      expect(sorted[2].score.value).toBe(0.7);
    });

    it('최고 추천 기관을 반환한다', () => {
      const requestText = CounselRequestText.create('8세 남아, ADHD 의심 증상').value;
      const recommendations = [
        createSampleRecommendation('inst-001', 0.7),
        createSampleRecommendation('inst-002', 0.9),
        createSampleRecommendation('inst-003', 0.8),
      ];

      const matching = MatchingRecommendation.create({
        counselRequestText: requestText,
        recommendations,
      }).value;

      const topRecommendation = matching.getTopRecommendation();

      expect(topRecommendation.institutionId.value).toBe('inst-002');
      expect(topRecommendation.score.value).toBe(0.9);
    });

    it('높은 점수의 추천만 필터링한다', () => {
      const requestText = CounselRequestText.create('8세 남아, ADHD 의심 증상').value;
      const recommendations = [
        createSampleRecommendation('inst-001', 0.6),
        createSampleRecommendation('inst-002', 0.8),
        createSampleRecommendation('inst-003', 0.75),
      ];

      const matching = MatchingRecommendation.create({
        counselRequestText: requestText,
        recommendations,
      }).value;

      const highScored = matching.getHighScoredRecommendations();

      expect(highScored).toHaveLength(2);
      expect(highScored.every((r) => r.score.value >= 0.7)).toBe(true);
    });
  });
});
