/**
 * 바우처 연계 상태
 */
export enum VoucherLinkageStatus {
  /** 연계대기 - 바우처 추천대상이나 아직 연계되지 않음 */
  PENDING = 'PENDING',

  /** 기관 검토중 - B-IMPACT 기관에서 연계 요청을 검토 중 */
  INSTITUTION_REVIEW = 'INSTITUTION_REVIEW',

  /** 연계완료 - 바우처 기관에 연계됨 */
  COMPLETED = 'COMPLETED',

  /** 기관 거절 - B-IMPACT 기관에서 연계를 거절함 */
  INSTITUTION_REJECTED = 'INSTITUTION_REJECTED',
}
