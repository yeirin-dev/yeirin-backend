import { Inject, Injectable } from '@nestjs/common';
import { AdminStatisticsRepository } from './admin-statistics.repository.interface';
import { TrendDataDto } from './dto/dashboard-overview.dto';
import { UserStatisticsDto, UsersByRoleDto } from './dto/user-statistics.dto';

/**
 * 사용자 통계 조회 Use Case
 */
@Injectable()
export class GetUserStatisticsUseCase {
  constructor(
    @Inject('AdminStatisticsRepository')
    private readonly statisticsRepository: AdminStatisticsRepository,
  ) {}

  async execute(query?: { startDate?: string; endDate?: string }): Promise<UserStatisticsDto> {
    // 날짜 범위 설정 (기본: 최근 30일)
    const endDate = query?.endDate ? new Date(query.endDate) : new Date();
    const startDate = query?.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 병렬 조회
    const [
      usersByRole,
      activeUsers,
      inactiveUsers,
      bannedUsers,
      emailVerifiedUsers,
      registrationTrend,
      loginActivityTrend,
    ] = await Promise.all([
      this.statisticsRepository.countUsersByRole(),
      this.statisticsRepository.countActiveUsers(30),
      this.statisticsRepository.countInactiveUsers(),
      this.statisticsRepository.countBannedUsers(),
      this.statisticsRepository.countEmailVerifiedUsers(),
      this.statisticsRepository.getRegistrationTrend(startDate, endDate, 'day'),
      this.statisticsRepository.getLoginActivityTrend(startDate, endDate, 'day'),
    ]);

    // 전체 사용자 수 계산
    const totalUsers = Object.values(usersByRole).reduce((sum, count) => sum + count, 0);

    // 역할별 분포 계산
    const usersByRoleDto: UsersByRoleDto[] = Object.entries(usersByRole).map(([role, count]) => ({
      role,
      count,
      percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 1000) / 10 : 0,
    }));

    // 트렌드 변환
    const registrationTrendDto: TrendDataDto[] = this.convertToTrendDto(registrationTrend);
    const loginActivityTrendDto: TrendDataDto[] = this.convertToTrendDto(loginActivityTrend);

    // 기간 내 신규 가입 수
    const newRegistrations = registrationTrend.reduce((sum, item) => sum + item.count, 0);

    // 기간 내 활성 사용자 수 (로그인 한 사용자)
    const periodActiveUsers = loginActivityTrend.reduce((sum, item) => sum + item.count, 0);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      bannedUsers,
      emailVerifiedUsers,
      usersByRole: usersByRoleDto,
      registrationTrend: registrationTrendDto,
      loginActivityTrend: loginActivityTrendDto,
      newRegistrations,
      periodActiveUsers,
    };
  }

  private convertToTrendDto(data: { period: string; count: number }[]): TrendDataDto[] {
    return data.map((item, index) => {
      const previous = index > 0 ? data[index - 1].count : item.count;
      const changeRate = previous > 0 ? ((item.count - previous) / previous) * 100 : 0;

      return {
        period: item.period,
        current: item.count,
        previous,
        changeRate: Math.round(changeRate * 10) / 10,
      };
    });
  }
}
