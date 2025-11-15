import { InstitutionId } from '../value-object/institution-id';
import { RecommendationScore } from '../value-object/recommendation-score';
import { InstitutionRecommendation } from './institution-recommendation';

describe('InstitutionRecommendation', () => {
  describe('create', () => {
    it('유효한 추천 결과를 생성한다', () => {
      const institutionId = InstitutionId.create('inst-001').value;
      const score = RecommendationScore.create(0.85).value;
      const reason = '아동 전문 상담사 보유, ADHD 치료 경험 풍부';

      const result = InstitutionRecommendation.create({
        institutionId,
        score,
        reason,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.institutionId).toBe(institutionId);
      expect(result.value.score).toBe(score);
      expect(result.value.reason).toBe(reason);
    });

    it('추천 이유가 없으면 실패한다', () => {
      const institutionId = InstitutionId.create('inst-001').value;
      const score = RecommendationScore.create(0.85).value;

      const result = InstitutionRecommendation.create({
        institutionId,
        score,
        reason: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('추천 이유는 필수입니다');
    });

    it('추천 이유가 1000자를 초과하면 실패한다', () => {
      const institutionId = InstitutionId.create('inst-001').value;
      const score = RecommendationScore.create(0.85).value;
      const longReason = 'a'.repeat(1001);

      const result = InstitutionRecommendation.create({
        institutionId,
        score,
        reason: longReason,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('추천 이유는 최대 1000자까지 가능합니다');
    });
  });

  describe('비즈니스 로직', () => {
    it('높은 점수 추천을 판별한다', () => {
      const recommendation = InstitutionRecommendation.create({
        institutionId: InstitutionId.create('inst-001').value,
        score: RecommendationScore.create(0.8).value,
        reason: '추천 이유',
      }).value;

      expect(recommendation.isHighScore()).toBe(true);
    });

    it('낮은 점수 추천을 판별한다', () => {
      const recommendation = InstitutionRecommendation.create({
        institutionId: InstitutionId.create('inst-001').value,
        score: RecommendationScore.create(0.6).value,
        reason: '추천 이유',
      }).value;

      expect(recommendation.isHighScore()).toBe(false);
    });
  });
});
