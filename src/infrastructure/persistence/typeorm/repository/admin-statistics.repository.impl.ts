import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminStatisticsRepository } from '@application/admin-statistics/admin-statistics.repository.interface';
import { CareFacilityEntity } from '../entity/care-facility.entity';
import { ChildProfileEntity } from '../entity/child-profile.entity';
import { CommunityChildCenterEntity } from '../entity/community-child-center.entity';
import { CounselRequestEntity } from '../entity/counsel-request.entity';
import { EducationWelfareSchoolEntity } from '../entity/education-welfare-school.entity';

/**
 * Admin Statistics Repository 구현체
 * 관리자 통계 조회를 위한 읽기 전용 Repository
 *
 * NOTE: 기관 기반 인증으로 전환됨. User 통계 기능 제거됨.
 */
@Injectable()
export class AdminStatisticsRepositoryImpl implements AdminStatisticsRepository {
  constructor(
    @InjectRepository(CounselRequestEntity)
    private readonly counselRequestRepository: Repository<CounselRequestEntity>,
    @InjectRepository(ChildProfileEntity)
    private readonly childProfileRepository: Repository<ChildProfileEntity>,
    @InjectRepository(CareFacilityEntity)
    private readonly careFacilityRepository: Repository<CareFacilityEntity>,
    @InjectRepository(CommunityChildCenterEntity)
    private readonly communityChildCenterRepository: Repository<CommunityChildCenterEntity>,
    @InjectRepository(EducationWelfareSchoolEntity)
    private readonly educationWelfareSchoolRepository: Repository<EducationWelfareSchoolEntity>,
  ) {}

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

  // ============ Institution Statistics (CareFacility + CommunityChildCenter + EducationWelfareSchool) ============

  async countInstitutions(): Promise<number> {
    const [careFacilityCount, communityChildCenterCount, educationWelfareSchoolCount] =
      await Promise.all([
        this.careFacilityRepository.count(),
        this.communityChildCenterRepository.count(),
        this.educationWelfareSchoolRepository.count(),
      ]);
    return careFacilityCount + communityChildCenterCount + educationWelfareSchoolCount;
  }

  async countActiveInstitutions(): Promise<number> {
    const [careFacilityCount, communityChildCenterCount, educationWelfareSchoolCount] =
      await Promise.all([
        this.careFacilityRepository.count({ where: { isActive: true } }),
        this.communityChildCenterRepository.count({ where: { isActive: true } }),
        this.educationWelfareSchoolRepository.count({ where: { isActive: true } }),
      ]);
    return careFacilityCount + communityChildCenterCount + educationWelfareSchoolCount;
  }

  async getInstitutionChildMetrics(
    startDate?: Date,
    endDate?: Date,
    limit?: number,
  ): Promise<
    {
      institutionId: string;
      institutionName: string;
      institutionType: 'CARE_FACILITY' | 'COMMUNITY_CENTER' | 'EDUCATION_WELFARE_SCHOOL';
      totalChildCount: number;
      counselRequestCount: number;
    }[]
  > {
    // CareFacility 통계
    const careFacilityQuery = this.careFacilityRepository
      .createQueryBuilder('cf')
      .leftJoin('child_profiles', 'child', 'child.careFacilityId = cf.id')
      .leftJoin('counsel_requests', 'cr', 'cr.childId = child.id')
      .select('cf.id', 'institutionId')
      .addSelect('cf.name', 'institutionName')
      .addSelect("'CARE_FACILITY'", 'institutionType')
      .addSelect('COUNT(DISTINCT child.id)', 'totalChildCount')
      .addSelect('COUNT(DISTINCT cr.id)', 'counselRequestCount')
      .groupBy('cf.id')
      .addGroupBy('cf.name');

    if (startDate && endDate) {
      careFacilityQuery.andWhere(
        '(cr.createdAt IS NULL OR cr.createdAt BETWEEN :startDate AND :endDate)',
        { startDate, endDate },
      );
    }

    // CommunityChildCenter 통계
    const communityChildCenterQuery = this.communityChildCenterRepository
      .createQueryBuilder('ccc')
      .leftJoin('child_profiles', 'child', 'child.communityChildCenterId = ccc.id')
      .leftJoin('counsel_requests', 'cr', 'cr.childId = child.id')
      .select('ccc.id', 'institutionId')
      .addSelect('ccc.name', 'institutionName')
      .addSelect("'COMMUNITY_CENTER'", 'institutionType')
      .addSelect('COUNT(DISTINCT child.id)', 'totalChildCount')
      .addSelect('COUNT(DISTINCT cr.id)', 'counselRequestCount')
      .groupBy('ccc.id')
      .addGroupBy('ccc.name');

    if (startDate && endDate) {
      communityChildCenterQuery.andWhere(
        '(cr.createdAt IS NULL OR cr.createdAt BETWEEN :startDate AND :endDate)',
        { startDate, endDate },
      );
    }

    // EducationWelfareSchool 통계
    const educationWelfareSchoolQuery = this.educationWelfareSchoolRepository
      .createQueryBuilder('ews')
      .leftJoin('child_profiles', 'child', 'child.educationWelfareSchoolId = ews.id')
      .leftJoin('counsel_requests', 'cr', 'cr.childId = child.id')
      .select('ews.id', 'institutionId')
      .addSelect('ews.name', 'institutionName')
      .addSelect("'EDUCATION_WELFARE_SCHOOL'", 'institutionType')
      .addSelect('COUNT(DISTINCT child.id)', 'totalChildCount')
      .addSelect('COUNT(DISTINCT cr.id)', 'counselRequestCount')
      .groupBy('ews.id')
      .addGroupBy('ews.name');

    if (startDate && endDate) {
      educationWelfareSchoolQuery.andWhere(
        '(cr.createdAt IS NULL OR cr.createdAt BETWEEN :startDate AND :endDate)',
        { startDate, endDate },
      );
    }

    const [careFacilityResults, communityChildCenterResults, educationWelfareSchoolResults] =
      await Promise.all([
        careFacilityQuery.getRawMany(),
        communityChildCenterQuery.getRawMany(),
        educationWelfareSchoolQuery.getRawMany(),
      ]);

    const combined = [
      ...careFacilityResults,
      ...communityChildCenterResults,
      ...educationWelfareSchoolResults,
    ]
      .map((item) => ({
        institutionId: item.institutionId,
        institutionName: item.institutionName,
        institutionType: item.institutionType as
          | 'CARE_FACILITY'
          | 'COMMUNITY_CENTER'
          | 'EDUCATION_WELFARE_SCHOOL',
        totalChildCount: parseInt(item.totalChildCount, 10),
        counselRequestCount: parseInt(item.counselRequestCount, 10),
      }))
      .sort((a, b) => b.totalChildCount - a.totalChildCount);

    return limit ? combined.slice(0, limit) : combined;
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
