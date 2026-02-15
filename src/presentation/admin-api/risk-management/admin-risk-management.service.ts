import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PsychologicalStatusLogEntity } from '@infrastructure/persistence/typeorm/entity/psychological-status-log.entity';
import { AdminRiskLogQueryDto } from './dto/admin-risk-log-query.dto';
import type {
  PaginatedRiskLogsDto,
  AdminRiskStatsDto,
  AdminRiskLogDetailDto,
} from './dto/admin-risk-log-response.dto';

@Injectable()
export class AdminRiskManagementService {
  private readonly logger = new Logger(AdminRiskManagementService.name);

  constructor(
    @InjectRepository(PsychologicalStatusLogEntity)
    private readonly riskLogRepository: Repository<PsychologicalStatusLogEntity>,
  ) {}

  /**
   * 위험 로그 목록을 페이지네이션하여 조회한다
   */
  async getRiskLogs(query: AdminRiskLogQueryDto): Promise<PaginatedRiskLogsDto> {
    const { childName, newStatus, source, dateFrom, dateTo, escalationOnly, page = 1, limit = 10 } = query;

    this.logger.log(`위험 로그 목록 조회 - filters: ${JSON.stringify(query)}`);

    const qb = this.riskLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.child', 'child')
      .orderBy('log.createdAt', 'DESC');

    if (childName) {
      qb.andWhere('child.name ILIKE :childName', { childName: `%${childName}%` });
    }

    if (newStatus) {
      qb.andWhere('log.newStatus = :newStatus', { newStatus });
    }

    if (source) {
      qb.andWhere('log.source = :source', { source });
    }

    if (dateFrom) {
      qb.andWhere('log.createdAt >= :dateFrom', { dateFrom: `${dateFrom}T00:00:00` });
    }

    if (dateTo) {
      qb.andWhere('log.createdAt <= :dateTo', { dateTo: `${dateTo}T23:59:59` });
    }

    if (escalationOnly) {
      qb.andWhere('log.isEscalation = :isEscalation', { isEscalation: true });
    }

    qb.skip((page - 1) * limit).take(limit);

    const [logs, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data: logs.map((log) => ({
        id: log.id,
        childId: log.childId,
        childName: log.child?.name ?? '알 수 없음',
        previousStatus: log.previousStatus,
        newStatus: log.newStatus,
        reason: log.reason,
        source: log.source,
        sessionId: log.sessionId,
        isEscalation: log.isEscalation,
        createdAt: log.createdAt,
      })),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * 위험 로그 통계를 조회한다
   */
  async getStats(): Promise<AdminRiskStatsDto> {
    this.logger.log('위험 로그 통계 조회');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalLogs, escalationCount, todayCount, statusCounts, sourceCounts] = await Promise.all([
      this.riskLogRepository.count(),
      this.riskLogRepository.count({ where: { isEscalation: true } }),
      this.riskLogRepository
        .createQueryBuilder('log')
        .where('log.createdAt >= :today', { today })
        .getCount(),
      this.riskLogRepository
        .createQueryBuilder('log')
        .select('log.newStatus', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('log.newStatus')
        .getRawMany<{ status: string; count: string }>(),
      this.riskLogRepository
        .createQueryBuilder('log')
        .select('log.source', 'source')
        .addSelect('COUNT(*)', 'count')
        .groupBy('log.source')
        .getRawMany<{ source: string; count: string }>(),
    ]);

    const byStatus = { NORMAL: 0, AT_RISK: 0, HIGH_RISK: 0 };
    for (const row of statusCounts) {
      if (row.status in byStatus) {
        byStatus[row.status as keyof typeof byStatus] = parseInt(row.count, 10);
      }
    }

    const bySource = { SOUL_E: 0, COUNSELOR: 0, SYSTEM: 0 };
    for (const row of sourceCounts) {
      if (row.source in bySource) {
        bySource[row.source as keyof typeof bySource] = parseInt(row.count, 10);
      }
    }

    return { totalLogs, escalationCount, todayCount, byStatus, bySource };
  }

  /**
   * 위험 로그 상세를 조회한다
   */
  async getRiskLogDetail(id: string): Promise<AdminRiskLogDetailDto> {
    this.logger.log(`위험 로그 상세 조회 - id: ${id}`);

    const log = await this.riskLogRepository.findOne({
      where: { id },
      relations: ['child'],
    });

    if (!log) {
      throw new NotFoundException(`위험 로그를 찾을 수 없습니다: ${id}`);
    }

    return {
      id: log.id,
      childId: log.childId,
      childName: log.child?.name ?? '알 수 없음',
      previousStatus: log.previousStatus,
      newStatus: log.newStatus,
      reason: log.reason,
      source: log.source,
      sessionId: log.sessionId,
      isEscalation: log.isEscalation,
      metadata: log.metadata,
      createdAt: log.createdAt,
    };
  }
}
