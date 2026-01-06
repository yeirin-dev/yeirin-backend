import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CounselReport } from '@domain/counsel-report/model/counsel-report';
import { ReportStatus } from '@domain/counsel-report/model/value-objects/report-status';
import { CounselReportRepository } from '@domain/counsel-report/repository/counsel-report.repository';
import { CounselReportEntity } from '../entity/counsel-report.entity';
import { CounselReportMapper } from '../mapper/counsel-report.mapper';

/**
 * CounselReport Repository 구현체 (Infrastructure Layer)
 *
 * @description
 * Domain Layer의 Repository 인터페이스를 TypeORM으로 구현
 */
@Injectable()
export class CounselReportRepositoryImpl implements CounselReportRepository {
  constructor(
    @InjectRepository(CounselReportEntity)
    private readonly repository: Repository<CounselReportEntity>,
  ) {}

  async save(counselReport: CounselReport): Promise<CounselReport> {
    const entity = CounselReportMapper.toEntity(counselReport);
    const savedEntity = await this.repository.save(entity);
    return CounselReportMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<CounselReport | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? CounselReportMapper.toDomain(entity) : null;
  }

  async findByCounselRequestIdAndSession(
    counselRequestId: string,
    sessionNumber: number,
  ): Promise<CounselReport | null> {
    const entity = await this.repository.findOne({
      where: {
        counselRequestId,
        sessionNumber,
      },
    });
    return entity ? CounselReportMapper.toDomain(entity) : null;
  }

  async findByCounselRequestId(counselRequestId: string): Promise<CounselReport[]> {
    const entities = await this.repository.find({
      where: { counselRequestId },
      order: { sessionNumber: 'ASC' },
    });
    return CounselReportMapper.toDomainList(entities);
  }

  async findByChildId(childId: string): Promise<CounselReport[]> {
    const entities = await this.repository.find({
      where: { childId },
      order: { reportDate: 'DESC' },
    });
    return CounselReportMapper.toDomainList(entities);
  }

  async findByCounselorId(
    counselorId: string,
    page: number,
    limit: number,
  ): Promise<{ reports: CounselReport[]; total: number }> {
    const [entities, total] = await this.repository.findAndCount({
      where: { counselorId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      reports: CounselReportMapper.toDomainList(entities),
      total,
    };
  }

  async findByInstitutionId(
    institutionId: string,
    page: number,
    limit: number,
  ): Promise<{ reports: CounselReport[]; total: number }> {
    const [entities, total] = await this.repository.findAndCount({
      where: { institutionId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      reports: CounselReportMapper.toDomainList(entities),
      total,
    };
  }

  async findByStatus(
    status: ReportStatus,
    page: number,
    limit: number,
  ): Promise<{ reports: CounselReport[]; total: number }> {
    const [entities, total] = await this.repository.findAndCount({
      where: { status },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      reports: CounselReportMapper.toDomainList(entities),
      total,
    };
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async getNextSessionNumber(counselRequestId: string): Promise<number> {
    const maxSession = await this.repository
      .createQueryBuilder('report')
      .select('MAX(report.sessionNumber)', 'maxSession')
      .where('report.counselRequestId = :counselRequestId', {
        counselRequestId,
      })
      .getRawOne();

    return (maxSession?.maxSession || 0) + 1;
  }

  async countByCounselRequestId(counselRequestId: string): Promise<number> {
    return await this.repository.count({
      where: { counselRequestId },
    });
  }
}
