import { VoucherInstitutionEntity } from '@infrastructure/persistence/typeorm/entity/voucher-institution.entity';

/**
 * 바우처 기관 Repository 인터페이스
 */
export interface InstitutionRepository {
  /**
   * 기관 ID로 조회
   */
  findById(id: string): Promise<VoucherInstitutionEntity | null>;

  /**
   * 모든 기관 조회 (페이지네이션)
   */
  findAll(page: number, limit: number): Promise<[VoucherInstitutionEntity[], number]>;

  /**
   * 기관 생성
   */
  create(
    institution: Omit<VoucherInstitutionEntity, 'id' | 'createdAt' | 'updatedAt' | 'counselorProfiles' | 'reviews' | 'user'>,
  ): Promise<VoucherInstitutionEntity>;

  /**
   * 기관 정보 수정
   */
  update(id: string, institution: Partial<VoucherInstitutionEntity>): Promise<VoucherInstitutionEntity>;

  /**
   * 기관 삭제 (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * 바우처 타입으로 검색
   */
  findByVoucherType(voucherType: string): Promise<VoucherInstitutionEntity[]>;

  /**
   * 서비스 타입으로 검색
   */
  findByServiceType(serviceType: string): Promise<VoucherInstitutionEntity[]>;

  /**
   * 품질 인증 기관만 조회
   */
  findQualityCertified(): Promise<VoucherInstitutionEntity[]>;
}
