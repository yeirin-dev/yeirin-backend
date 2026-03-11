import { FastTrackCounselingReferral } from '../model/fast-track-referral';

/**
 * FastTrackReferral Repository 인터페이스
 * Domain Layer (프레임워크 독립)
 */
export interface FastTrackReferralRepository {
  /**
   * 저장 (생성 또는 수정)
   */
  save(referral: FastTrackCounselingReferral): Promise<FastTrackCounselingReferral>;

  /**
   * ID로 조회
   */
  findById(id: string): Promise<FastTrackCounselingReferral | null>;

  /**
   * 전체 조회
   */
  findAll(): Promise<FastTrackCounselingReferral[]>;
}
