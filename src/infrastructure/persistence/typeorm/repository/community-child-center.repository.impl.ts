import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityChildCenter } from '@domain/community-child-center/model/community-child-center';
import { CommunityChildCenterRepository } from '@domain/community-child-center/repository/community-child-center.repository';
import { CommunityChildCenterEntity } from '../entity/community-child-center.entity';
import { CommunityChildCenterMapper } from '../mapper/community-child-center.mapper';

/**
 * CommunityChildCenter Repository 구현체
 */
@Injectable()
export class CommunityChildCenterRepositoryImpl implements CommunityChildCenterRepository {
  constructor(
    @InjectRepository(CommunityChildCenterEntity)
    private readonly repository: Repository<CommunityChildCenterEntity>,
  ) {}

  async findById(id: string): Promise<CommunityChildCenter | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    return entity ? CommunityChildCenterMapper.toDomain(entity) : null;
  }

  async findByName(name: string): Promise<CommunityChildCenter | null> {
    const entity = await this.repository.findOne({
      where: { name },
    });

    return entity ? CommunityChildCenterMapper.toDomain(entity) : null;
  }

  async findAllActive(): Promise<CommunityChildCenter[]> {
    const entities = await this.repository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    return CommunityChildCenterMapper.toDomainList(entities);
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<{ data: CommunityChildCenter[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const whereCondition: Record<string, unknown> = {};
    if (options?.isActive !== undefined) {
      whereCondition.isActive = options.isActive;
    }

    const [entities, total] = await this.repository.findAndCount({
      where: whereCondition,
      order: { name: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data: CommunityChildCenterMapper.toDomainList(entities),
      total,
    };
  }

  async save(center: CommunityChildCenter): Promise<CommunityChildCenter> {
    const entityData = CommunityChildCenterMapper.toEntity(center);
    const entity = this.repository.create(entityData);
    const saved = await this.repository.save(entity);
    return CommunityChildCenterMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.repository.count({ where: { name } });
    return count > 0;
  }
}
