import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EducationWelfareSchool } from '@domain/education-welfare-school/model/education-welfare-school';
import { EducationWelfareSchoolRepository } from '@domain/education-welfare-school/repository/education-welfare-school.repository';
import { EducationWelfareSchoolEntity } from '../entity/education-welfare-school.entity';
import { EducationWelfareSchoolMapper } from '../mapper/education-welfare-school.mapper';

/**
 * EducationWelfareSchool Repository 구현체
 */
@Injectable()
export class EducationWelfareSchoolRepositoryImpl implements EducationWelfareSchoolRepository {
  constructor(
    @InjectRepository(EducationWelfareSchoolEntity)
    private readonly repository: Repository<EducationWelfareSchoolEntity>,
  ) {}

  async findById(id: string): Promise<EducationWelfareSchool | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    return entity ? EducationWelfareSchoolMapper.toDomain(entity) : null;
  }

  async findByName(name: string): Promise<EducationWelfareSchool | null> {
    const entity = await this.repository.findOne({
      where: { name },
    });

    return entity ? EducationWelfareSchoolMapper.toDomain(entity) : null;
  }

  async findAllActive(): Promise<EducationWelfareSchool[]> {
    const entities = await this.repository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    return EducationWelfareSchoolMapper.toDomainList(entities);
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<{ data: EducationWelfareSchool[]; total: number }> {
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
      data: EducationWelfareSchoolMapper.toDomainList(entities),
      total,
    };
  }

  async save(school: EducationWelfareSchool): Promise<EducationWelfareSchool> {
    const entityData = EducationWelfareSchoolMapper.toEntity(school);
    const entity = this.repository.create(entityData);
    const saved = await this.repository.save(entity);
    return EducationWelfareSchoolMapper.toDomain(saved);
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

  async findActiveByDistrict(district: string): Promise<EducationWelfareSchool[]> {
    const entities = await this.repository.find({
      where: { district, isActive: true },
      order: { name: 'ASC' },
    });

    return EducationWelfareSchoolMapper.toDomainList(entities);
  }

  async getDistinctDistricts(): Promise<string[]> {
    const result = await this.repository
      .createQueryBuilder('school')
      .select('DISTINCT school.district', 'district')
      .where('school.isActive = :isActive', { isActive: true })
      .orderBy('school.district', 'ASC')
      .getRawMany<{ district: string }>();

    return result.map((r) => r.district);
  }
}
