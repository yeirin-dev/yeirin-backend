import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GuardianProfileEntity } from '../entity/guardian-profile.entity';
import { GuardianProfileRepository } from '@domain/guardian/repository/guardian-profile.repository';

/**
 * GuardianProfile Repository 구현체
 */
@Injectable()
export class GuardianProfileRepositoryImpl implements GuardianProfileRepository {
  constructor(
    @InjectRepository(GuardianProfileEntity)
    private readonly repository: Repository<GuardianProfileEntity>,
  ) {}

  async findById(id: string): Promise<GuardianProfileEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findByUserId(userId: string): Promise<GuardianProfileEntity | null> {
    return this.repository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async create(
    profile: Omit<GuardianProfileEntity, 'id' | 'createdAt' | 'updatedAt' | 'user'>,
  ): Promise<GuardianProfileEntity> {
    const entity = this.repository.create(profile);
    return this.repository.save(entity);
  }

  async update(id: string, profile: Partial<GuardianProfileEntity>): Promise<GuardianProfileEntity> {
    await this.repository.update(id, profile);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`GuardianProfile with id ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByGuardianType(guardianType: 'TEACHER' | 'PARENT'): Promise<GuardianProfileEntity[]> {
    return this.repository.find({
      where: { guardianType },
      relations: ['user'],
    });
  }

  async findByOrganization(organizationName: string): Promise<GuardianProfileEntity[]> {
    return this.repository.find({
      where: { organizationName },
      relations: ['user'],
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }
}
