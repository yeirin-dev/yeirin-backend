import { Inject, Injectable } from '@nestjs/common';
import { AdminStatisticsRepository } from './admin-statistics.repository.interface';
import {
  InstitutionPerformanceDto,
  InstitutionPerformanceItemDto,
} from './dto/institution-performance.dto';

/**
 * 기관 성과 통계 조회 Use Case
 * NOTE: VoucherInstitution → CareFacility/CommunityChildCenter 전환
 */
@Injectable()
export class GetInstitutionPerformanceUseCase {
  constructor(
    @Inject('AdminStatisticsRepository')
    private readonly statisticsRepository: AdminStatisticsRepository,
  ) {}

  async execute(query?: {
    startDate?: string;
    endDate?: string;
    sortBy?: 'totalCounsel' | 'completionRate' | 'rating';
    limit?: number;
  }): Promise<InstitutionPerformanceDto> {
    // 날짜 범위 설정 (기본: 전체 기간)
    const endDate = query?.endDate ? new Date(query.endDate) : undefined;
    const startDate = query?.startDate ? new Date(query.startDate) : undefined;

    // 병렬 조회
    const [totalInstitutions, activeInstitutions, childMetrics] = await Promise.all([
      this.statisticsRepository.countInstitutions(),
      this.statisticsRepository.countActiveInstitutions(),
      this.statisticsRepository.getInstitutionChildMetrics(startDate, endDate, query?.limit || 20),
    ]);

    // 기관별 현황 변환
    const institutions: InstitutionPerformanceItemDto[] = childMetrics.map((item) => {
      const counselRequestRate =
        item.totalChildCount > 0
          ? Math.round((item.counselRequestCount / item.totalChildCount) * 1000) / 10
          : 0;

      return {
        institutionId: item.institutionId,
        institutionName: item.institutionName,
        institutionType: item.institutionType,
        totalChildCount: item.totalChildCount,
        counselRequestCount: item.counselRequestCount,
        counselRequestRate,
      };
    });

    // 총 아동 수, 총 상담의뢰 수 계산
    const totalChildren = institutions.reduce((sum, item) => sum + item.totalChildCount, 0);
    const totalCounselRequests = institutions.reduce(
      (sum, item) => sum + item.counselRequestCount,
      0,
    );

    return {
      totalInstitutions,
      activeInstitutions,
      totalChildren,
      totalCounselRequests,
      institutions,
    };
  }
}
