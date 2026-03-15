import { CounselRecord } from '../model/counsel-record';

export interface CounselRecordRepository {
  save(record: CounselRecord): Promise<CounselRecord>;
  findById(id: string): Promise<CounselRecord | null>;
  findByCounselSessionId(sessionId: string): Promise<CounselRecord | null>;
  findByInstitutionId(
    institutionId: string,
    page: number,
    limit: number,
  ): Promise<{ records: CounselRecord[]; total: number }>;
  findByVoucherLinkageId(voucherLinkageId: string): Promise<CounselRecord[]>;
  findByChildId(childId: string): Promise<CounselRecord[]>;
}

export const COUNSEL_RECORD_REPOSITORY = 'CounselRecordRepository';
