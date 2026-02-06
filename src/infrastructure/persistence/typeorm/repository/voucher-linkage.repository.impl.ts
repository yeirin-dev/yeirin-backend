import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { VoucherLinkage, VoucherLinkageStatus } from '@domain/voucher-linkage/model/voucher-linkage';
import { VoucherLinkageRepository } from '@domain/voucher-linkage/repository/voucher-linkage.repository';
import { VoucherLinkageEntity } from '../entity/voucher-linkage.entity';
import { VoucherLinkageMapper } from '../mapper/voucher-linkage.mapper';
import { VoucherLinkageStatus as EntityVoucherLinkageStatus } from '../entity/enums/voucher-linkage-status.enum';

/**
 * VoucherLinkage Repository 구현체
 */
@Injectable()
export class VoucherLinkageRepositoryImpl implements VoucherLinkageRepository {
  constructor(
    @InjectRepository(VoucherLinkageEntity)
    private readonly repository: Repository<VoucherLinkageEntity>,
  ) {}

  async save(voucherLinkage: VoucherLinkage): Promise<VoucherLinkage> {
    const entity = VoucherLinkageMapper.toEntity(voucherLinkage);
    const saved = await this.repository.save(entity);
    return VoucherLinkageMapper.toDomain(saved);
  }

  async findById(id: string): Promise<VoucherLinkage | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? VoucherLinkageMapper.toDomain(entity) : null;
  }

  async findByCounselRequestId(counselRequestId: string): Promise<VoucherLinkage | null> {
    const entity = await this.repository.findOne({ where: { counselRequestId } });
    return entity ? VoucherLinkageMapper.toDomain(entity) : null;
  }

  async findByStatus(status: VoucherLinkageStatus): Promise<VoucherLinkage[]> {
    const entityStatus = this.toEntityStatus(status);
    const entities = await this.repository.find({ where: { status: entityStatus } });
    return entities.map((entity) => VoucherLinkageMapper.toDomain(entity));
  }

  async findByCounselRequestIds(counselRequestIds: string[]): Promise<VoucherLinkage[]> {
    if (counselRequestIds.length === 0) {
      return [];
    }
    const entities = await this.repository.find({
      where: { counselRequestId: In(counselRequestIds) },
    });
    return entities.map((entity) => VoucherLinkageMapper.toDomain(entity));
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async deleteByCounselRequestId(counselRequestId: string): Promise<void> {
    await this.repository.delete({ counselRequestId });
  }

  private toEntityStatus(domainStatus: VoucherLinkageStatus): EntityVoucherLinkageStatus {
    switch (domainStatus) {
      case VoucherLinkageStatus.PENDING:
        return EntityVoucherLinkageStatus.PENDING;
      case VoucherLinkageStatus.COMPLETED:
        return EntityVoucherLinkageStatus.COMPLETED;
      default:
        return EntityVoucherLinkageStatus.PENDING;
    }
  }
}
