import { Inject, Injectable } from '@nestjs/common';
import { AdminStatisticsRepository } from './admin-statistics.repository.interface';
import {
  CounselRequestStatisticsDto,
  ConversionFunnelDto,
  PeriodStatisticsDto,
} from './dto/counsel-request-statistics.dto';
import { StatusCountDto } from './dto/dashboard-overview.dto';

/**
 * 상담의뢰 통계 조회 Use Case
 */
@Injectable()
export class GetCounselRequestStatisticsUseCase {
  constructor(
    @Inject('AdminStatisticsRepository')
    private readonly statisticsRepository: AdminStatisticsRepository,
  ) {}

  async execute(query?: {
    startDate?: string;
    endDate?: string;
  }): Promise<CounselRequestStatisticsDto> {
    // 날짜 범위 설정 (기본: 최근 30일)
    const endDate = query?.endDate ? new Date(query.endDate) : new Date();
    const startDate = query?.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 병렬 조회
    const [byStatus, conversionFunnel, dailyTrend, averageProcessingDays, averageMatchingHours] =
      await Promise.all([
        this.statisticsRepository.countCounselRequestsByStatus(),
        this.statisticsRepository.getConversionFunnelMetrics(startDate, endDate),
        this.statisticsRepository.getCounselRequestTrend(startDate, endDate, 'day'),
        this.statisticsRepository.getAverageProcessingDays(startDate, endDate),
        this.statisticsRepository.getAverageMatchingHours(startDate, endDate),
      ]);

    // 전체 상담의뢰 수
    const totalCounselRequests = Object.values(byStatus).reduce((sum, count) => sum + count, 0);

    // 상태별 분포 변환
    const byStatusDto: StatusCountDto[] = Object.entries(byStatus).map(([status, count]) => ({
      status,
      count,
    }));

    // 전환 퍼널 변환 (전환율 계산)
    const conversionFunnelDto: ConversionFunnelDto[] =
      this.calculateConversionFunnel(conversionFunnel);

    // 일별 추이 변환
    const dailyTrendDto: PeriodStatisticsDto[] = dailyTrend.map((item) => ({
      period: item.period,
      created: item.created,
      completed: item.completed,
      rejected: item.rejected,
    }));

    // 완료율, 거절율 계산
    const completed = byStatus['COMPLETED'] || 0;
    const rejected = byStatus['REJECTED'] || 0;
    const completionRate =
      totalCounselRequests > 0 ? Math.round((completed / totalCounselRequests) * 1000) / 10 : 0;
    const rejectionRate =
      totalCounselRequests > 0 ? Math.round((rejected / totalCounselRequests) * 1000) / 10 : 0;

    // 기간 내 통계
    const periodNewRequests = dailyTrend.reduce((sum, item) => sum + item.created, 0);
    const periodCompletedRequests = dailyTrend.reduce((sum, item) => sum + item.completed, 0);

    return {
      totalCounselRequests,
      byStatus: byStatusDto,
      conversionFunnel: conversionFunnelDto,
      dailyTrend: dailyTrendDto,
      averageProcessingDays: Math.round(averageProcessingDays * 10) / 10,
      averageMatchingHours: Math.round(averageMatchingHours * 10) / 10,
      completionRate,
      rejectionRate,
      periodNewRequests,
      periodCompletedRequests,
    };
  }

  private calculateConversionFunnel(
    funnel: { stage: string; count: number }[],
  ): ConversionFunnelDto[] {
    return funnel.map((item, index) => {
      const previousCount = index > 0 ? funnel[index - 1].count : item.count;
      const conversionRate =
        previousCount > 0 ? Math.round((item.count / previousCount) * 1000) / 10 : 100;

      return {
        stage: item.stage,
        count: item.count,
        conversionRate,
      };
    });
  }
}
