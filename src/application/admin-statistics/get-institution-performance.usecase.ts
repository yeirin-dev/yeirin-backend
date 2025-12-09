import { Inject, Injectable } from '@nestjs/common';
import { AdminStatisticsRepository } from './admin-statistics.repository.interface';
import {
  InstitutionPerformanceDto,
  InstitutionPerformanceItemDto,
} from './dto/institution-performance.dto';

/**
 * 기관 성과 통계 조회 Use Case
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
    const [totalInstitutions, activeInstitutions, performanceMetrics] = await Promise.all([
      this.statisticsRepository.countInstitutions(),
      this.statisticsRepository.countActiveInstitutions(),
      this.statisticsRepository.getInstitutionPerformanceMetrics(
        startDate,
        endDate,
        query?.sortBy || 'totalCounsel',
        query?.limit || 20,
      ),
    ]);

    // 기관별 성과 변환
    const institutions: InstitutionPerformanceItemDto[] = performanceMetrics.map((item) => {
      const completionRate =
        item.totalCounselCount > 0
          ? Math.round((item.completedCounselCount / item.totalCounselCount) * 1000) / 10
          : 0;

      return {
        institutionId: item.institutionId,
        institutionName: item.institutionName,
        totalCounselCount: item.totalCounselCount,
        completedCounselCount: item.completedCounselCount,
        inProgressCounselCount: item.inProgressCounselCount,
        averageRating: Math.round(item.averageRating * 10) / 10,
        reviewCount: item.reviewCount,
        completionRate,
        averageProcessingDays: 0, // 추후 계산 로직 추가 필요
      };
    });

    // 평균 완료율 계산
    const averageCompletionRate =
      institutions.length > 0
        ? Math.round(
            (institutions.reduce((sum, item) => sum + item.completionRate, 0) /
              institutions.length) *
              10,
          ) / 10
        : 0;

    // 평균 평점 계산
    const institutionsWithRating = institutions.filter((item) => item.averageRating > 0);
    const averageRating =
      institutionsWithRating.length > 0
        ? Math.round(
            (institutionsWithRating.reduce((sum, item) => sum + item.averageRating, 0) /
              institutionsWithRating.length) *
              10,
          ) / 10
        : 0;

    return {
      totalInstitutions,
      activeInstitutions,
      averageCompletionRate,
      averageRating,
      institutions,
    };
  }
}
