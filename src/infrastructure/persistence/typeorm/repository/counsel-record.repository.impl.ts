import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CounselRecord } from '@domain/counsel-record/model/counsel-record';
import { CounselRecordRepository } from '@domain/counsel-record/repository/counsel-record.repository';
import { CounselRecordEntity } from '../entity/counsel-record.entity';
import { CounselRecordMapper } from '../mapper/counsel-record.mapper';

@Injectable()
export class CounselRecordRepositoryImpl implements CounselRecordRepository {
  constructor(
    @InjectRepository(CounselRecordEntity)
    private readonly repository: Repository<CounselRecordEntity>,
  ) {}

  async save(record: CounselRecord): Promise<CounselRecord> {
    const entity = CounselRecordMapper.toEntity(record);
    const saved = await this.repository.save(entity);
    return CounselRecordMapper.toDomain(saved);
  }

  async findById(id: string): Promise<CounselRecord | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? CounselRecordMapper.toDomain(entity) : null;
  }

  async findByCounselSessionId(sessionId: string): Promise<CounselRecord | null> {
    const entity = await this.repository.findOne({
      where: { counselSessionId: sessionId },
    });
    return entity ? CounselRecordMapper.toDomain(entity) : null;
  }

  async findByInstitutionId(
    institutionId: string,
    page: number,
    limit: number,
  ): Promise<{ records: CounselRecord[]; total: number }> {
    const [entities, total] = await this.repository.findAndCount({
      where: { bImpactInstitutionId: institutionId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      records: entities.map((e) => CounselRecordMapper.toDomain(e)),
      total,
    };
  }

  async findByVoucherLinkageId(voucherLinkageId: string): Promise<CounselRecord[]> {
    const entities = await this.repository.find({
      where: { voucherLinkageId },
      order: { sessionNumber: 'ASC' },
    });
    return entities.map((e) => CounselRecordMapper.toDomain(e));
  }

  async findByChildId(childId: string): Promise<CounselRecord[]> {
    const entities = await this.repository.find({
      where: { childId },
      order: { sessionNumber: 'ASC' },
    });
    return entities.map((e) => CounselRecordMapper.toDomain(e));
  }
}
