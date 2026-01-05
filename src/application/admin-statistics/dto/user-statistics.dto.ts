import { ApiProperty } from '@nestjs/swagger';
import { TrendDataDto } from './dashboard-overview.dto';

/**
 * 역할별 사용자 수
 */
export class UsersByRoleDto {
  @ApiProperty({ description: '역할' })
  role: string;

  @ApiProperty({ description: '사용자 수' })
  count: number;

  @ApiProperty({ description: '비율 (%)' })
  percentage: number;
}

/**
 * 사용자 통계 응답 DTO
 */
export class UserStatisticsDto {
  @ApiProperty({ description: '전체 사용자 수' })
  totalUsers: number;

  @ApiProperty({ description: '활성 사용자 수' })
  activeUsers: number;

  @ApiProperty({ description: '비활성 사용자 수' })
  inactiveUsers: number;

  @ApiProperty({ description: '정지된 사용자 수' })
  bannedUsers: number;

  @ApiProperty({ description: '이메일 인증 완료 사용자 수' })
  emailVerifiedUsers: number;

  @ApiProperty({ description: '역할별 사용자 분포', type: [UsersByRoleDto] })
  usersByRole: UsersByRoleDto[];

  @ApiProperty({ description: '신규 가입 트렌드 (일별)', type: [TrendDataDto] })
  registrationTrend: TrendDataDto[];

  @ApiProperty({ description: '로그인 활동 트렌드 (일별)', type: [TrendDataDto] })
  loginActivityTrend: TrendDataDto[];

  @ApiProperty({ description: '기간 내 신규 가입 수' })
  newRegistrations: number;

  @ApiProperty({ description: '기간 내 활성 사용자 수' })
  periodActiveUsers: number;
}
