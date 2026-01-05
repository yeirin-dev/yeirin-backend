import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GuardianProfileRepository } from '@domain/guardian/repository/guardian-profile.repository';
import { GuardianType } from '../entity/enums/guardian-type.enum';
import { GuardianProfileEntity } from '../entity/guardian-profile.entity';

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
      relations: ['user', 'careFacility', 'communityChildCenter'],
    });
  }

  async findByUserId(userId: string): Promise<GuardianProfileEntity | null> {
    return this.repository.findOne({
      where: { userId },
      relations: ['user', 'careFacility', 'communityChildCenter'],
    });
  }

  async create(
    profile: Omit<
      GuardianProfileEntity,
      'id' | 'createdAt' | 'updatedAt' | 'user' | 'careFacility' | 'communityChildCenter'
    >,
  ): Promise<GuardianProfileEntity> {
    const entity = this.repository.create(profile);
    return this.repository.save(entity);
  }

  async update(
    id: string,
    profile: Partial<GuardianProfileEntity>,
  ): Promise<GuardianProfileEntity> {
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

  async findByGuardianType(guardianType: GuardianType): Promise<GuardianProfileEntity[]> {
    return this.repository.find({
      where: { guardianType },
      relations: ['user', 'careFacility', 'communityChildCenter'],
    });
  }

  async findByCareFacilityId(careFacilityId: string): Promise<GuardianProfileEntity[]> {
    return this.repository.find({
      where: { careFacilityId },
      relations: ['user', 'careFacility'],
    });
  }

  async findByCommunityChildCenterId(
    communityChildCenterId: string,
  ): Promise<GuardianProfileEntity[]> {
    return this.repository.find({
      where: { communityChildCenterId },
      relations: ['user', 'communityChildCenter'],
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async countByCareFacilityId(careFacilityId: string): Promise<number> {
    return this.repository.count({
      where: { careFacilityId },
    });
  }

  async countByCommunityChildCenterId(communityChildCenterId: string): Promise<number> {
    return this.repository.count({
      where: { communityChildCenterId },
    });
  }
}
