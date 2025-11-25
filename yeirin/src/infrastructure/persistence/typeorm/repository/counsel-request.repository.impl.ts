import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CounselRequest } from '@domain/counsel-request/model/counsel-request';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { CounselRequestStatus } from '@domain/counsel-request/model/value-objects/counsel-request-enums';
import { CounselRequestEntity } from '../entity/counsel-request.entity';
import { CounselRequestMapper } from '../mapper/counsel-request.mapper';

@Injectable()
export class CounselRequestRepositoryImpl implements CounselRequestRepository {
  constructor(
    @InjectRepository(CounselRequestEntity)
    private readonly repository: Repository<CounselRequestEntity>,
  ) {}

  async save(counselRequest: CounselRequest): Promise<CounselRequest> {
    const entity = CounselRequestMapper.toEntity(counselRequest);
    const saved = await this.repository.save(entity);
    return CounselRequestMapper.toDomain(saved);
  }

  async findById(id: string): Promise<CounselRequest | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? CounselRequestMapper.toDomain(entity) : null;
  }

  async findByChildId(childId: string): Promise<CounselRequest[]> {
    const entities = await this.repository.find({ where: { childId } });
    return entities.map((entity) => CounselRequestMapper.toDomain(entity));
  }

  async findByGuardianId(guardianId: string): Promise<CounselRequest[]> {
    const entities = await this.repository.find({ where: { guardianId } });
    return entities.map((entity) => CounselRequestMapper.toDomain(entity));
  }

  async findByStatus(status: CounselRequestStatus): Promise<CounselRequest[]> {
    const entities = await this.repository.find({ where: { status } });
    return entities.map((entity) => CounselRequestMapper.toDomain(entity));
  }

  async findByInstitutionId(institutionId: string): Promise<CounselRequest[]> {
    const entities = await this.repository.find({
      where: { matchedInstitutionId: institutionId },
    });
    return entities.map((entity) => CounselRequestMapper.toDomain(entity));
  }

  async findByCounselorId(counselorId: string): Promise<CounselRequest[]> {
    const entities = await this.repository.find({
      where: { matchedCounselorId: counselorId },
    });
    return entities.map((entity) => CounselRequestMapper.toDomain(entity));
  }

  async findAll(
    page: number,
    limit: number,
    status?: CounselRequestStatus,
  ): Promise<{ data: CounselRequest[]; total: number; page: number; limit: number }> {
    const whereCondition = status ? { status } : {};

    const [entities, total] = await this.repository.findAndCount({
      where: whereCondition,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: entities.map((entity) => CounselRequestMapper.toDomain(entity)),
      total,
      page,
      limit,
    };
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
