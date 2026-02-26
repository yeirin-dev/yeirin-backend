import { VoucherLinkage, VoucherLinkageStatus } from '@domain/voucher-linkage/model/voucher-linkage';
import { VoucherLinkageEntity } from '../entity/voucher-linkage.entity';
import { VoucherLinkageStatus as EntityVoucherLinkageStatus } from '../entity/enums/voucher-linkage-status.enum';

/**
 * VoucherLinkage Mapper
 * Domain ↔ Infrastructure 변환 (Anti-Corruption Layer)
 */
export class VoucherLinkageMapper {
  /**
   * Entity Status → Domain Status
   */
  private static toDomainStatus(entityStatus: EntityVoucherLinkageStatus): VoucherLinkageStatus {
    switch (entityStatus) {
      case EntityVoucherLinkageStatus.PENDING:
        return VoucherLinkageStatus.PENDING;
      case EntityVoucherLinkageStatus.COMPLETED:
        return VoucherLinkageStatus.COMPLETED;
      default:
        return VoucherLinkageStatus.PENDING;
    }
  }

  /**
   * Domain Status → Entity Status
   */
  private static toEntityStatus(domainStatus: VoucherLinkageStatus): EntityVoucherLinkageStatus {
    switch (domainStatus) {
      case VoucherLinkageStatus.PENDING:
        return EntityVoucherLinkageStatus.PENDING;
      case VoucherLinkageStatus.COMPLETED:
        return EntityVoucherLinkageStatus.COMPLETED;
      default:
        return EntityVoucherLinkageStatus.PENDING;
    }
  }

  /**
   * Entity → Domain
   */
  static toDomain(entity: VoucherLinkageEntity): VoucherLinkage {
    return VoucherLinkage.restore({
      id: entity.id,
      counselRequestId: entity.counselRequestId,
      status: this.toDomainStatus(entity.status),
      linkedInstitutionName: entity.linkedInstitutionName,
      linkedInstitutionPhone: entity.linkedInstitutionPhone,
      linkedInstitutionAddress: entity.linkedInstitutionAddress,
      linkedCounselorName: entity.linkedCounselorName,
      linkedAt: entity.linkedAt,
      notes: entity.notes,
      isVoucherConfirmed: entity.isVoucherConfirmed,
      voucherType: entity.voucherType,
      wantsPlatformLinkage: entity.wantsPlatformLinkage,
      linkageDeclineReason: entity.linkageDeclineReason,
      linkageInfoSubmitted: entity.linkageInfoSubmitted,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Domain → Entity
   */
  static toEntity(domain: VoucherLinkage): VoucherLinkageEntity {
    const entity = new VoucherLinkageEntity();
    entity.id = domain.id;
    entity.counselRequestId = domain.counselRequestId;
    entity.status = this.toEntityStatus(domain.status);
    entity.linkedInstitutionName = domain.linkedInstitutionName;
    entity.linkedInstitutionPhone = domain.linkedInstitutionPhone;
    entity.linkedInstitutionAddress = domain.linkedInstitutionAddress;
    entity.linkedCounselorName = domain.linkedCounselorName;
    entity.linkedAt = domain.linkedAt;
    entity.notes = domain.notes;
    entity.isVoucherConfirmed = domain.isVoucherConfirmed;
    entity.voucherType = domain.voucherType;
    entity.wantsPlatformLinkage = domain.wantsPlatformLinkage;
    entity.linkageDeclineReason = domain.linkageDeclineReason;
    entity.linkageInfoSubmitted = domain.linkageInfoSubmitted;
    entity.createdBy = domain.createdBy;
    entity.updatedBy = domain.updatedBy;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
