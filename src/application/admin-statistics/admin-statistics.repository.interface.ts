/**
 * Admin Statistics Repository Interface
 * 관리자 통계 조회를 위한 읽기 전용 Repository
 * (Application Layer - 통계 집계용 쿼리 전용)
 *
 * NOTE: 이메일 기반 User 통계 기능 제거됨. 기관 기반 인증으로 전환.
 */
export interface AdminStatisticsRepository {
  // ============ Counsel Request Statistics ============

  /**
   * 상태별 상담의뢰 수 조회
   */
  countCounselRequestsByStatus(): Promise<Record<string, number>>;

  /**
   * 기간별 상담의뢰 추이 조회
   */
  getCounselRequestTrend(
    startDate: Date,
    endDate: Date,
    period: 'day' | 'week' | 'month',
  ): Promise<{ period: string; created: number; completed: number; rejected: number }[]>;

  /**
   * 전환 퍼널 메트릭 조회
   */
  getConversionFunnelMetrics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ stage: string; count: number }[]>;

  /**
   * 평균 처리 시간 조회 (일)
   */
  getAverageProcessingDays(startDate?: Date, endDate?: Date): Promise<number>;

  /**
   * 평균 매칭 시간 조회 (시간)
   */
  getAverageMatchingHours(startDate?: Date, endDate?: Date): Promise<number>;

  // ============ Institution Statistics (CareFacility + CommunityChildCenter) ============

  /**
   * 전체 시설 수 조회 (양육시설 + 지역아동센터)
   */
  countInstitutions(): Promise<number>;

  /**
   * 활성 시설 수 조회
   */
  countActiveInstitutions(): Promise<number>;

  /**
   * 시설별 아동 현황 조회
   */
  getInstitutionChildMetrics(
    startDate?: Date,
    endDate?: Date,
    limit?: number,
  ): Promise<
    {
      institutionId: string;
      institutionName: string;
      institutionType: 'CARE_FACILITY' | 'COMMUNITY_CENTER';
      totalChildCount: number;
      counselRequestCount: number;
    }[]
  >;

  // ============ Child Statistics ============

  /**
   * 전체 아동 수 조회
   */
  countChildren(): Promise<number>;

  /**
   * 아동 유형별 수 조회
   */
  countChildrenByType(): Promise<Record<string, number>>;

  /**
   * 심리 상태별 아동 수 조회
   */
  countChildrenByPsychologicalStatus(): Promise<Record<string, number>>;

  /**
   * 연령대별 아동 수 조회
   */
  countChildrenByAgeGroup(): Promise<Record<string, number>>;

  /**
   * 성별 아동 수 조회
   */
  countChildrenByGender(): Promise<Record<string, number>>;

  /**
   * 상담 이력이 있는 아동 수 조회
   */
  countChildrenWithCounselHistory(): Promise<number>;

  /**
   * 현재 상담 중인 아동 수 조회
   */
  countChildrenInActiveCounseling(): Promise<number>;
}
