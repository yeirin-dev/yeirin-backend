import { Result } from './result';

describe('Result', () => {
  describe('성공 케이스', () => {
    it('값이 있는 성공 결과를 생성한다', () => {
      const result = Result.ok('테스트 값');

      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.value).toBe('테스트 값');
    });

    it('값이 없는 성공 결과를 생성한다', () => {
      const result = Result.ok();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it('성공 결과에서 error를 가져오려 하면 예외가 발생한다', () => {
      const result = Result.ok('값');

      expect(() => result.error).toThrow('성공한 Result에서는 error를 가져올 수 없습니다');
    });
  });

  describe('실패 케이스', () => {
    it('에러 메시지를 포함한 실패 결과를 생성한다', () => {
      const result = Result.fail('에러 발생');

      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('에러 발생');
    });

    it('실패 결과에서 value를 가져오려 하면 예외가 발생한다', () => {
      const result = Result.fail('에러');

      expect(() => result.value).toThrow('실패한 Result에서는 value를 가져올 수 없습니다');
    });
  });

  describe('combine', () => {
    it('모든 결과가 성공이면 성공을 반환한다', () => {
      const results = [Result.ok(1), Result.ok(2), Result.ok(3)];

      const combined = Result.combine(results);

      expect(combined.isSuccess).toBe(true);
    });

    it('하나라도 실패가 있으면 첫 번째 실패를 반환한다', () => {
      const results = [
        Result.ok(1),
        Result.fail('첫 번째 에러'),
        Result.fail('두 번째 에러'),
      ];

      const combined = Result.combine(results);

      expect(combined.isFailure).toBe(true);
      expect(combined.error).toBe('첫 번째 에러');
    });
  });
});
