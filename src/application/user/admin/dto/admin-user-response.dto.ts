import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Admin 사용자 응답 DTO
 */
export class AdminUserResponseDto {
  @ApiProperty({ description: '사용자 ID' })
  id: string;

  @ApiProperty({ description: '이메일' })
  email: string;

  @ApiProperty({ description: '실명' })
  realName: string;

  @ApiProperty({ description: '전화번호' })
  phoneNumber: string;

  @ApiProperty({
    description: '역할',
    enum: ['GUARDIAN', 'INSTITUTION_ADMIN', 'COUNSELOR', 'ADMIN'],
  })
  role: string;

  @ApiProperty({ description: '이메일 인증 여부' })
  isEmailVerified: boolean;

  @ApiProperty({ description: '활성 상태' })
  isActive: boolean;

  @ApiProperty({ description: '정지 상태' })
  isBanned: boolean;

  @ApiPropertyOptional({ description: '정지 사유' })
  banReason?: string;

  @ApiPropertyOptional({ description: '정지 일시' })
  bannedAt?: Date;

  @ApiPropertyOptional({ description: '마지막 로그인 일시' })
  lastLoginAt?: Date;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
}

/**
 * Admin 사용자 상세 응답 DTO (프로필 정보 포함)
 */
export class AdminUserDetailResponseDto extends AdminUserResponseDto {
  @ApiPropertyOptional({ description: '보호자 프로필' })
  guardianProfile?: {
    id: string;
    careFacilityId?: string;
    careFacilityName?: string;
    communityChildCenterId?: string;
    communityChildCenterName?: string;
    childrenCount: number;
  };

  @ApiPropertyOptional({ description: '상담사 프로필' })
  counselorProfile?: {
    id: string;
    institutionId: string;
    institutionName: string;
    specializations: string[];
    isActive: boolean;
  };

  @ApiPropertyOptional({ description: '기관 관리자 정보' })
  institutionAdmin?: {
    institutionId: string;
    institutionName: string;
    role: string;
  };

  @ApiPropertyOptional({ description: '최근 활동 요약' })
  activitySummary?: {
    totalCounselRequests: number;
    activeCounselRequests: number;
    completedCounselRequests: number;
    lastActivityAt?: Date;
  };
}
