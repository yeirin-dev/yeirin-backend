import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { CounselSession } from '@domain/counsel-session/model/counsel-session';
import { CounselSessionRepository } from '@domain/counsel-session/repository/counsel-session.repository';
import { CounselSessionEntity } from '../entity/counsel-session.entity';
import { CounselSessionMapper } from '../mapper/counsel-session.mapper';

@Injectable()
export class CounselSessionRepositoryImpl implements CounselSessionRepository {
  constructor(
    @InjectRepository(CounselSessionEntity)
    private readonly repository: Repository<CounselSessionEntity>,
  ) {}

  async save(session: CounselSession): Promise<CounselSession> {
    const entity = CounselSessionMapper.toEntity(session);
    const saved = await this.repository.save(entity);
    return CounselSessionMapper.toDomain(saved);
  }

  async findById(id: string): Promise<CounselSession | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? CounselSessionMapper.toDomain(entity) : null;
  }

  async findByInstitutionIdAndDateRange(
    institutionId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CounselSession[]> {
    const entities = await this.repository.find({
      where: {
        bImpactInstitutionId: institutionId,
        scheduledDate: Between(startDate, endDate),
      },
      order: { scheduledDate: 'ASC', scheduledStartTime: 'ASC' },
    });
    return entities.map((e) => CounselSessionMapper.toDomain(e));
  }

  async findByVoucherLinkageId(voucherLinkageId: string): Promise<CounselSession[]> {
    const entities = await this.repository.find({
      where: { voucherLinkageId },
      order: { sessionNumber: 'ASC' },
    });
    return entities.map((e) => CounselSessionMapper.toDomain(e));
  }

  async getNextSessionNumber(voucherLinkageId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('cs')
      .select('MAX(cs.session_number)', 'maxNumber')
      .where('cs.voucher_linkage_id = :voucherLinkageId', { voucherLinkageId })
      .getRawOne();

    return (result?.maxNumber ?? 0) + 1;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
