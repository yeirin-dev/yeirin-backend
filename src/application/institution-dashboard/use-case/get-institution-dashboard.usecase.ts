import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ChildRepository } from '@domain/child/repository/child.repository';
import { CounselRequestStatus } from '@domain/counsel-request/model/value-objects/counsel-request-enums';
import { CounselRequestRepository } from '@domain/counsel-request/repository/counsel-request.repository';
import {
  InstitutionDashboardResponseDto,
  RecentActivityDto,
} from '../dto/institution-dashboard-response.dto';

interface GetDashboardParams {
  institutionId: string;
  facilityType: 'CARE_FACILITY' | 'COMMUNITY_CENTER' | 'EDUCATION_WELFARE_SCHOOL';
}

/**
 * 시설 대시보드 조회 유스케이스
 *
 * 시설 로그인 후 대시보드 정보를 조회합니다:
 * - 소속 아동 수
 * - 상담의뢰 상태별 통계
 * - 최근 활동 목록
 */
@Injectable()
export class GetInstitutionDashboardUseCase {
  private readonly logger = new Logger(GetInstitutionDashboardUseCase.name);

  constructor(
    @Inject('ChildRepository')
    private readonly childRepository: ChildRepository,
    @Inject('CounselRequestRepository')
    private readonly counselRequestRepository: CounselRequestRepository,
  ) {}

  async execute(params: GetDashboardParams): Promise<InstitutionDashboardResponseDto> {
    const { institutionId, facilityType } = params;

    // 시설 유형에 따라 아동 목록 조회
    let children;
    switch (facilityType) {
      case 'CARE_FACILITY':
        children = await this.childRepository.findByCareFacilityId(institutionId);
        break;
      case 'COMMUNITY_CENTER':
        children = await this.childRepository.findByCommunityChildCenterId(institutionId);
        break;
      case 'EDUCATION_WELFARE_SCHOOL':
        children = await this.childRepository.findByEducationWelfareSchoolId(institutionId);
        break;
      default:
        throw new BadRequestException(`알 수 없는 시설 유형: ${facilityType}`);
    }

    const childrenCount = children.length;
    const childIds = children.map((child) => child.id);

    // 각 아동의 상담의뢰 조회
    const allCounselRequests = await Promise.all(
      childIds.map((childId) => this.counselRequestRepository.findByChildId(childId)),
    );
    const counselRequests = allCounselRequests.flat();

    // 상태별 카운트
    const totalCounselRequests = counselRequests.length;
    const matchedCount = counselRequests.filter(
      (cr) => cr.status === CounselRequestStatus.MATCHED,
    ).length;
    const inProgressCount = counselRequests.filter(
      (cr) => cr.status === CounselRequestStatus.IN_PROGRESS,
    ).length;
    const pendingCount = counselRequests.filter(
      (cr) =>
        cr.status === CounselRequestStatus.PENDING ||
        cr.status === CounselRequestStatus.RECOMMENDED,
    ).length;
    const completedCount = counselRequests.filter(
      (cr) => cr.status === CounselRequestStatus.COMPLETED,
    ).length;

    // 최근 활동 목록 (최근 10개)
    const childMap = new Map(children.map((c) => [c.id, c.name.value]));
    const recentActivities = this.getRecentActivities(counselRequests, childMap);

    this.logger.log('대시보드 조회 완료', {
      institutionId,
      facilityType,
      childrenCount,
      totalCounselRequests,
    });

    return {
      childrenCount,
      totalCounselRequests,
      matchedCount,
      inProgressCount,
      pendingCount,
      completedCount,
      recentActivities,
    };
  }

  private getRecentActivities(
    counselRequests: {
      id: string;
      childId: string;
      status: CounselRequestStatus;
      updatedAt: Date;
    }[],
    childMap: Map<string, string>,
  ): RecentActivityDto[] {
    // 최신순 정렬 후 10개 추출
    const sorted = [...counselRequests].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
    const recent = sorted.slice(0, 10);

    return recent.map((cr) => ({
      counselRequestId: cr.id,
      childName: childMap.get(cr.childId) || '알 수 없음',
      activityType: cr.status,
      description: this.getActivityDescription(cr.status),
      activityAt: cr.updatedAt.toISOString(),
    }));
  }

  private getActivityDescription(status: CounselRequestStatus): string {
    switch (status) {
      case CounselRequestStatus.PENDING:
        return '상담의뢰지가 접수되었습니다';
      case CounselRequestStatus.RECOMMENDED:
        return 'AI 기관 추천이 완료되었습니다';
      case CounselRequestStatus.MATCHED:
        return '상담 기관이 매칭되었습니다';
      case CounselRequestStatus.IN_PROGRESS:
        return '상담이 시작되었습니다';
      case CounselRequestStatus.COMPLETED:
        return '상담이 완료되었습니다';
      case CounselRequestStatus.REJECTED:
        return '매칭이 거부되었습니다';
      default:
        return '상태가 변경되었습니다';
    }
  }
}
