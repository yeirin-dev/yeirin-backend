import { Inject, Injectable } from '@nestjs/common';
import { AdminStatisticsRepository } from './admin-statistics.repository.interface';
import {
  DashboardOverviewDto,
  TrendDataDto,
  StatusCountDto,
  AlertItemDto,
} from './dto/dashboard-overview.dto';

/**
 * 대시보드 개요 조회 Use Case
 * NOTE: User 통계 기능 제거됨. 기관 기반 인증으로 전환.
 */
@Injectable()
export class GetDashboardOverviewUseCase {
  constructor(
    @Inject('AdminStatisticsRepository')
    private readonly statisticsRepository: AdminStatisticsRepository,
  ) {}

  async execute(query?: { startDate?: string; endDate?: string }): Promise<DashboardOverviewDto> {
    // 날짜 범위 설정 (기본: 최근 30일)
    const endDate = query?.endDate ? new Date(query.endDate) : new Date();
    const startDate = query?.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 이전 기간 (비교용)
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = new Date(startDate.getTime());

    // 병렬 조회
    const [
      counselRequestsByStatus,
      totalInstitutions,
      activeInstitutions,
      totalChildren,
      currentCounselRequests,
      previousCounselRequests,
    ] = await Promise.all([
      this.statisticsRepository.countCounselRequestsByStatus(),
      this.statisticsRepository.countInstitutions(),
      this.statisticsRepository.countActiveInstitutions(),
      this.statisticsRepository.countChildren(),
      this.statisticsRepository.getCounselRequestTrend(startDate, endDate, 'day'),
      this.statisticsRepository.getCounselRequestTrend(previousStartDate, previousEndDate, 'day'),
    ]);

    // 상담의뢰 상태별 수 계산
    const pendingCounselRequests = counselRequestsByStatus['PENDING'] || 0;
    const inProgressCounselRequests = counselRequestsByStatus['IN_PROGRESS'] || 0;
    const completedCounselRequests = counselRequestsByStatus['COMPLETED'] || 0;
    const totalCounselRequests = Object.values(counselRequestsByStatus).reduce(
      (sum: number, count: number) => sum + count,
      0,
    );

    // 트렌드 계산
    const counselRequestTrend = this.calculateCounselRequestTrend(
      currentCounselRequests,
      previousCounselRequests,
    );

    // 상태별 분포
    const counselRequestsByStatusDto: StatusCountDto[] = Object.entries(
      counselRequestsByStatus,
    ).map(([status, count]) => ({
      status,
      count,
    }));

    // 알림 생성
    const alerts = this.generateAlerts({
      pendingCounselRequests,
      totalInstitutions,
      activeInstitutions,
    });

    return {
      totalCounselRequests,
      pendingCounselRequests,
      inProgressCounselRequests,
      completedCounselRequests,
      totalInstitutions,
      activeInstitutions,
      totalChildren,
      counselRequestTrend,
      counselRequestsByStatus: counselRequestsByStatusDto,
      alerts,
    };
  }

  private calculateCounselRequestTrend(
    current: { period: string; created: number; completed: number; rejected: number }[],
    previous: { period: string; created: number; completed: number; rejected: number }[],
  ): TrendDataDto {
    const currentTotal = current.reduce((sum, item) => sum + item.created, 0);
    const previousTotal = previous.reduce((sum, item) => sum + item.created, 0);
    const changeRate =
      previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

    return {
      period: '상담의뢰',
      current: currentTotal,
      previous: previousTotal,
      changeRate: Math.round(changeRate * 10) / 10,
    };
  }

  private generateAlerts(data: {
    pendingCounselRequests: number;
    totalInstitutions: number;
    activeInstitutions: number;
  }): AlertItemDto[] {
    const alerts: AlertItemDto[] = [];

    // 대기 중인 상담의뢰가 많은 경우
    if (data.pendingCounselRequests > 10) {
      alerts.push({
        type: 'WARNING',
        message: `대기 중인 상담의뢰가 ${data.pendingCounselRequests}건 있습니다.`,
        entityType: 'CounselRequest',
        count: data.pendingCounselRequests,
      });
    }

    // 비활성 기관 비율이 높은 경우
    const inactiveInstitutions = data.totalInstitutions - data.activeInstitutions;
    if (data.totalInstitutions > 0 && inactiveInstitutions / data.totalInstitutions > 0.3) {
      alerts.push({
        type: 'INFO',
        message: `비활성 상태의 기관이 ${inactiveInstitutions}개 있습니다.`,
        entityType: 'Institution',
        count: inactiveInstitutions,
      });
    }

    return alerts;
  }
}
