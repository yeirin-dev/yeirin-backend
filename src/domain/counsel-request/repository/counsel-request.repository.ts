import { CounselRequest } from '../model/counsel-request';
import { CounselRequestStatus } from '../model/value-objects/counsel-request-enums';

/**
 * CounselRequest Repository Interface
 * (도메인 계층 - 프레임워크 독립)
 */
export interface CounselRequestRepository {
  /**
   * 저장 (생성 또는 수정)
   */
  save(counselRequest: CounselRequest): Promise<CounselRequest>;

  /**
   * ID로 조회
   */
  findById(id: string): Promise<CounselRequest | null>;

  /**
   * 아동 ID로 조회
   */
  findByChildId(childId: string): Promise<CounselRequest[]>;

  /**
   * 보호자 ID로 조회
   */
  findByGuardianId(guardianId: string): Promise<CounselRequest[]>;

  /**
   * 상태별 조회
   */
  findByStatus(status: CounselRequestStatus): Promise<CounselRequest[]>;

  /**
   * 기관 ID로 매칭된 의뢰 조회
   */
  findByInstitutionId(institutionId: string): Promise<CounselRequest[]>;

  /**
   * 상담사 ID로 매칭된 의뢰 조회
   */
  findByCounselorId(counselorId: string): Promise<CounselRequest[]>;

  /**
   * 페이지네이션 조회 (필터 지원)
   */
  findAll(
    page: number,
    limit: number,
    status?: CounselRequestStatus,
  ): Promise<{
    data: CounselRequest[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * 삭제 (Soft Delete 권장)
   */
  delete(id: string): Promise<void>;

  /**
   * 보호자별 상담의뢰 통계 조회
   */
  countByGuardianIdAndStatus(
    guardianId: string,
  ): Promise<{
    total: number;
    pending: number;
    recommended: number;
    matched: number;
    inProgress: number;
    completed: number;
    rejected: number;
  }>;

  /**
   * 보호자별 최근 활동 조회 (최근 N일간 변경된 상담의뢰)
   */
  findRecentByGuardianId(
    guardianId: string,
    days: number,
  ): Promise<CounselRequest[]>;
}
