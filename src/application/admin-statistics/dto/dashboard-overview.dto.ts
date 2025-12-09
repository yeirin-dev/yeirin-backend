import { ApiProperty } from '@nestjs/swagger';

/**
 * 트렌드 데이터
 */
export class TrendDataDto {
  @ApiProperty({ description: '기간' })
  period: string;

  @ApiProperty({ description: '현재 값' })
  current: number;

  @ApiProperty({ description: '이전 값' })
  previous: number;

  @ApiProperty({ description: '변화율 (%)' })
  changeRate: number;
}

/**
 * 상태별 카운트
 */
export class StatusCountDto {
  @ApiProperty({ description: '상태명' })
  status: string;

  @ApiProperty({ description: '개수' })
  count: number;
}

/**
 * 알림 항목
 */
export class AlertItemDto {
  @ApiProperty({ description: '알림 유형', enum: ['WARNING', 'INFO', 'CRITICAL'] })
  type: 'WARNING' | 'INFO' | 'CRITICAL';

  @ApiProperty({ description: '알림 메시지' })
  message: string;

  @ApiProperty({ description: '관련 엔티티 타입', nullable: true })
  entityType?: string;

  @ApiProperty({ description: '관련 엔티티 수', nullable: true })
  count?: number;
}

/**
 * 대시보드 개요 응답 DTO
 */
export class DashboardOverviewDto {
  @ApiProperty({ description: '전체 사용자 수' })
  totalUsers: number;

  @ApiProperty({ description: '활성 사용자 수 (최근 30일)' })
  activeUsers: number;

  @ApiProperty({ description: '전체 상담의뢰 수' })
  totalCounselRequests: number;

  @ApiProperty({ description: '대기 중인 상담의뢰 수' })
  pendingCounselRequests: number;

  @ApiProperty({ description: '진행 중인 상담의뢰 수' })
  inProgressCounselRequests: number;

  @ApiProperty({ description: '완료된 상담의뢰 수' })
  completedCounselRequests: number;

  @ApiProperty({ description: '전체 기관 수' })
  totalInstitutions: number;

  @ApiProperty({ description: '활성 기관 수' })
  activeInstitutions: number;

  @ApiProperty({ description: '전체 아동 수' })
  totalChildren: number;

  @ApiProperty({ description: '사용자 등록 트렌드', type: TrendDataDto })
  userRegistrationTrend: TrendDataDto;

  @ApiProperty({ description: '상담의뢰 트렌드', type: TrendDataDto })
  counselRequestTrend: TrendDataDto;

  @ApiProperty({ description: '상담의뢰 상태별 분포', type: [StatusCountDto] })
  counselRequestsByStatus: StatusCountDto[];

  @ApiProperty({ description: '시스템 알림', type: [AlertItemDto] })
  alerts: AlertItemDto[];
}
