import { ApiProperty } from '@nestjs/swagger';
import { CounselRequestStatus } from '@domain/counsel-request/model/value-objects/counsel-request-enums';

/**
 * 최근 활동 DTO
 */
export class RecentActivityDto {
  @ApiProperty({
    description: '상담의뢰 ID',
    example: '93dfda2d-6cd3-4e86-8259-ee1c098234f7',
  })
  counselRequestId: string;

  @ApiProperty({
    description: '아동명',
    example: '김철수',
  })
  childName: string;

  @ApiProperty({
    description: '활동 유형 (상담의뢰 상태)',
    enum: CounselRequestStatus,
    example: CounselRequestStatus.PENDING,
  })
  activityType: CounselRequestStatus;

  @ApiProperty({
    description: '활동 설명',
    example: '상담의뢰지가 생성되었습니다',
  })
  description: string;

  @ApiProperty({
    description: '활동 일시',
    example: '2024-01-15T10:30:00.000Z',
  })
  activityAt: string;
}

/**
 * 시설 대시보드 응답 DTO
 */
export class InstitutionDashboardResponseDto {
  @ApiProperty({
    description: '소속 아동 수',
    example: 15,
  })
  childrenCount: number;

  @ApiProperty({
    description: '총 상담의뢰 수',
    example: 42,
  })
  totalCounselRequests: number;

  @ApiProperty({
    description: '매칭 완료 수',
    example: 10,
  })
  matchedCount: number;

  @ApiProperty({
    description: '상담 진행중 수',
    example: 5,
  })
  inProgressCount: number;

  @ApiProperty({
    description: '대기중 수',
    example: 12,
  })
  pendingCount: number;

  @ApiProperty({
    description: '상담 완료 수',
    example: 15,
  })
  completedCount: number;

  @ApiProperty({
    description: '최근 활동 목록',
    type: [RecentActivityDto],
  })
  recentActivities: RecentActivityDto[];
}
