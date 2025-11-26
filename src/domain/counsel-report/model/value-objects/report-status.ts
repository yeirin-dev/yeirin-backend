/**
 * 면담결과지 상태 Value Object
 *
 * @description
 * - DRAFT: 작성 중 (상담사가 아직 제출하지 않음)
 * - SUBMITTED: 제출됨 (상담사가 플랫폼에 제출, 보호자에게 전달 대기)
 * - REVIEWED: 확인됨 (보호자가 확인함)
 * - APPROVED: 승인됨 (보호자가 피드백 작성 완료)
 */
export enum ReportStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
}

/**
 * 면담결과지 상태 전환 규칙
 */
export const ReportStatusTransitions: Record<ReportStatus, ReportStatus[]> = {
  [ReportStatus.DRAFT]: [ReportStatus.SUBMITTED],
  [ReportStatus.SUBMITTED]: [ReportStatus.REVIEWED, ReportStatus.DRAFT], // 반려 가능
  [ReportStatus.REVIEWED]: [ReportStatus.APPROVED],
  [ReportStatus.APPROVED]: [], // 최종 상태
};

/**
 * 상태 전환 가능 여부 검증
 */
export function canTransitionTo(from: ReportStatus, to: ReportStatus): boolean {
  const allowedTransitions = ReportStatusTransitions[from];
  return allowedTransitions.includes(to);
}

/**
 * 상담사가 수정 가능한 상태인지 확인
 */
export function isCounselorEditable(status: ReportStatus): boolean {
  return status === ReportStatus.DRAFT;
}

/**
 * 보호자가 확인 가능한 상태인지 확인
 */
export function isGuardianViewable(status: ReportStatus): boolean {
  return status !== ReportStatus.DRAFT;
}
