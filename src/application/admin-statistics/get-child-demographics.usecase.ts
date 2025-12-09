import { Inject, Injectable } from '@nestjs/common';
import { AdminStatisticsRepository } from './admin-statistics.repository.interface';
import {
  ChildDemographicsDto,
  CategoryDistributionDto,
  AgeGroupDistributionDto,
} from './dto/child-demographics.dto';

/**
 * 아동 인구통계 조회 Use Case
 */
@Injectable()
export class GetChildDemographicsUseCase {
  constructor(
    @Inject('AdminStatisticsRepository')
    private readonly statisticsRepository: AdminStatisticsRepository,
  ) {}

  async execute(): Promise<ChildDemographicsDto> {
    // 병렬 조회
    const [
      totalChildren,
      byChildType,
      byPsychologicalStatus,
      byAgeGroup,
      byGender,
      childrenWithCounselHistory,
      childrenInActiveCounseling,
    ] = await Promise.all([
      this.statisticsRepository.countChildren(),
      this.statisticsRepository.countChildrenByType(),
      this.statisticsRepository.countChildrenByPsychologicalStatus(),
      this.statisticsRepository.countChildrenByAgeGroup(),
      this.statisticsRepository.countChildrenByGender(),
      this.statisticsRepository.countChildrenWithCounselHistory(),
      this.statisticsRepository.countChildrenInActiveCounseling(),
    ]);

    // 분포 변환
    const byChildTypeDto = this.convertToDistribution(byChildType, totalChildren);
    const byPsychologicalStatusDto = this.convertToDistribution(
      byPsychologicalStatus,
      totalChildren,
    );
    const byAgeGroupDto = this.convertToAgeGroupDistribution(byAgeGroup, totalChildren);
    const byGenderDto = this.convertToDistribution(byGender, totalChildren);

    return {
      totalChildren,
      byChildType: byChildTypeDto,
      byPsychologicalStatus: byPsychologicalStatusDto,
      byAgeGroup: byAgeGroupDto,
      byGender: byGenderDto,
      childrenWithCounselHistory,
      childrenInActiveCounseling,
    };
  }

  private convertToDistribution(
    data: Record<string, number>,
    total: number,
  ): CategoryDistributionDto[] {
    return Object.entries(data).map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }));
  }

  private convertToAgeGroupDistribution(
    data: Record<string, number>,
    total: number,
  ): AgeGroupDistributionDto[] {
    return Object.entries(data).map(([ageGroup, count]) => ({
      ageGroup,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }));
  }
}
