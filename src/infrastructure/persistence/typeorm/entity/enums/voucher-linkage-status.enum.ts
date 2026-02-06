/**
 * 바우처 연계 상태
 */
export enum VoucherLinkageStatus {
  /** 연계대기 - 바우처 추천대상이나 아직 연계되지 않음 */
  PENDING = 'PENDING',

  /** 연계완료 - 바우처 기관에 연계됨 */
  COMPLETED = 'COMPLETED',
}
