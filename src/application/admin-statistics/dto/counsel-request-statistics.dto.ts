import { ApiProperty } from '@nestjs/swagger';
import { TrendDataDto, StatusCountDto } from './dashboard-overview.dto';

/**
 * 전환 퍼널 데이터
 */
export class ConversionFunnelDto {
  @ApiProperty({ description: '단계명' })
  stage: string;

  @ApiProperty({ description: '해당 단계 수' })
  count: number;

  @ApiProperty({ description: '이전 단계 대비 전환율 (%)' })
  conversionRate: number;
}

/**
 * 기간별 통계
 */
export class PeriodStatisticsDto {
  @ApiProperty({ description: '기간' })
  period: string;

  @ApiProperty({ description: '생성 수' })
  created: number;

  @ApiProperty({ description: '완료 수' })
  completed: number;

  @ApiProperty({ description: '거절 수' })
  rejected: number;
}

/**
 * 상담의뢰 통계 응답 DTO
 */
export class CounselRequestStatisticsDto {
  @ApiProperty({ description: '전체 상담의뢰 수' })
  totalCounselRequests: number;

  @ApiProperty({ description: '상태별 분포', type: [StatusCountDto] })
  byStatus: StatusCountDto[];

  @ApiProperty({ description: '전환 퍼널', type: [ConversionFunnelDto] })
  conversionFunnel: ConversionFunnelDto[];

  @ApiProperty({ description: '일별 추이', type: [PeriodStatisticsDto] })
  dailyTrend: PeriodStatisticsDto[];

  @ApiProperty({ description: '평균 처리 시간 (일)' })
  averageProcessingDays: number;

  @ApiProperty({ description: '평균 매칭 시간 (시간)' })
  averageMatchingHours: number;

  @ApiProperty({ description: '완료율 (%)' })
  completionRate: number;

  @ApiProperty({ description: '거절율 (%)' })
  rejectionRate: number;

  @ApiProperty({ description: '기간 내 신규 생성 수' })
  periodNewRequests: number;

  @ApiProperty({ description: '기간 내 완료 수' })
  periodCompletedRequests: number;
}
