import { CounselSession } from '../model/counsel-session';

export interface CounselSessionRepository {
  save(session: CounselSession): Promise<CounselSession>;
  findById(id: string): Promise<CounselSession | null>;
  findByInstitutionIdAndDateRange(
    institutionId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CounselSession[]>;
  findByVoucherLinkageId(voucherLinkageId: string): Promise<CounselSession[]>;
  getNextSessionNumber(voucherLinkageId: string): Promise<number>;
  delete(id: string): Promise<void>;
}

export const COUNSEL_SESSION_REPOSITORY = 'CounselSessionRepository';
