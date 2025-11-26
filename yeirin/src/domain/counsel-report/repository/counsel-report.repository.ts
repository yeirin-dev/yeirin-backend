import { CounselReport } from '../model/counsel-report';
import { ReportStatus } from '../model/value-objects/report-status';

/**
 * 면담결과지 Repository 인터페이스
 *
 * @description
 * Domain Layer에서 정의하는 저장소 인터페이스
 * Infrastructure Layer에서 구현체(CounselReportRepositoryImpl) 제공
 */
export interface CounselReportRepository {
  /**
   * 면담결과지 저장 (생성 및 수정)
   */
  save(counselReport: CounselReport): Promise<CounselReport>;

  /**
   * ID로 면담결과지 조회
   */
  findById(id: string): Promise<CounselReport | null>;

  /**
   * 상담의뢰지 ID와 회차로 면담결과지 조회
   * - 같은 의뢰지에 대해 회차는 유니크
   */
  findByCounselRequestIdAndSession(
    counselRequestId: string,
    sessionNumber: number,
  ): Promise<CounselReport | null>;

  /**
   * 상담의뢰지 ID로 모든 면담결과지 조회
   * - 1개의 의뢰지에 여러 회차 결과지
   */
  findByCounselRequestId(counselRequestId: string): Promise<CounselReport[]>;

  /**
   * 아동 ID로 모든 면담결과지 조회
   * - 한 아동이 여러 의뢰지를 가질 수 있고, 각 의뢰지마다 여러 결과지
   */
  findByChildId(childId: string): Promise<CounselReport[]>;

  /**
   * 상담사 ID로 면담결과지 조회 (페이지네이션)
   * - 상담사가 작성한 모든 면담결과지
   */
  findByCounselorId(
    counselorId: string,
    page: number,
    limit: number,
  ): Promise<{ reports: CounselReport[]; total: number }>;

  /**
   * 기관 ID로 면담결과지 조회 (페이지네이션)
   * - 해당 기관에서 발행한 모든 면담결과지
   */
  findByInstitutionId(
    institutionId: string,
    page: number,
    limit: number,
  ): Promise<{ reports: CounselReport[]; total: number }>;

  /**
   * 상태별 면담결과지 조회
   */
  findByStatus(
    status: ReportStatus,
    page: number,
    limit: number,
  ): Promise<{ reports: CounselReport[]; total: number }>;

  /**
   * 보호자 ID로 면담결과지 조회 (아동을 통한 간접 조회)
   * - 보호자가 확인할 수 있는 모든 면담결과지 (자녀들의 결과지)
   */
  findByGuardianId(guardianId: string): Promise<CounselReport[]>;

  /**
   * 면담결과지 삭제
   */
  delete(id: string): Promise<void>;

  /**
   * 상담의뢰지의 다음 회차 번호 조회
   * - 기존 최대 회차 + 1
   */
  getNextSessionNumber(counselRequestId: string): Promise<number>;

  /**
   * 상담의뢰지의 면담결과지 개수 조회
   */
  countByCounselRequestId(counselRequestId: string): Promise<number>;
}
