import { CounselRequestText } from './counsel-request-text';

describe('CounselRequestText', () => {
  describe('create', () => {
    it('유효한 상담의뢰지 텍스트로 생성한다', () => {
      const text = '8세 남아, ADHD 의심 증상, 학교 적응 어려움';

      const result = CounselRequestText.create(text);

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe(text);
    });

    it('빈 문자열은 실패한다', () => {
      const result = CounselRequestText.create('');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('상담의뢰지 텍스트는 비어있을 수 없습니다');
    });

    it('공백만 있는 문자열은 실패한다', () => {
      const result = CounselRequestText.create('   ');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('상담의뢰지 텍스트는 비어있을 수 없습니다');
    });

    it('10자 미만은 실패한다', () => {
      const result = CounselRequestText.create('짧은글');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('상담의뢰지 텍스트는 최소 10자 이상이어야 합니다');
    });

    it('5000자를 초과하면 실패한다', () => {
      const longText = 'a'.repeat(5001);

      const result = CounselRequestText.create(longText);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('상담의뢰지 텍스트는 최대 5000자를 초과할 수 없습니다');
    });
  });

  describe('equals', () => {
    it('같은 텍스트를 가진 객체는 동등하다', () => {
      const text1 = CounselRequestText.create('상담의뢰지 텍스트입니다').value;
      const text2 = CounselRequestText.create('상담의뢰지 텍스트입니다').value;

      expect(text1.equals(text2)).toBe(true);
    });

    it('다른 텍스트를 가진 객체는 동등하지 않다', () => {
      const text1 = CounselRequestText.create('첫 번째 상담의뢰지 텍스트입니다').value;
      const text2 = CounselRequestText.create('두 번째 상담의뢰지 텍스트입니다').value;

      expect(text1.equals(text2)).toBe(false);
    });
  });
});
