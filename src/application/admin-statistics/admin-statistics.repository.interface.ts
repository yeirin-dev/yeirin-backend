/**
 * Admin Statistics Repository Interface
 * 관리자 통계 조회를 위한 읽기 전용 Repository
 * (Application Layer - 통계 집계용 쿼리 전용)
 */
export interface AdminStatisticsRepository {
  // ============ User Statistics ============

  /**
   * 역할별 사용자 수 조회
   */
  countUsersByRole(): Promise<Record<string, number>>;

  /**
   * 활성 사용자 수 조회 (최근 N일간 로그인)
   */
  countActiveUsers(days: number): Promise<number>;

  /**
   * 비활성 사용자 수 조회
   */
  countInactiveUsers(): Promise<number>;

  /**
   * 정지된 사용자 수 조회
   */
  countBannedUsers(): Promise<number>;

  /**
   * 이메일 인증 완료 사용자 수 조회
   */
  countEmailVerifiedUsers(): Promise<number>;

  /**
   * 기간별 신규 가입 수 조회
   */
  getRegistrationTrend(
    startDate: Date,
    endDate: Date,
    period: 'day' | 'week' | 'month',
  ): Promise<{ period: string; count: number }[]>;

  /**
   * 기간별 로그인 활동 조회
   */
  getLoginActivityTrend(
    startDate: Date,
    endDate: Date,
    period: 'day' | 'week' | 'month',
  ): Promise<{ period: string; count: number }[]>;

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

  // ============ Institution Statistics ============

  /**
   * 전체 기관 수 조회
   */
  countInstitutions(): Promise<number>;

  /**
   * 활성 기관 수 조회
   */
  countActiveInstitutions(): Promise<number>;

  /**
   * 기관별 성과 메트릭 조회
   */
  getInstitutionPerformanceMetrics(
    startDate?: Date,
    endDate?: Date,
    sortBy?: 'totalCounsel' | 'completionRate' | 'rating',
    limit?: number,
  ): Promise<
    {
      institutionId: string;
      institutionName: string;
      totalCounselCount: number;
      completedCounselCount: number;
      inProgressCounselCount: number;
      averageRating: number;
      reviewCount: number;
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
