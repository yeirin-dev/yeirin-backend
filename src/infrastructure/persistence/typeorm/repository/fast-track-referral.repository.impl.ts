import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FastTrackCounselingReferral } from '@domain/fast-track-referral/model/fast-track-referral';
import { FastTrackReferralRepository } from '@domain/fast-track-referral/repository/fast-track-referral.repository';
import { FastTrackReferralEntity } from '../entity/fast-track-referral.entity';
import { FastTrackReferralMapper } from '../mapper/fast-track-referral.mapper';

/**
 * FastTrackReferral Repository 구현체
 */
@Injectable()
export class FastTrackReferralRepositoryImpl implements FastTrackReferralRepository {
  constructor(
    @InjectRepository(FastTrackReferralEntity)
    private readonly repository: Repository<FastTrackReferralEntity>,
  ) {}

  async save(referral: FastTrackCounselingReferral): Promise<FastTrackCounselingReferral> {
    const entity = FastTrackReferralMapper.toEntity(referral);
    const saved = await this.repository.save(entity);
    return FastTrackReferralMapper.toDomain(saved);
  }

  async findById(id: string): Promise<FastTrackCounselingReferral | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? FastTrackReferralMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<FastTrackCounselingReferral[]> {
    const entities = await this.repository.find({ order: { createdAt: 'DESC' } });
    return entities.map((entity) => FastTrackReferralMapper.toDomain(entity));
  }
}
