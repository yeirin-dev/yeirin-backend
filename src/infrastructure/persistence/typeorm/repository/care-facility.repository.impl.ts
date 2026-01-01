import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CareFacility } from '@domain/care-facility/model/care-facility';
import { CareFacilityRepository } from '@domain/care-facility/repository/care-facility.repository';
import { CareFacilityEntity } from '../entity/care-facility.entity';
import { CareFacilityMapper } from '../mapper/care-facility.mapper';

/**
 * CareFacility Repository 구현체
 */
@Injectable()
export class CareFacilityRepositoryImpl implements CareFacilityRepository {
  constructor(
    @InjectRepository(CareFacilityEntity)
    private readonly repository: Repository<CareFacilityEntity>,
  ) {}

  async findById(id: string): Promise<CareFacility | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    return entity ? CareFacilityMapper.toDomain(entity) : null;
  }

  async findByName(name: string): Promise<CareFacility | null> {
    const entity = await this.repository.findOne({
      where: { name },
    });

    return entity ? CareFacilityMapper.toDomain(entity) : null;
  }

  async findAllActive(): Promise<CareFacility[]> {
    const entities = await this.repository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    return CareFacilityMapper.toDomainList(entities);
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<{ data: CareFacility[]; total: number }> {
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
      data: CareFacilityMapper.toDomainList(entities),
      total,
    };
  }

  async save(facility: CareFacility): Promise<CareFacility> {
    const entityData = CareFacilityMapper.toEntity(facility);
    const entity = this.repository.create(entityData);
    const saved = await this.repository.save(entity);
    return CareFacilityMapper.toDomain(saved);
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

  async findActiveByDistrict(district: string): Promise<CareFacility[]> {
    const entities = await this.repository.find({
      where: { district, isActive: true },
      order: { name: 'ASC' },
    });

    return CareFacilityMapper.toDomainList(entities);
  }

  async getDistinctDistricts(): Promise<string[]> {
    const result = await this.repository
      .createQueryBuilder('facility')
      .select('DISTINCT facility.district', 'district')
      .where('facility.isActive = :isActive', { isActive: true })
      .orderBy('facility.district', 'ASC')
      .getRawMany<{ district: string }>();

    return result.map((r) => r.district);
  }
}
