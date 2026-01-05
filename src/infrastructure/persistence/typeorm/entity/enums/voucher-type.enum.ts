/**
 * 바우처 타입
 */
export enum VoucherType {
  /** 발달재활서비스 */
  DEVELOPMENTAL_REHABILITATION = 'DEVELOPMENTAL_REHABILITATION',

  /** 언어발달지원 */
  LANGUAGE_DEVELOPMENT = 'LANGUAGE_DEVELOPMENT',

  /** 아동심리지원서비스 (구 아동정서발달지원) */
  CHILD_PSYCHOLOGY = 'CHILD_PSYCHOLOGY',

  /** 발달장애인 부모심리상담 */
  PARENT_COUNSELING = 'PARENT_COUNSELING',

  /** 기타 지역 단위 바우처 */
  OTHER = 'OTHER',
}
