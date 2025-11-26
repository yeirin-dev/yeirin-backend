import {
  ReportStatus,
  ReportStatusTransitions,
  canTransitionTo,
  isCounselorEditable,
  isGuardianViewable,
} from './report-status';

describe('ReportStatus Value Object', () => {
  describe('상태 전환 규칙', () => {
    it('DRAFT에서 SUBMITTED로 전환할 수 있다', () => {
      expect(canTransitionTo(ReportStatus.DRAFT, ReportStatus.SUBMITTED)).toBe(true);
    });

    it('DRAFT에서 REVIEWED로 직접 전환할 수 없다', () => {
      expect(canTransitionTo(ReportStatus.DRAFT, ReportStatus.REVIEWED)).toBe(false);
    });

    it('SUBMITTED에서 REVIEWED로 전환할 수 있다', () => {
      expect(canTransitionTo(ReportStatus.SUBMITTED, ReportStatus.REVIEWED)).toBe(true);
    });

    it('SUBMITTED에서 DRAFT로 반려할 수 있다', () => {
      expect(canTransitionTo(ReportStatus.SUBMITTED, ReportStatus.DRAFT)).toBe(true);
    });

    it('REVIEWED에서 APPROVED로 전환할 수 있다', () => {
      expect(canTransitionTo(ReportStatus.REVIEWED, ReportStatus.APPROVED)).toBe(true);
    });

    it('APPROVED는 최종 상태로 더 이상 전환할 수 없다', () => {
      expect(ReportStatusTransitions[ReportStatus.APPROVED]).toEqual([]);
    });
  });

  describe('상담사 수정 가능 여부', () => {
    it('DRAFT 상태에서는 수정할 수 있다', () => {
      expect(isCounselorEditable(ReportStatus.DRAFT)).toBe(true);
    });

    it('SUBMITTED 상태에서는 수정할 수 없다', () => {
      expect(isCounselorEditable(ReportStatus.SUBMITTED)).toBe(false);
    });

    it('REVIEWED 상태에서는 수정할 수 없다', () => {
      expect(isCounselorEditable(ReportStatus.REVIEWED)).toBe(false);
    });

    it('APPROVED 상태에서는 수정할 수 없다', () => {
      expect(isCounselorEditable(ReportStatus.APPROVED)).toBe(false);
    });
  });

  describe('보호자 조회 가능 여부', () => {
    it('DRAFT 상태는 보호자가 볼 수 없다', () => {
      expect(isGuardianViewable(ReportStatus.DRAFT)).toBe(false);
    });

    it('SUBMITTED 상태부터 보호자가 볼 수 있다', () => {
      expect(isGuardianViewable(ReportStatus.SUBMITTED)).toBe(true);
    });

    it('REVIEWED 상태는 보호자가 볼 수 있다', () => {
      expect(isGuardianViewable(ReportStatus.REVIEWED)).toBe(true);
    });

    it('APPROVED 상태는 보호자가 볼 수 있다', () => {
      expect(isGuardianViewable(ReportStatus.APPROVED)).toBe(true);
    });
  });
});
