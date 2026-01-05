import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { AdminStatisticsRepository } from '@application/admin-statistics/admin-statistics.repository.interface';
import { ChildProfileEntity } from '../entity/child-profile.entity';
import { CounselRequestEntity } from '../entity/counsel-request.entity';
import { ReviewEntity } from '../entity/review.entity';
import { UserEntity } from '../entity/user.entity';
import { VoucherInstitutionEntity } from '../entity/voucher-institution.entity';

/**
 * Admin Statistics Repository 구현체
 * 관리자 통계 조회를 위한 읽기 전용 Repository
 */
@Injectable()
export class AdminStatisticsRepositoryImpl implements AdminStatisticsRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
    @InjectRepository(ChildProfileEntity)
    private readonly childProfileRepository: Repository<ChildProfileEntity>,
    @InjectRepository(VoucherInstitutionEntity)
    private readonly institutionRepository: Repository<VoucherInstitutionEntity>,
  ) {}

  // ============ User Statistics ============

  async countUsersByRole(): Promise<Record<string, number>> {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    return result.reduce(
      (acc, item) => {
        acc[item.role] = parseInt(item.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  async countActiveUsers(days: number): Promise<number> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    return this.userRepository.count({
      where: {
        lastLoginAt: MoreThanOrEqual(dateThreshold),
        isActive: true,
        isBanned: false,
      },
    });
  }

  async countInactiveUsers(): Promise<number> {
    return this.userRepository.count({
      where: { isActive: false },
    });
  }

  async countBannedUsers(): Promise<number> {
    return this.userRepository.count({
      where: { isBanned: true },
    });
  }

  async countEmailVerifiedUsers(): Promise<number> {
    return this.userRepository.count({
      where: { isEmailVerified: true },
    });
  }

  async getRegistrationTrend(
    startDate: Date,
    endDate: Date,
    period: 'day' | 'week' | 'month',
  ): Promise<{ period: string; count: number }[]> {
    const format = this.getDateFormat(period);

    const result = await this.userRepository
      .createQueryBuilder('user')
      .select(`TO_CHAR(user.createdAt, '${format}')`, 'period')
      .addSelect('COUNT(*)', 'count')
      .where('user.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy(`TO_CHAR(user.createdAt, '${format}')`)
      .orderBy(`TO_CHAR(user.createdAt, '${format}')`, 'ASC')
      .getRawMany();

    return result.map((item) => ({
      period: item.period,
      count: parseInt(item.count, 10),
    }));
  }

  async getLoginActivityTrend(
    startDate: Date,
    endDate: Date,
    period: 'day' | 'week' | 'month',
  ): Promise<{ period: string; count: number }[]> {
    const format = this.getDateFormat(period);

    const result = await this.userRepository
      .createQueryBuilder('user')
      .select(`TO_CHAR(user.lastLoginAt, '${format}')`, 'period')
      .addSelect('COUNT(*)', 'count')
      .where('user.lastLoginAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy(`TO_CHAR(user.lastLoginAt, '${format}')`)
      .orderBy(`TO_CHAR(user.lastLoginAt, '${format}')`, 'ASC')
      .getRawMany();

    return result.map((item) => ({
      period: item.period,
      count: parseInt(item.count, 10),
    }));
  }

  // ============ Counsel Request Statistics ============

  async countCounselRequestsByStatus(): Promise<Record<string, number>> {
    const result = await this.counselRequestRepository
      .createQueryBuilder('cr')
      .select('cr.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('cr.status')
      .getRawMany();

    return result.reduce(
      (acc, item) => {
        acc[item.status] = parseInt(item.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  async getCounselRequestTrend(
    startDate: Date,
    endDate: Date,
    period: 'day' | 'week' | 'month',
  ): Promise<{ period: string; created: number; completed: number; rejected: number }[]> {
    const format = this.getDateFormat(period);

    const result = await this.counselRequestRepository
      .createQueryBuilder('cr')
      .select(`TO_CHAR(cr.createdAt, '${format}')`, 'period')
      .addSelect('COUNT(*)', 'created')
      .addSelect("COUNT(CASE WHEN cr.status = 'COMPLETED' THEN 1 END)", 'completed')
      .addSelect("COUNT(CASE WHEN cr.status = 'REJECTED' THEN 1 END)", 'rejected')
      .where('cr.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy(`TO_CHAR(cr.createdAt, '${format}')`)
      .orderBy(`TO_CHAR(cr.createdAt, '${format}')`, 'ASC')
      .getRawMany();

    return result.map((item) => ({
      period: item.period,
      created: parseInt(item.created, 10),
      completed: parseInt(item.completed, 10),
      rejected: parseInt(item.rejected, 10),
    }));
  }

  async getConversionFunnelMetrics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ stage: string; count: number }[]> {
    const queryBuilder = this.counselRequestRepository.createQueryBuilder('cr');

    if (startDate && endDate) {
      queryBuilder.where('cr.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const statusOrder = ['PENDING', 'RECOMMENDED', 'MATCHED', 'IN_PROGRESS', 'COMPLETED'];

    const result = await queryBuilder
      .select('cr.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('cr.status')
      .getRawMany();

    const statusMap = result.reduce(
      (acc, item) => {
        acc[item.status] = parseInt(item.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );

    return statusOrder.map((status) => ({
      stage: status,
      count: statusMap[status] || 0,
    }));
  }

  async getAverageProcessingDays(startDate?: Date, endDate?: Date): Promise<number> {
    const queryBuilder = this.counselRequestRepository
      .createQueryBuilder('cr')
      .select('AVG(EXTRACT(EPOCH FROM (cr.updatedAt - cr.createdAt)) / 86400)', 'avgDays')
      .where("cr.status = 'COMPLETED'");

    if (startDate && endDate) {
      queryBuilder.andWhere('cr.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const result = await queryBuilder.getRawOne();
    return result?.avgDays ? parseFloat(result.avgDays) : 0;
  }

  async getAverageMatchingHours(startDate?: Date, endDate?: Date): Promise<number> {
    // 매칭 시간: PENDING → MATCHED로 전환된 시간 (정확한 계산을 위해서는 상태 변경 로그가 필요)
    // 간단히 MATCHED 상태의 평균 처리 시간으로 대체
    const queryBuilder = this.counselRequestRepository
      .createQueryBuilder('cr')
      .select('AVG(EXTRACT(EPOCH FROM (cr.updatedAt - cr.createdAt)) / 3600)', 'avgHours')
      .where("cr.status IN ('MATCHED', 'IN_PROGRESS', 'COMPLETED')");

    if (startDate && endDate) {
      queryBuilder.andWhere('cr.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const result = await queryBuilder.getRawOne();
    return result?.avgHours ? parseFloat(result.avgHours) : 0;
  }

  // ============ Institution Statistics ============

  async countInstitutions(): Promise<number> {
    return this.institutionRepository.count();
  }

  async countActiveInstitutions(): Promise<number> {
    // VoucherInstitutionEntity에 isActive 필드가 없으므로
    // 연결된 User의 isActive를 통해 확인
    return this.institutionRepository
      .createQueryBuilder('inst')
      .innerJoin('inst.user', 'user')
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere('user.isBanned = :isBanned', { isBanned: false })
      .getCount();
  }

  async getInstitutionPerformanceMetrics(
    startDate?: Date,
    endDate?: Date,
    sortBy?: 'totalCounsel' | 'completionRate' | 'rating',
    limit?: number,
  ): Promise<
    {
      institutionId: string;
      institutionName: string;
      totalCounselCount: number;
      completedCounselCount: number;
      inProgressCounselCount: number;
      averageRating: number;
      reviewCount: number;
    }[]
  > {
    const queryBuilder = this.institutionRepository
      .createQueryBuilder('inst')
      .leftJoin('counsel_requests', 'cr', 'cr.matchedInstitutionId = inst.id')
      .leftJoin('reviews', 'review', 'review.institutionId = inst.id')
      .select('inst.id', 'institutionId')
      .addSelect('inst.name', 'institutionName')
      .addSelect('COUNT(DISTINCT cr.id)', 'totalCounselCount')
      .addSelect(
        "COUNT(DISTINCT CASE WHEN cr.status = 'COMPLETED' THEN cr.id END)",
        'completedCounselCount',
      )
      .addSelect(
        "COUNT(DISTINCT CASE WHEN cr.status = 'IN_PROGRESS' THEN cr.id END)",
        'inProgressCounselCount',
      )
      .addSelect('COALESCE(AVG(review.rating), 0)', 'averageRating')
      .addSelect('COUNT(DISTINCT review.id)', 'reviewCount')
      .groupBy('inst.id')
      .addGroupBy('inst.name');

    if (startDate && endDate) {
      queryBuilder.andWhere(
        '(cr.createdAt IS NULL OR cr.createdAt BETWEEN :startDate AND :endDate)',
        {
          startDate,
          endDate,
        },
      );
    }

    // 정렬
    switch (sortBy) {
      case 'completionRate':
        queryBuilder.orderBy(
          "COUNT(DISTINCT CASE WHEN cr.status = 'COMPLETED' THEN cr.id END)",
          'DESC',
        );
        break;
      case 'rating':
        queryBuilder.orderBy('COALESCE(AVG(review.rating), 0)', 'DESC');
        break;
      default:
        queryBuilder.orderBy('COUNT(DISTINCT cr.id)', 'DESC');
    }

    if (limit) {
      queryBuilder.limit(limit);
    }

    const result = await queryBuilder.getRawMany();

    return result.map((item) => ({
      institutionId: item.institutionId,
      institutionName: item.institutionName,
      totalCounselCount: parseInt(item.totalCounselCount, 10),
      completedCounselCount: parseInt(item.completedCounselCount, 10),
      inProgressCounselCount: parseInt(item.inProgressCounselCount, 10),
      averageRating: parseFloat(item.averageRating) || 0,
      reviewCount: parseInt(item.reviewCount, 10),
    }));
  }

  // ============ Child Statistics ============

  async countChildren(): Promise<number> {
    return this.childProfileRepository.count();
  }

  async countChildrenByType(): Promise<Record<string, number>> {
    const result = await this.childProfileRepository
      .createQueryBuilder('child')
      .select('child.childType', 'childType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('child.childType')
      .getRawMany();

    return result.reduce(
      (acc, item) => {
        acc[item.childType || 'UNKNOWN'] = parseInt(item.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  async countChildrenByPsychologicalStatus(): Promise<Record<string, number>> {
    const result = await this.childProfileRepository
      .createQueryBuilder('child')
      .select('child.psychologicalStatus', 'psychologicalStatus')
      .addSelect('COUNT(*)', 'count')
      .groupBy('child.psychologicalStatus')
      .getRawMany();

    return result.reduce(
      (acc, item) => {
        acc[item.psychologicalStatus || 'UNKNOWN'] = parseInt(item.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  async countChildrenByAgeGroup(): Promise<Record<string, number>> {
    // 연령대별 분류: 0-6, 7-12, 13-18
    const result = await this.childProfileRepository
      .createQueryBuilder('child')
      .select(
        `
        CASE
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, child.birthDate)) <= 6 THEN '0-6세'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, child.birthDate)) <= 12 THEN '7-12세'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, child.birthDate)) <= 18 THEN '13-18세'
          ELSE '19세 이상'
        END
      `,
        'ageGroup',
      )
      .addSelect('COUNT(*)', 'count')
      .where('child.birthDate IS NOT NULL')
      .groupBy(
        `
        CASE
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, child.birthDate)) <= 6 THEN '0-6세'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, child.birthDate)) <= 12 THEN '7-12세'
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, child.birthDate)) <= 18 THEN '13-18세'
          ELSE '19세 이상'
        END
      `,
      )
      .getRawMany();

    return result.reduce(
      (acc, item) => {
        acc[item.ageGroup] = parseInt(item.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  async countChildrenByGender(): Promise<Record<string, number>> {
    const result = await this.childProfileRepository
      .createQueryBuilder('child')
      .select('child.gender', 'gender')
      .addSelect('COUNT(*)', 'count')
      .groupBy('child.gender')
      .getRawMany();

    return result.reduce(
      (acc, item) => {
        acc[item.gender || 'UNKNOWN'] = parseInt(item.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  async countChildrenWithCounselHistory(): Promise<number> {
    const result = await this.childProfileRepository
      .createQueryBuilder('child')
      .innerJoin('counsel_requests', 'cr', 'cr.childId = child.id')
      .select('COUNT(DISTINCT child.id)', 'count')
      .getRawOne();

    return parseInt(result?.count || '0', 10);
  }

  async countChildrenInActiveCounseling(): Promise<number> {
    const result = await this.childProfileRepository
      .createQueryBuilder('child')
      .innerJoin('counsel_requests', 'cr', 'cr.childId = child.id')
      .where("cr.status IN ('MATCHED', 'IN_PROGRESS')")
      .select('COUNT(DISTINCT child.id)', 'count')
      .getRawOne();

    return parseInt(result?.count || '0', 10);
  }

  // ============ Helper Methods ============

  private getDateFormat(period: 'day' | 'week' | 'month'): string {
    switch (period) {
      case 'day':
        return 'YYYY-MM-DD';
      case 'week':
        return 'IYYY-IW';
      case 'month':
        return 'YYYY-MM';
    }
  }
}
