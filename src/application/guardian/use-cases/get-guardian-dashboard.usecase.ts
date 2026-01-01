import { Inject, Injectable } from '@nestjs/common';
import { ChildRepository } from '@domain/child/repository/child.repository';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import { GuardianProfileRepository } from '@domain/guardian/repository/guardian-profile.repository';
import { GuardianDashboardDto, RecentActivityDto } from '../dto/guardian-dashboard.dto';

/**
 * 보호자 대시보드 통계 조회 UseCase
 *
 * 비즈니스 로직:
 * 1. userId로 guardianProfileId 조회
 * 2. 보호자가 등록한 아동 수 조회
 * 3. 보호자의 상담의뢰 상태별 통계 조회
 * 4. 최근 7일간 활동 조회
 */
@Injectable()
export class GetGuardianDashboardUseCase {
  constructor(
    @Inject('ChildRepository')
    private readonly childRepository: ChildRepository,
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
    @Inject('GuardianProfileRepository')
    private readonly guardianProfileRepository: GuardianProfileRepository,
  ) {}

  async execute(userId: string): Promise<GuardianDashboardDto> {
    // 1. userId로 guardianProfile 조회
    const guardianProfile = await this.guardianProfileRepository.findByUserId(userId);
    const guardianProfileId = guardianProfile?.id;
    const guardianType = guardianProfile?.guardianType;

    // 2. 보호자 유형에 따라 다른 방식으로 아동 수 조회
    // NOTE: 모든 아동은 시설(Institution)에 직접 연결됩니다.
    //       일반 보호자(부모) 유형은 더 이상 지원되지 않습니다.
    let childrenCount = 0;
    if (guardianProfile) {
      // 양육시설 선생님: careFacilityId로 조회
      if (guardianType === 'CARE_FACILITY_TEACHER' && guardianProfile.careFacilityId) {
        childrenCount = await this.childRepository.countByCareFacilityId(
          guardianProfile.careFacilityId,
        );
      }
      // 지역아동센터 선생님: communityChildCenterId로 조회
      else if (
        guardianType === 'COMMUNITY_CENTER_TEACHER' &&
        guardianProfile.communityChildCenterId
      ) {
        childrenCount = await this.childRepository.countByCommunityChildCenterId(
          guardianProfile.communityChildCenterId,
        );
      }
      // 일반 보호자 (부모) 유형은 더 이상 지원되지 않음 - childrenCount는 0으로 유지
    }

    // 3. 상담의뢰 상태별 통계 조회 (userId 사용 - counsel_requests는 guardianId가 userId와 동일)
    const stats = await this.counselRequestRepository.countByGuardianIdAndStatus(userId);

    // 4. 최근 7일간 활동 조회
    const recentRequests = await this.counselRequestRepository.findRecentByGuardianId(userId, 7);

    // 5. 최근 활동을 DTO로 변환
    const recentActivities: RecentActivityDto[] = recentRequests.map((request) => ({
      counselRequestId: request.id,
      childName: request.formData?.basicInfo?.childInfo?.name || '알 수 없음',
      activityType: request.status,
      description: this.getActivityDescription(request.status),
      activityAt: request.updatedAt,
    }));

    return {
      childrenCount,
      totalCounselRequests: stats.total,
      matchedCount: stats.matched,
      inProgressCount: stats.inProgress,
      pendingCount: stats.pending + stats.recommended,
      completedCount: stats.completed,
      recentActivities,
    };
  }

  private getActivityDescription(status: string): string {
    switch (status) {
      case 'PENDING':
        return '상담의뢰지가 접수되었습니다';
      case 'RECOMMENDED':
        return 'AI 추천이 완료되었습니다';
      case 'MATCHED':
        return '상담기관이 매칭되었습니다';
      case 'IN_PROGRESS':
        return '상담이 진행 중입니다';
      case 'COMPLETED':
        return '상담이 완료되었습니다';
      case 'REJECTED':
        return '상담의뢰가 거절되었습니다';
      default:
        return '상태가 변경되었습니다';
    }
  }
}
