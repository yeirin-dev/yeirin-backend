import { VoucherLinkage, VoucherLinkageStatus } from '../model/voucher-linkage';

/**
 * VoucherLinkage Repository Interface
 * (도메인 계층 - 프레임워크 독립)
 */
export interface VoucherLinkageRepository {
  /**
   * 저장 (생성 또는 수정)
   */
  save(voucherLinkage: VoucherLinkage): Promise<VoucherLinkage>;

  /**
   * ID로 조회
   */
  findById(id: string): Promise<VoucherLinkage | null>;

  /**
   * 상담의뢰지 ID로 조회 (1:1 관계)
   */
  findByCounselRequestId(counselRequestId: string): Promise<VoucherLinkage | null>;

  /**
   * 상태별 조회
   */
  findByStatus(status: VoucherLinkageStatus): Promise<VoucherLinkage[]>;

  /**
   * 상담의뢰지 ID 목록으로 일괄 조회
   */
  findByCounselRequestIds(counselRequestIds: string[]): Promise<VoucherLinkage[]>;

  /**
   * 삭제
   */
  delete(id: string): Promise<void>;

  /**
   * 상담의뢰지 ID로 삭제
   */
  deleteByCounselRequestId(counselRequestId: string): Promise<void>;

  /**
   * 연계된 바우처 기관 ID로 조회 (B-IMPACT 기관용)
   */
  findByLinkedVoucherInstitutionId(
    institutionId: string,
    status?: VoucherLinkageStatus,
  ): Promise<VoucherLinkage[]>;
}

/**
 * VoucherLinkage Repository Token
 */
export const VOUCHER_LINKAGE_REPOSITORY = 'VoucherLinkageRepository';
