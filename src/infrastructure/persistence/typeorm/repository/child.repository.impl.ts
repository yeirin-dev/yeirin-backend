import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChildRepository } from '@domain/child/repository/child.repository';
import { Child } from '@domain/child/model/child';
import { ChildProfileEntity } from '../entity/child-profile.entity';
import { ChildMapper } from '../mapper/child.mapper';

/**
 * Child Repository 구현체
 * TypeORM 사용
 */
@Injectable()
export class ChildRepositoryImpl implements ChildRepository {
  constructor(
    @InjectRepository(ChildProfileEntity)
    private readonly childRepository: Repository<ChildProfileEntity>,
  ) {}

  async save(child: Child): Promise<Child> {
    const entity = ChildMapper.toEntity(child);
    const savedEntity = await this.childRepository.save(entity);
    return ChildMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Child | null> {
    const entity = await this.childRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return ChildMapper.toDomain(entity);
  }

  async findByGuardianId(guardianId: string): Promise<Child[]> {
    const entities = await this.childRepository.find({
      where: { guardianId },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => ChildMapper.toDomain(entity));
  }

  async findByInstitutionId(institutionId: string): Promise<Child[]> {
    const entities = await this.childRepository.find({
      where: { institutionId },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => ChildMapper.toDomain(entity));
  }

  async delete(id: string): Promise<void> {
    await this.childRepository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.childRepository.count({
      where: { id },
    });

    return count > 0;
  }
}
