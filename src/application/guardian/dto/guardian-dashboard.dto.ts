import { ApiProperty } from '@nestjs/swagger';

/**
 * 최근 활동 아이템 DTO
 */
export class RecentActivityDto {
  @ApiProperty({ description: '상담의뢰지 ID' })
  counselRequestId: string;

  @ApiProperty({ description: '아동 이름' })
  childName: string;

  @ApiProperty({ description: '활동 유형', enum: ['CREATED', 'RECOMMENDED', 'MATCHED', 'IN_PROGRESS', 'COMPLETED'] })
  activityType: string;

  @ApiProperty({ description: '활동 설명' })
  description: string;

  @ApiProperty({ description: '활동 일시' })
  activityAt: Date;
}

/**
 * 보호자 대시보드 통계 응답 DTO
 */
export class GuardianDashboardDto {
  @ApiProperty({ description: '등록된 아동 수' })
  childrenCount: number;

  @ApiProperty({ description: '총 상담의뢰지 수' })
  totalCounselRequests: number;

  @ApiProperty({ description: '매칭 완료 수 (MATCHED)' })
  matchedCount: number;

  @ApiProperty({ description: '진행 중 수 (IN_PROGRESS)' })
  inProgressCount: number;

  @ApiProperty({ description: '대기 중 수 (PENDING + RECOMMENDED)' })
  pendingCount: number;

  @ApiProperty({ description: '완료 수 (COMPLETED)' })
  completedCount: number;

  @ApiProperty({ description: '최근 활동 목록', type: [RecentActivityDto] })
  recentActivities: RecentActivityDto[];
}
